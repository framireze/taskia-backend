import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { TableItemTypeEnum } from "../enum/table.enum";
import { Type } from "class-transformer";

export class TableBatchRecordsDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
  
    @IsString()
    @IsNotEmpty()
    nodeId: string;       
  
    @IsString()
    @IsNotEmpty()
    table_name: string;
  
    @IsEnum([TableItemTypeEnum.RECORD], { message: 'Type must be RECORD' })
    @IsNotEmpty()
    type: TableItemTypeEnum.RECORD;
  
    @IsArray()
    @ArrayMinSize(1)
    @Type(() => Object)
    records: Record<string, any>[];
}