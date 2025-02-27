const API_BASE_URL: String ="https://dl1zn50g-8000.inc1.devtunnels.ms";

interface ValueUnit {
  value: number;
  unit: string;
}

interface Relationship {
  impact: string;
  weight: number;
  flow?: string;
}

interface Stock {
  guid: string;  // Added guid here
  name: string;
  value: ValueUnit;  // Modified to ValueUnit
  context?: string;
  impact?: string;
  weight?: number;
  flow?: string;
  relationship?: Relationship;
}

interface GraphData {
  stock: Stock;
  related_stocks: Stock[];
}

const fetchGraphData = async (stockName: string): Promise<GraphData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/stocks/${stockName}/relationsplus`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    console.log("////////////", response);
    const data = await response.json();

    // Type assertion with explicit transformation:
    const graphData: GraphData = {
      stock: {
        ...data.stock,
       
      },
      related_stocks: data.stock.related_stocks
    };
    
    return graphData;
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    throw error;
  }
};

export { fetchGraphData };