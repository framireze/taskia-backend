import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateNodeDto } from './dto/createNode.dto';
import { NodeEntity } from './entities/t_node.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JsonWebTokenError } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { StatusNode } from './enums/status-node.enum';
import { ApiResponse } from 'src/interfaces/api-response.interface';
import { User } from 'src/auth/entities/t_users.entity';
import { UpdateNodeDto } from './dto/updateNode.dto';
import { NodeI } from 'src/interfaces/nodeWithChildren.interface';
import { NodeFileContentEntity } from './entities/t_node_content.entity';
import { CreateOrUpdateNodeContentDto } from './dto/createOrUpdateNodeContent.dto';
import { NodeType } from './enums/node-type.enum';

@Injectable()
export class NoteService {
  private readonly logger = new Logger('NoteService');

  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepository: Repository<NodeEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NodeFileContentEntity)
    private readonly nodeFileContentRepository: Repository<NodeFileContentEntity>,
  ) {}

  async createNode(createNodeDto: CreateNodeDto): Promise<ApiResponse<string>> {
    try {
      const user = await this.userRepository.findOne({ where: { user_id: createNodeDto.userId } });
      if (!user) throw new NotFoundException({ success: false, message: 'User not found with id: ' + createNodeDto.userId });

      const nodeNameExist = await this.nodeRepository.findOne({ where: { nodeName: createNodeDto.nodeName, parentId: createNodeDto.parentId, status: StatusNode.ACTIVE, userId: user.user_id, type: createNodeDto.type } });
      if (nodeNameExist) throw new ConflictException({ success: false, message: 'Node name already exists' });

      const new_uuid = uuidv4();
      const node = this.nodeRepository.create({
        nodeId: new_uuid,
        ...createNodeDto,
        status: StatusNode.ACTIVE,
      });
      await this.nodeRepository.save(node);
      return { success: true, message: 'Node created successfully', data: new_uuid };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async getAllNodes(userId: string): Promise<ApiResponse<any>> {
    try {
      const user = await this.userRepository.findOne({ where: { user_id: userId } });
      if (!user) throw new NotFoundException({ success: false, message: 'User not found with id: ' + userId }); 

      const nodes = await this.nodeRepository.find({ where: { userId: user.user_id, status: StatusNode.ACTIVE } });
      const assembledNodes = this.buildTree(nodes as unknown as NodeI[]);
      return { success: true, message: 'Nodes fetched successfully', data: assembledNodes };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async updateNode(nodeId: string, updateNodeDto: UpdateNodeDto): Promise<ApiResponse<string>> {
    try {
      const node = await this.nodeRepository.findOne({ where: { nodeId } });
      if (!node) throw new NotFoundException({ success: false, message: 'Node not found' });

      await this.nodeRepository.update(nodeId, updateNodeDto);
      return { success: true, message: 'Node updated successfully', data: nodeId };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async createOrUpdateNodeContent(nodeId: string, body: CreateOrUpdateNodeContentDto): Promise<ApiResponse<string>> {
    try {
      const node = await this.nodeRepository.findOne({ where: { nodeId, userId: body.userId } });
      if (!node) throw new NotFoundException({ success: false, message: 'Node not found' });
      if(node.type !== NodeType.FILE) throw new BadRequestException({ success: false, message: 'Node is not a file' });

      const nodeContent = await this.nodeFileContentRepository.findOne({ where: { nodeId } });
      if (nodeContent) {
        await this.nodeFileContentRepository.update(nodeContent.fileContentId, { content: body.content });
      } else {
        await this.nodeFileContentRepository.save({ fileContentId: uuidv4(), nodeId, content: body.content, userId: body.userId });
      }
      return { success: true, message: 'Node content updated successfully', data: nodeId };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async getNodeContent(nodeId: string): Promise<ApiResponse<string>> {
    try {
      const node = await this.nodeRepository.findOne({ where: { nodeId, status: StatusNode.ACTIVE } });
      if (!node) throw new NotFoundException({ success: false, message: 'Node not found' });
      if(node.type !== NodeType.FILE) throw new BadRequestException({ success: false, message: 'Node is not a file' });
      
      const nodeContent = await this.nodeFileContentRepository.findOne({ where: { nodeId } });
      if (!nodeContent) throw new NotFoundException({ success: false, message: 'Node content not found' });
      return { success: true, message: 'Node content fetched successfully', data: nodeContent.content || '' };
    } catch (error) {
      throw this.handleException(error);
    }
  }

  async deleteNode(nodeId: string): Promise<ApiResponse<string>> {
    try {
      const node = await this.nodeRepository.findOne({ where: { nodeId } });
      if (!node) throw new NotFoundException({ success: false, message: 'Node not found' });

      await this.nodeRepository.update(nodeId, { status: StatusNode.DELETED });
      return { success: true, message: 'Node deleted successfully', data: nodeId };
    } catch (error) {
      throw this.handleException(error);
    }
  }
  
  private buildTree(flatNodes: NodeI[]): NodeI[] {
    const nodeMap = new Map<string, NodeI>();
    const roots: NodeI[] = [];
  
    // Inicializa el mapa de nodos
    flatNodes.forEach(node => {
      nodeMap.set(node.nodeId, { ...node, childrens: [] });
    });
  
    // Arma la estructura padre-hijo
    flatNodes.forEach(node => {
      const parentId = node.parentId;
      if (parentId) {
        const parent = nodeMap.get(parentId);
        if (parent) {
          parent.childrens.push(nodeMap.get(node.nodeId)!);
        }
      } else {
        roots.push(nodeMap.get(node.nodeId)!);
      }
    });
  
    return roots;
  }

  private handleException(error: Error) {
    this.logger.error(error.message, error.stack);

    if (error instanceof NotFoundException) {
      throw error;
    } else if (error.name === 'QueryFailedError') {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof BadRequestException) {
      throw new BadRequestException({ success: false, message: error.message });
    } else if (error instanceof ConflictException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof UnauthorizedException) {
      throw new ConflictException({ success: false, message: error.message })
    } else if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException({ success: false, message: error.message })
    }else {
      throw new InternalServerErrorException({
        success: false,
        message: 'An error occurred',
      });
    }
  }

}
