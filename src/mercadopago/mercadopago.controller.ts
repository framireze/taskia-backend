import { Controller, Post, Body } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { MpCreatePreferenceDto } from './dto/mp-create-preference.dto';

@Controller('mercadopago')
export class MercadopagoController {
  constructor(private readonly mercadopagoService: MercadopagoService) {}

  @Post('create-preference')
  createPreference(@Body() body: MpCreatePreferenceDto) {
    return this.mercadopagoService.createPreference(body);
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.mercadopagoService.webhook(body);
  }
}
