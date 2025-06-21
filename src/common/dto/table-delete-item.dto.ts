import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TableItemTypeEnum } from "../enum/table.enum";

export class TableDeleteItemDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
  
    @IsString()
    @IsNotEmpty()
    nodeId: string;       
  
    @IsString()
    @IsNotEmpty()
    table_name: string;
  
    @IsEnum(TableItemTypeEnum)
    @IsNotEmpty()
    type: TableItemTypeEnum;

    @IsString()
    @IsOptional()
    recordId: string;
}