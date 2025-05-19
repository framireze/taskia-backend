import { IsOptional, IsString } from "class-validator";

export class UpdateNodeDto {
    @IsOptional()
    @IsString()
    nodeName: string;

    @IsOptional()
    @IsString()
    parentId: string;
}
