import { IsEmail, IsEnum, IsString } from "class-validator";
import { Profile } from "../enum/profile.enum";

export class LogindDto {
    @IsEnum(Profile)
    profile: Profile;

    @IsEmail()
    email: string;
    
    @IsString()
    password: string;
}