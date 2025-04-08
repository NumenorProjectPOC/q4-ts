const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// async function fetchDomains(regions: string, framework: string): Promise<string[]> {
//   // Implement your API call here to fetch domains based on regions and framework
//   // Example:
//   const response = await fetch(`${API_BASE_URL}/domains?regions=${regions}&framework=${framework}`);
//   if (!response.ok) {
//     throw new Error(`HTTP error! Status: ${response.status}`);
//   }
//   const data: string[] = await response.json();
//   return data;
//   return Promise.resolve(['Domain1', 'Domain2', 'Domain3']);
// }

// export { fetchDomains };

// async function fetchStocks(regions: string, framework: string, domains: string): Promise<string[]> {
//   // Implement your API call here to fetch stocks based on regions, framework and domains
//   // Example:
// const response = await fetch(`${API_BASE_URL}/stocks?regions=${regions}&framework=${framework}&domains=${domains}`);
// if (!response.ok) {
//   throw new Error(`HTTP error! Status: ${response.status}`);
// }
// const data: string[] = await response.json();
// return data;
//   return Promise.resolve(['Stock1', 'Stock2', 'Stock3']); // Placeholder
//
// export { fetchStocks };