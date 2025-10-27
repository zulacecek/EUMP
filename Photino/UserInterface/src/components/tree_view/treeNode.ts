import type { ObjectType } from "@/structs/genericStructs";

export interface TreeNode {
  id: string;
  label: string;
  type: TreeNodeType;
  children?: TreeNode[];
  objectType?: ObjectType;
  isOpen?: boolean;
  contextMenuObject?: any;
}

export enum TreeNodeType {
  ParentNode = 'parentNode',
  EndNode = 'endNode'
}

export function newTreeNode(id: string, label: string, type: TreeNodeType.ParentNode | TreeNodeType.EndNode, children? : TreeNode[], objectType?: ObjectType, contextMenuOptions?: any) : TreeNode {
  return <TreeNode>({ id, label, type, children, objectType, contextMenuObject: contextMenuOptions });
}