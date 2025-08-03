import { IsOptional, IsString } from 'class-validator';

export class QueryCountriesDto {
  @IsOptional()
  @IsString()
  isoCode2: string;
}