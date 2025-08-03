import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { CommonService } from './common.service';
import { TableNewItemDto } from './dto/table-new-item.dto';
import { TableDeleteItemDto } from './dto/table-delete-item.dto';
import { TableUpdateRecordDto } from './dto/table-update-record.dto';
import { TableDeleteDto } from './dto/table-delete.dto';
import { TableBatchRecordsDto } from './dto/table-batch-records.dto';
import { TableBatchDeleteRecordsDto } from './dto/table-batch-delete-records.dto';
import { QueryCountriesDto } from './dto/query-countries.dto';

@Controller('')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('countries')
  getCountries(@Query() query: QueryCountriesDto) {
    return this.commonService.getCountries(query);
  }

  @Get('id-types')
  getIdTypes() {
    return this.commonService.getIdTypes();
  }

  @Post('table/new-item')
  newItem(@Body() tableNewItemDto: TableNewItemDto) {
    return this.commonService.newItem(tableNewItemDto);
  }

  @Post('table/new-records')
  newRecords(@Body() tableBatchRecordsDto: TableBatchRecordsDto) {
    return this.commonService.newItemsBatch(tableBatchRecordsDto);
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

  @Delete('table/delete-records')
  deleteRecords(@Body() tableBatchDeleteRecordsDto: TableBatchDeleteRecordsDto) {
    return this.commonService.removeItemsBatch(tableBatchDeleteRecordsDto);
  }

  @Delete('table/delete-table')
  deleteTable(@Body() tableDeleteDto: TableDeleteDto) {
    return this.commonService.removeTable(tableDeleteDto);
  }
}
