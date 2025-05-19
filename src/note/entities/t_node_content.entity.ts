import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NodeEntity } from './t_node.entity';
import { User } from 'src/auth/entities/t_users.entity';
  
  
  @Entity('T_NODE_FILE_CONTENT')
  export class NodeFileContentEntity {
    @PrimaryColumn({ name: 'file_content_id', type: 'char', length: 36 })
    fileContentId: string;
  
    @Column({ name: 'node_id', type: 'char', length: 36 })
    nodeId: string;
  
    @Column({ name: 'user_id', type: 'char', length: 36 })
    userId: string;
  
    @Column({ name: 'content', type: 'text', nullable: true })
    content?: string;
  
    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
    updatedAt?: Date;
  
    @ManyToOne(() => NodeEntity, node => node.fileContents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'node_id' })
    node: NodeEntity;
  
    @ManyToOne(() => User, user => user.fileContents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  }