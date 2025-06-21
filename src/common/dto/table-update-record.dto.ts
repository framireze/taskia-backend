import { IsEnum, IsNotEmpty, IsObject, IsString } from "class-validator";
import { TableItemTypeEnum } from "../enum/table.enum";

export class TableUpdateRecordDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    nodeId: string;

    @IsString()
    @IsNotEmpty()
    table_name: string;

    @IsEnum([TableItemTypeEnum.RECORD], { message: 'Type must be: record' })
    @IsNotEmpty()
    type: TableItemTypeEnum;

    @IsString()
    @IsNotEmpty()
    recordId: string;

    @IsObject()
    @IsNotEmpty()
    record: Record<string, any>;
}