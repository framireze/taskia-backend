import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/t_country.entity';
import { ApiResponse } from 'src/interfaces/api-response.interface';
import { IdType } from './entities/t_idType.entity';
import { BatchWriteCommand, DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { TableNewItemDto } from './dto/table-new-item.dto';
import { JsonWebTokenError } from 'jsonwebtoken';
import { TableItemTypeEnum } from './enum/table.enum';
import { v4 as uuidv4 } from 'uuid';
import { DynamicTableDynamoInterface } from './interfaces.ts/dynamicTable-dynamo.interface';
import { TableDeleteItemDto } from './dto/table-delete-item.dto';
import { TableUpdateRecordDto } from './dto/table-update-record.dto';
import { TableDeleteDto } from './dto/table-delete.dto';
import { TableBatchRecordsDto } from './dto/table-batch-records.dto';
import { TableBatchDeleteRecordsDto } from './dto/table-batch-delete-records.dto';
import { QueryCountriesDto } from './dto/query-countries.dto';

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);
  private readonly tableName: string;

  constructor(
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(IdType)
    private idTypeRepository: Repository<IdType>,

    @Inject('DYNAMODB_CLIENT')
    private readonly dynamoDBClient: DynamoDBDocumentClient,

    private readonly configService: ConfigService
  ) {
    this.tableName = this.configService.get('AWS_DYNAMODB_TABLE') || 'taskia_DynamicTables';
  }

  async getCountries(query: QueryCountriesDto): Promise<ApiResponse<Country[]>> {
    const { isoCode2 } = query;
    const countries = await this.countryRepository.find({ where: { isoCode2: isoCode2 }});
    if(countries.length === 0) throw new NotFoundException({ success: false, message: 'No countries found' });
    return { success: true, message: 'Countries fetched successfully', data: countries };
  }

  async getIdTypes(): Promise<ApiResponse<IdType[]>> {
    const idTypes = await this.idTypeRepository.find();
    return { success: true, message: 'Id types fetched successfully', data: idTypes };
  }

  async newItem(tableNewItemDto: TableNewItemDto) {
    const { userId, nodeId, table_name, type, columns, record } = tableNewItemDto;
    if (type === TableItemTypeEnum.RECORD && !record) throw new BadRequestException({ success: false, message: 'Record is required' });
    if (type === TableItemTypeEnum.HEADER && !columns) throw new BadRequestException({ success: false, message: 'Columns are required' });
    let recordId;
    if (type === TableItemTypeEnum.RECORD) recordId = uuidv4();
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: this.buildPrimaryKey(userId),
          SK: this.buildSortKey(nodeId, table_name, type, record ? recordId : ''),
          type,
          table: table_name,
          recordId: record ? recordId : undefined,
          columns: columns ? JSON.parse(JSON.stringify(columns)) : undefined,
          record: record ? JSON.parse(JSON.stringify(record)) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as DynamicTableDynamoInterface,
      });
      const result = await this.dynamoDBClient.send(command);

      return { success: true, message: 'Item created successfully', data: command.input.Item };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async newItemsBatch(TableBatchRecordsDto: TableBatchRecordsDto) {
    const { userId, nodeId, table_name, records, type } = TableBatchRecordsDto;
    // DynamoDB tiene un límite de 25 items por BatchWrite
    const BATCH_SIZE = 25;

    try {
      const timestamp = new Date().toISOString();
      const results = [];

      // Procesar en lotes de 25 items
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // Construir los requests para el batch
        const putRequests = batch.map(item => {
          const recordId = type === TableItemTypeEnum.RECORD ? uuidv4() : undefined;
          return {
            PutRequest: {
              Item: {
                PK: this.buildPrimaryKey(userId),
                SK: this.buildSortKey(nodeId, table_name, type, recordId || ''),
                type: type,
                table: table_name,
                recordId: recordId,
                columns: undefined,
                record: JSON.parse(JSON.stringify(item)),
                created_at: timestamp,
                updated_at: timestamp,
              } as DynamicTableDynamoInterface,
            },
          };
        });

        // Ejecutar el batch
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: putRequests,
          },
        });
        console.log('putRequests', putRequests);
        const result = await this.dynamoDBClient.send(command);
      }

      return {
        success: true,
        message: `${records.length} records created successfully`,
        totalRecords: records.length,
        batches: results.length,
        data: results
      };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async getTableDetail(userId: string, nodeId: string) {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': this.buildPrimaryKey(userId),
          ':skPrefix': `${nodeId}-TABLE-`,
        },
      });
      const { Items } = await this.dynamoDBClient.send(command);
      if (!Items || Items.length === 0) throw new NotFoundException({ success: false, message: `Table not found for nodeId: ${nodeId} and userId: ${userId}` });
      const typedItems = Items as DynamicTableDynamoInterface[] | undefined;
      const table = typedItems?.find(item => item.type === TableItemTypeEnum.HEADER)?.table;
      const columns = typedItems?.filter(item => item.type === TableItemTypeEnum.HEADER).map(item => item.columns);
      const records = typedItems?.filter(item => item.type === TableItemTypeEnum.RECORD).map(item => ({ recordId: item.recordId, record: item.record }));
      return { success: true, message: 'Table detail fetched successfully', data: { nodeId, table, columns: columns?.length ? columns[0] : [], records } };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async updateRecordItem(tableUpdateRecordDto: TableUpdateRecordDto) {
    const { userId, nodeId, table_name, type, recordId, record } = tableUpdateRecordDto;

    if (type === TableItemTypeEnum.RECORD && !record) {
      throw new BadRequestException({ success: false, message: 'Record is required' });
    }

    const updateExpressions: string[] = ['updated_at = :updated'];
    const expressionAttributeNames: any = {
      '#record': 'record'  // ✅ Alias para 'record'
    };
    const expressionAttributeValues: any = {
      ':updated': new Date().toISOString()
    };

    // Construir expresiones correctamente
    Object.entries(record).forEach(([key, value], index) => {
      const keyAlias = `#field${index}`;  // #field0, #field1, etc.
      const valueAlias = `:value${index}`; // :value0, :value1, etc.

      updateExpressions.push(`#record.${keyAlias} = ${valueAlias}`);
      expressionAttributeNames[keyAlias] = key;  // #field0 -> "Verb"
      expressionAttributeValues[valueAlias] = value; // :value0 -> "workedotado"
    });

    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: this.buildPrimaryKey(userId),
          SK: this.buildSortKey(nodeId, table_name, type, recordId)
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.dynamoDBClient.send(command);
      return {
        success: true,
        message: 'Item updated successfully',
        data: result.Attributes
      };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async removeItem(tableDeleteItemDto: TableDeleteItemDto) {
    const { userId, nodeId, table_name, type, recordId } = tableDeleteItemDto;
    if (type === TableItemTypeEnum.RECORD && !recordId) throw new BadRequestException({ success: false, message: 'RecordId is required for recordId' });
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { PK: this.buildPrimaryKey(userId), SK: this.buildSortKey(nodeId, table_name, type, recordId) },
      });
      await this.dynamoDBClient.send(command);
      return { success: true, message: 'Item deleted successfully' };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async removeItemsBatch(tableBatchDeleteItemsDto: TableBatchDeleteRecordsDto) {
    const { userId, nodeId, table_name, type, recordIds } = tableBatchDeleteItemsDto;

    // Validación
    if (!recordIds || recordIds.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'RecordIds array is required and cannot be empty'
      });
    }

    // Eliminar duplicados
    const uniqueRecordIds = [...new Set(recordIds)];
    if (uniqueRecordIds.length !== recordIds.length) {
      console.warn(`Se encontraron ${recordIds.length - uniqueRecordIds.length} IDs duplicados que serán ignorados`);
    }

    // DynamoDB tiene un límite de 25 items por BatchWrite
    const BATCH_SIZE = 25;

    try {
      const results: any[] = [];
      const errors: any[] = [];

      // Procesar en lotes de 25 items
      for (let i = 0; i < uniqueRecordIds.length; i += BATCH_SIZE) {
        const batch = uniqueRecordIds.slice(i, i + BATCH_SIZE);

        console.log(`\nProcesando lote ${Math.floor(i / BATCH_SIZE) + 1} con ${batch.length} items`);

        // Construir los requests de eliminación para el batch
        const deleteRequests = batch.map(recordId => ({
          DeleteRequest: {
            Key: {
              PK: this.buildPrimaryKey(userId),
              SK: this.buildSortKey(nodeId, table_name, type, recordId)
            }
          }
        }));

        // Ejecutar el batch
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: deleteRequests,
          },
        });

        try {
          const result = await this.dynamoDBClient.send(command);
          results.push({
            batch: Math.floor(i / BATCH_SIZE) + 1,
            processed: batch.length,
            recordIds: batch
          });

        } catch (batchError) {
          console.error(`Error en lote ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError);
          errors.push({
            batch: Math.floor(i / BATCH_SIZE) + 1,
            recordIds: batch,
            error: batchError.message
          });

        }
      }

      const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
      const totalErrors = errors.reduce((sum, e) => sum + e.recordIds.length, 0);

      console.log(`\n=== ELIMINACIÓN COMPLETADA ===`);
      console.log(`Exitosos: ${totalProcessed}`);
      console.log(`Errores: ${totalErrors}`);

      return {
        success: errors.length === 0,
        message: `${totalProcessed} items deleted successfully${totalErrors > 0 ? `, ${totalErrors} failed` : ''}`,
        totalRequested: recordIds.length,
        totalProcessed,
        totalErrors,
        batches: results,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error general en eliminación masiva:', error);
      throw this.handleException(error);
    }
  }

  async removeTable(tableDeleteDto: TableDeleteDto) {
    try {
      const { userId, nodeId, table_name } = tableDeleteDto;
      const queryCommand = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': this.buildPrimaryKey(userId),
          ':skPrefix': `${nodeId}-TABLE-${table_name}`, // Captura todo
        },
        ProjectionExpression: 'PK, SK' // Solo necesitas las keys
      });

      const { Items = [] } = await this.dynamoDBClient.send(queryCommand);

      if (Items.length === 0) {
        throw new NotFoundException(`Table ${table_name} not found`);
      }

      // 2. Eliminar en batches de 25
      const deleteRequests = Items.map(item => ({
        DeleteRequest: {
          Key: { PK: item.PK, SK: item.SK }
        }
      }));

      for (let i = 0; i < deleteRequests.length; i += 25) {
        const chunk = deleteRequests.slice(i, i + 25);

        await this.dynamoDBClient.send(new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: chunk
          }
        }));
      }

      return { success: true, message: `Table ${table_name} deleted with ${Items.length} items`, deletedCount: Items.length };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  private buildSortKey(nodeId: string, table_name: string, type: TableItemTypeEnum, rowId?: string) {
    if (type === TableItemTypeEnum.HEADER) {
      return `${nodeId}-TABLE-${table_name}-${type}`;
    } else {
      return `${nodeId}-TABLE-${table_name}-${type}-${rowId}`;
    }
  }

  private buildPrimaryKey(userId: string) {
    return `userId-${userId}`;
  }

  private handleException(error: Error) {
    this.logger.error(error.message, error.stack);

    if (error instanceof NotFoundException) {
      throw error;
    } else if (error.name === 'QueryFailedError') {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof BadRequestException) {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof ConflictException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof UnauthorizedException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException({ success: false, message: error.message })
    } else {
      throw new InternalServerErrorException({
        success: false,
        message: 'An error occurred',
      });
    }
  }
}
