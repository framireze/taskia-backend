import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class MpCreatePreferenceDto {
  @IsString()
  productId: string; // ID de tu producto/servicio
  
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  unit_price: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  currency: string; //PEN, ARS, USD, etc.

  @IsArray()
  @IsOptional()
  payment_methods: any;

  @IsString()
  @IsOptional()
  payerEmail: string;         //email del comprador

  @IsString()
  @IsOptional()
  orderId: string; // Tu ID de orden interno
}