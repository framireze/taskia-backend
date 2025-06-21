import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { ColumnTypeEnum, TableItemTypeEnum } from "../enum/table.enum";
import { Type } from "class-transformer";

class HeaderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: ColumnTypeEnum;

  @IsArray()
  @IsOptional()
  enumOptions: string[];

  @IsBoolean()
  allowSort: boolean;
}

export class TableNewItemDto {
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

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HeaderDto)
  columns: HeaderDto[];

  @IsOptional()
  @IsObject()
  @IsNotEmpty()
  record: Record<string, any>;
}