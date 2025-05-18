import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Profile } from "../enum/profile.enum";

export class CreateUserDto{
    @IsEnum(Profile)
    profile: Profile;

    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    lastName: string;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    phone: string;

    @IsOptional()
    @IsNumber()
    country_id: number;                //Codigo del Pais

    @IsOptional()
    @IsString()
    country: string;

    @IsOptional()
    @IsNumber()
    documentTypeID: number;

    @IsOptional()
    @IsString()
    documentID: string;

    @IsOptional()
    @IsString()
    iconImage: string;

    @IsOptional()
    @IsString()
    password: string;
}