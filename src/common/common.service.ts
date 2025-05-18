import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/t_country.entity';
import { ApiResponse } from 'src/interfaces/api-response.interface';
import { IdType } from './entities/t_idType.entity';

@Injectable()
export class CommonService {
  constructor(
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(IdType)
    private idTypeRepository: Repository<IdType>,
  ) {}

  async getCountries(): Promise<ApiResponse<Country[]>> {
    const countries = await this.countryRepository.find();
    return { success: true, message: 'Countries fetched successfully', data: countries };
  }

  async getIdTypes(): Promise<ApiResponse<IdType[]>> {
    const idTypes = await this.idTypeRepository.find();
    return { success: true, message: 'Id types fetched successfully', data: idTypes };
  }
}
