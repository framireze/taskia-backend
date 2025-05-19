import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { NoteService } from './note.service';
import { CreateNodeDto } from './dto/createNode.dto';
import { UpdateNodeDto } from './dto/updateNode.dto';

@Controller('node')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  create(@Body() createNodeDto: CreateNodeDto) {
    return this.noteService.createNode(createNodeDto);
  }

  @Get(':userId')
  getAllNodes(@Param('userId') userId: string) {
    return this.noteService.getAllNodes(userId);
  }

  @Put(':nodeId')
  updateNode(@Param('nodeId') nodeId: string, @Body() updateNodeDto: UpdateNodeDto) {
    return this.noteService.updateNode(nodeId, updateNodeDto);
  }

  @Delete(':nodeId')
  deleteNode(@Param('nodeId') nodeId: string) {
    return this.noteService.deleteNode(nodeId);
  }
}
