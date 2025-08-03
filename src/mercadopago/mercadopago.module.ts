import { Module } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { MercadopagoController } from './mercadopago.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [MercadopagoController],
  providers: [MercadopagoService],
  imports: [ConfigModule],
})
export class MercadopagoModule {}
