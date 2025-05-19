import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeEntity } from './entities/t_node.entity';
import { User } from 'src/auth/entities/t_users.entity';

@Module({
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
  imports: [TypeOrmModule.forFeature([NodeEntity, User])],
})
export class NoteModule {}
