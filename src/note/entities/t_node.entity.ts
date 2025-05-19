import { User } from 'src/auth/entities/t_users.entity';
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { NodeFileContentEntity } from './t_node_content.entity';
import { StatusNode } from '../enums/status-node.enum';
import { NodeType } from '../enums/node-type.enum';
  
  
  @Entity('T_NODES')
  @Index('uniqueNodeName', ['nodeName', 'parentId'], { unique: true })
  export class NodeEntity {
    @PrimaryColumn({ name: 'node_id', type: 'char', length: 36 })
    nodeId: string;
  
    @Column({ name: 'user_id', type: 'char', length: 36 })
    userId: string;
  
    @Column({ name: 'nodeName', type: 'char', length: 150 })
    nodeName: string;
  
    @Column({ name: 'type', type: 'enum', enum: NodeType, default: NodeType.FOLDER })
    type: NodeType;
  
    @Column({ name: 'status', type: 'enum', enum: StatusNode, default: StatusNode.ACTIVE, comment: 'A: Active, D: Deleted' })
    status: StatusNode;
  
    @Column({ name: 'parent_id', type: 'char', length: 36, nullable: true })
    parentId?: string;
  
    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
    updatedAt?: Date;
  
    @ManyToOne(() => NodeEntity, node => node.children, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' })
    parent?: NodeEntity;
  
    @OneToMany(() => NodeEntity, node => node.parent)
    children: NodeEntity[];
  
    @ManyToOne(() => User, user => user.nodes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @OneToMany(() => NodeFileContentEntity, fileContent => fileContent.node)
    fileContents: NodeFileContentEntity[];
  }