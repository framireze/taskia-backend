import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/t_country.entity';
import { IdType } from './entities/t_idType.entity';
import { createDynamoDBClient } from '../config/dynamodb.config';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const DYNAMODB_CLIENT = 'DYNAMODB_CLIENT';

@Module({
  controllers: [CommonController],
  providers: [CommonService, {
    provide: DYNAMODB_CLIENT,
    useFactory: (configService: ConfigService) => createDynamoDBClient(configService),
    inject: [ConfigService],
  }],
  exports: [CommonService, DYNAMODB_CLIENT],
  imports: [
    TypeOrmModule.forFeature([Country, IdType]),
    ConfigModule
  ],
})
export class CommonModule { }
