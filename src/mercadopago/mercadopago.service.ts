import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MpCreatePreferenceDto } from './dto/mp-create-preference.dto';
import { JsonWebTokenError } from 'jsonwebtoken';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MercadopagoService {
  private readonly logger = new Logger(MercadopagoService.name);
  private readonly client: MercadoPagoConfig;
  private readonly frontedAppBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get('MP_ACCESS_TOKEN') as string,
    });
    this.frontedAppBaseUrl = this.configService.get('FRONTED_APP_BASE_URL') as string;

  }

  async createPreference(body: MpCreatePreferenceDto) {
    try {
      const preference = new Preference(this.client);
      console.log('frontedAppBaseUrl', this.frontedAppBaseUrl);
      const response = await preference.create({
        body: {
          items: [
            {
              id: body.productId || `PLAN_${Date.now()}`,
              title: body.title,
              unit_price: body.unit_price,
              quantity: body.quantity,
              currency_id: body.currency
            }
          ],
          payer: {
            email: body.payerEmail
          },
          back_urls: {
            success: `${this.frontedAppBaseUrl}/processPayment/success`,
            failure: `${this.frontedAppBaseUrl}/processPayment/failure`,
            pending: `${this.frontedAppBaseUrl}/processPayment/pending`
          },
          //auto_return: 'approved',        //En local se debe comentar esta linea sino se rompe
          payment_methods: {
            installments: 1,              //1 cuota
            default_installments: 1,
            excluded_payment_methods: [
              { id: 'ticket' },             //Excluye boleta
              { id: 'bank_transfer' }       //Excluye transferencia bancaria
            ]
          },
          statement_descriptor: 'TASKIA',
        }
      });
      return { success: true, message: 'Preference created successfully', data: response };
    } catch (error) {
      console.log('error', error);
      this.handleException(error);
    }
  }

  async webhook(body: any) {
    return body;
  }

  private handleException(error: Error) {
    this.logger.error(error.message, error.stack);

    if (error instanceof NotFoundException) {
      throw error;
    } else if (error.name === 'QueryFailedError') {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof BadRequestException) {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof ConflictException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof UnauthorizedException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException({ success: false, message: error.message })
    } else {
      throw new InternalServerErrorException({
        success: false,
        message: 'An error occurred',
      });
    }
  }
}
