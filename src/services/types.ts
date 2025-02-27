export interface Relationship {
    impact: "positive" | "negative";
    weight: number;
    flow: number;
  }
  interface value{
    value:number,
    unit:string
  }
  export interface Stock {
    guid: string;
    name: string;
    value?: string| number;
    context?: string;
    relationship?: Relationship;
  }
  
  export interface GraphData {
    stock: Stock;
    related_stocks: Stock[];
  }
  
  export interface NodeData {
    x: any;
    y: string | number | boolean | readonly (string | number)[] | null;
    id: string;
    name: string;
    value?: value;
    context?: string;
    isCenter?: boolean;
    relationship?: Relationship;
  }

  export interface LinkData {
    source: string;
    target: string;
    impact: "positive" | "negative";
    weight: number;
    flow: number;
    name: string;
  }
  