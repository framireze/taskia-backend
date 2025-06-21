import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { CommonService } from './common.service';
import { TableNewItemDto } from './dto/table-new-item.dto';
import { TableDeleteItemDto } from './dto/table-delete-item.dto';
import { TableUpdateRecordDto } from './dto/table-update-record.dto';
import { TableDeleteDto } from './dto/table-delete.dto';

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

  @Post('table/new-item')
  newItem(@Body() tableNewItemDto: TableNewItemDto) {
    return this.commonService.newItem(tableNewItemDto);
  }

  @Get('table/detail/:userId/:nodeId')
  getAllDetail(@Param('userId') userId: string, @Param('nodeId') nodeId: string) {
    return this.commonService.getTableDetail(userId, nodeId);
  }

  @Put('table/update-record')
  updateRecord(@Body() tableUpdateRecordDto: TableUpdateRecordDto) {
    return this.commonService.updateRecordItem(tableUpdateRecordDto);
  }

  @Delete('table/delete-item')
  deleteItem(@Body() tableDeleteItemDto: TableDeleteItemDto) {
    return this.commonService.removeItem(tableDeleteItemDto);
  }

  @Delete('table/delete-table')
  deleteTable(@Body() tableDeleteDto: TableDeleteDto) {
    return this.commonService.removeTable(tableDeleteDto);
  }
}
