import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { NodeType } from "../enums/node-type.enum";

export class CreateNodeDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    nodeName: string;

    @IsOptional()
    @IsString()
    parentId: string;

    @IsEnum(NodeType)
    type: NodeType;
}
