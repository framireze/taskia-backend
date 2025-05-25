import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { NoteService } from './note.service';
import { CreateNodeDto } from './dto/createNode.dto';
import { UpdateNodeDto } from './dto/updateNode.dto';
import { CreateOrUpdateNodeContentDto } from './dto/createOrUpdateNodeContent.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('node')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createNodeDto: CreateNodeDto) {
    return this.noteService.createNode(createNodeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  getAllNodes(@Param('userId') userId: string) {
    return this.noteService.getAllNodes(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':nodeId')
  updateNode(@Param('nodeId') nodeId: string, @Body() updateNodeDto: UpdateNodeDto) {
    return this.noteService.updateNode(nodeId, updateNodeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':nodeId')
  deleteNode(@Param('nodeId') nodeId: string) {
    return this.noteService.deleteNode(nodeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':nodeId/content')
  createOrUpdateNodeContent(@Param('nodeId') nodeId: string, @Body() body: CreateOrUpdateNodeContentDto) {
    return this.noteService.createOrUpdateNodeContent(nodeId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':nodeId/content')
  getNodeContent(@Param('nodeId') nodeId: string) {
    return this.noteService.getNodeContent(nodeId);
  }
}
