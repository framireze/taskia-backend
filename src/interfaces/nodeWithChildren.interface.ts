import { NodeEntity } from "src/note/entities/t_node.entity";
import { NodeType } from "src/note/enums/node-type.enum";
import { StatusNode } from "src/note/enums/status-node.enum";

export interface NodeI extends NodeEntity{
    nodeId: string;
    userId: string;
    nodeName: string;
    type: NodeType;
    status: StatusNode;
    parentId?: string;
    createdAt: Date;
    updatedAt?: Date;
    childrens: NodeEntity[];
}