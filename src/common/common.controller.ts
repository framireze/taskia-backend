import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommonService } from './common.service';

@Controller('')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('countries')
  getCountries() {
    return this.commonService.getCountries();
  }

  @Get('id-types')
  getIdTypes() {
    return this.commonService.getIdTypes();
  }
}
