import { IsString, MinLength } from "class-validator";

export class VerifyTokenDto{
    @IsString()
    @MinLength(5)
    token: string;
}