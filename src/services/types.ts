export interface Relationship {
  impact: "positive" | "negative";
  weight: number;
  flow: number;
}

interface Value {
  value: number;
  unit: string;
}

export interface Stock {
  guid: string;
  name: string;
  value: Value;
  context?: string;
  relationship?: Relationship;
  related_stocks?: Stock[];
}

export interface GraphData {
  stock: Stock;
  related_stocks: Stock[];
}

export interface NodeData {
  id: string;
  x: any;
  y: string | number | boolean | readonly (string | number)[] | null;
  name: string;
  value?: Value;
  context?: string;
  isCenter?: boolean;
  relationship?: Relationship;
  isSecondary?: boolean;
}

export interface LinkData {
  // id: string;
  source: string;
  target: string;
  impact: "positive" | "negative";
  weight: number;
  flow: number;
  name: string;
  isSecondary?: boolean;
  value?: Value;
}

export interface TooltipProps {
  node: NodeData;
  isVisible: boolean;
  position?: { x: number; y: number };
}