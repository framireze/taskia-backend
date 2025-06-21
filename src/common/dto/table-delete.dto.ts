import { IsNotEmpty, IsString } from "class-validator";

export class TableDeleteDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
  
    @IsString()
    @IsNotEmpty()
    nodeId: string;       
  
    @IsString()
    @IsNotEmpty()
    table_name: string;
}