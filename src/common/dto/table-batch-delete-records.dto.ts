import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { TableItemTypeEnum } from "../enum/table.enum";

export class TableBatchDeleteRecordsDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    nodeId: string;

    @IsString()
    @IsNotEmpty()
    table_name: string;

    @IsEnum([TableItemTypeEnum.RECORD], { message: 'type must be RECORD' })
    @IsNotEmpty()
    type: TableItemTypeEnum.RECORD;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    recordIds: string[];
}