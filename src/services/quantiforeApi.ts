const API_BASE_URL: String ="http://localhost:8000";

interface Relationship {
  impact: string;
  weight: number;
  flow?: string;
}

interface Stock {
  name: string;
  value: string;
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
    const response = await fetch(`${API_BASE_URL}/users/stocks/${stockName}/relations`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    console.log("////////////", response);
    return (await response.json()) as GraphData;
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    throw error;
  }
};

export { fetchGraphData };
