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
  guid: string;
  name: string;
  value: ValueUnit;
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

interface FavoriteStock {
  label: string;
  value: string;
  guid: string;
}

interface OrgUser {
  user_id: string;
  name: string;
  email: string;
  login_id: string;
  role: string;
}

interface Model {
  model_guid: string;
  model_name: string;
  shared_by: string;
  shared_by_username: string;
} 

const removeOrgUser = async (userId: string): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/org/remove-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to remove user");
  }

  console.log("==========================REMOVEAPI",response);
};

const addOrgUser = async (name: string, email: string): Promise<any> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/org/add-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email }),
  });

  if (!response.ok) {
    throw new Error("Failed to add user");
  }
console.log("==========================ADDAPI",response);

  return await response.json();
};

const fetchGraphData = async (stockName: string): Promise<GraphData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/stocks/${stockName}/relationsplus/check`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

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

const fetchFavoriteStocks = async (): Promise<FavoriteStock[]> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/user/favorites`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch favorite stocks");
  }

  const data = await response.json();
  console.log("Favorite stocks data:", data);

  const formatted = data.map((item: any) => ({
    label: item.stock_name,
    value: item.stock_name,
    guid: item.fav_stocks_guid,
  }));

  return formatted;
};

const fetchSavedModel = async (): Promise<Model[]> => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await fetch(`${API_BASE_URL}/org/user/saved-models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch saved models");
    }

    const data = await response.json();
    console.log("////",data);
    
    return data as Model[];
  } catch (error) {
    console.error("Failed to fetch saved models:", error);
    return [];
  }
};

const fetchMonitoredStockData = async (guids: string[]): Promise<any[][]> => {
  try {
    const query = guids.map((guid) => `guids=${guid}`).join("&");
    const response = await fetch(`${API_BASE_URL}/users/stocks/?${query}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch monitored stock data:", error);
    throw error;
  }
};

const fetchOrgUsers = async (signal?: AbortSignal): Promise<OrgUser[]> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/org/users`, {
    method: "GET",
    signal,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch org users");
  }

  return await response.json();
};

const shareStockWithUser = async (userId: string, stockGuid: string): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/share-stock`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      target_user_id: userId,
      stock_guid: stockGuid
    })
  });

  if (!response.ok) {
    throw new Error("Failed to share stock");
  }
};

const removeFavoriteStock = async (favStocksGuid: string): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  
  try {
    const response = await fetch(`${API_BASE_URL}/org/user/retire-stock`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fav_stocks_guid: favStocksGuid,
        retired: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to remove favorite stock:", errorData);
      throw new Error(`Failed to remove favorite stock. Status: ${response.status}`);
    }

    console.log("Favorite stock retired successfully");
  } catch (error) {
    console.error("Error removing favorite stock:", error);
    throw error;
  }
};

const removeSavedModel = async (guid: string): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const res = await fetch(`${API_BASE_URL}/org/retire-model`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model_guid: guid }),
  });

  if (!res.ok) throw new Error("Failed to remove model");
};

const shareSavedModel = async (userId: string, modelGuid: string): Promise<void> => {
  debugger
  const token = sessionStorage.getItem("access_token");
  const res = await fetch(`${API_BASE_URL}/org/share-model`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      receiver_id: userId,
      model_guid: modelGuid
    })
  });

  if (!res.ok) throw new Error("Failed to share model");
};



export {
  addOrgUser,
  removeOrgUser,
  fetchGraphData,
  fetchFavoriteStocks,
  fetchMonitoredStockData,
  fetchOrgUsers,
  shareStockWithUser,
  fetchSavedModel,
  removeFavoriteStock,
  removeSavedModel,
  shareSavedModel
};

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