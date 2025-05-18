import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/t_country.entity';
import { IdType } from './entities/t_idType.entity';

@Module({
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
  imports: [TypeOrmModule.forFeature([Country, IdType])],
})
export class CommonModule {}
