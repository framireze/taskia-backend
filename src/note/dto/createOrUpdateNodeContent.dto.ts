import { IsNotEmpty, IsString } from "class-validator";

export class CreateOrUpdateNodeContentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    userId: string;
}
