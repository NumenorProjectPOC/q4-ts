export interface Relationship {
  impact:  "positive" | "negative" | "neutral";
  weight: number;
  flow: number;
  fromName: string;
  toName: string;
}

export interface Value {
  value: number;
  unit: string;
}

export interface Stock {
  guid: string;
  name: string;
  value: Value;
  context?: string;
  relationship?: Relationship;
}

export interface GraphData {
  stock: {
    guid: string;
    name: string;
    value: Value;
    context?: string;
  };
  nodes: NodeData[];
  edges: LinkData[];
}

export interface NodeData {
  id: string;
  name: string;
  value: Value;
  context?: string;
  relationship?: Relationship; 
  isSecondary?: boolean;
  isCenter?: boolean; 
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface LinkData {
  relationshipList?: Relationship[];
  isBidirectional?: boolean;
}

export interface TooltipProps {
  node: NodeData;
  isVisible: boolean;
  position?: { x: number; y: number };
}

export interface FavoriteStock {
  label: string;
  value: string;
  guid: string;
}

export interface OrgUser {
  user_id: string;
  name: string;
  email: string;
  login_id: string;
  role: string;
}

export interface Model {
  model_guid: string;
  model_name: string;
  shared_by: string;
  shared_by_username: string;
} 