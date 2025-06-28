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

  async getCountries(): Promise<ApiResponse<Country[]>> {
    const countries = await this.countryRepository.find();
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
