import {
  GraphData,
  NodeData,
  LinkData,
  Relationship,
  FavoriteStock,
  OrgUser,
  Model
} from "../services/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- New interfaces for AlertPage ---
export interface FavoriteStockFull {
  fav_stocks_guid: string;
  stock_name: string;
  monitored: boolean;
  email_alert: string[];
  sms_alert: string[];
  lower_threshold: number | null;
  upper_threshold: number | null;
  last_alert: string;
  last_alert_status: string;
  last_alert_frequency: string;
  latest_value: number | null;
}

export interface ComprehensiveAlertPayload {
  stock_guid: string;
  upper_threshold?: number | null;
  lower_threshold?: number | null;
  alert_frequency?: 'realtime' | 'daily' | 'weekly' | 'monthly';
  email_notifications?: string[];
  phone_notifications?: string[];
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

  return await response.json();
};

const fetchGraphData = async (stockName: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/check/stocks/${stockName}/relationsplus/deep?depth=3`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    const nodeMap = new Map();
    const edgeMap = new Map(); // group by directed pair (source->target)

    // Build nodes
    data.nodes.forEach((node: any) => {
      nodeMap.set(node.guid, {
        id: node.guid,
        name: node.name,
        value: node.value === "N/A" ? { value: 0, unit: "unknown" } : node.value,
      });
    });

    // Process edges with proper directionality
    data.edges.forEach((edge: any) => {
      const from = edge.from;
      const to = edge.to;
      if (!from || !to) return;

      // Use directed key (from->to) instead of undirected
      const key = `${from}->${to}`;
      const relationship: Relationship = {
        impact: edge.relationship?.impact ?? "neutral",
        weight: edge.relationship?.weight ?? 0,
        flow: edge.relationship?.flow ?? "0",
        fromName: nodeMap.get(from)?.name || from,
        toName: nodeMap.get(to)?.name || to,
      };

      const existing = edgeMap.get(key) || [];
      existing.push(relationship);
      edgeMap.set(key, existing);
    });

    // Detect bidirectional edges and combine them
    const processedEdges = new Set<string>();
    const parsedEdges: LinkData[] = [];

    edgeMap.forEach((relationships, key) => {
      if (processedEdges.has(key)) return; // Skip if already processed

      const [source, target] = key.split('->');
      const reverseKey = `${target}->${source}`;
      const reverseRelationships = edgeMap.get(reverseKey);

      if (reverseRelationships) {
        // Bidirectional edge found - combine both directions with exactly 2 relationships
        const combinedRelationships = [
          ...relationships,  // A -> B relationships
          ...reverseRelationships  // B -> A relationships
        ];

        parsedEdges.push({
          relationshipList: combinedRelationships,
          isBidirectional: true,
        });

        // Mark both directions as processed
        processedEdges.add(key);
        processedEdges.add(reverseKey);
      } else {
        // Unidirectional edge - only 1 relationship
        parsedEdges.push({
          relationshipList: relationships,
          isBidirectional: false,
        });

        processedEdges.add(key);
      }
    });

    const graphData: GraphData = {
      stock: {
        guid: data.stock.guid,
        name: data.stock.name,
        value: data.stock.value,
        context: data.stock.context,
      },
      nodes: Array.from(nodeMap.values()),
      edges: parsedEdges,
    };
    console.log("GRAPHDATA", graphData);

    return graphData;
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    throw error;
  }
};

// --- Updated fetchFavoriteStocks with overloads for backward compatibility ---
// Overloaded function signatures
async function fetchFavoriteStocks(): Promise<FavoriteStock[]>;
async function fetchFavoriteStocks(fullData: true): Promise<FavoriteStockFull[]>;
async function fetchFavoriteStocks(fullData?: boolean): Promise<FavoriteStock[] | FavoriteStockFull[]>;

// Implementation
async function fetchFavoriteStocks(fullData: boolean = false): Promise<FavoriteStock[] | FavoriteStockFull[]> {
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

  // Return full data for AlertPage
  if (fullData) {
    return data as FavoriteStockFull[];
  }

  // Return formatted data for other pages (maintains backward compatibility)
  const formatted = data.map((item: any) => ({
    label: item.stock_name,
    value: item.stock_name,
    guid: item.fav_stocks_guid,
    monitored: item.monitored,
  }));

  return formatted;
}

// --- New API functions for AlertPage ---
const updateAlertStatus = async (guid: string, monitored: boolean): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/user/favorites/${guid}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ monitored }),
  });

  if (!response.ok) {
    throw new Error("Failed to update alert status");
  }
};

const deleteAlert = async (guid: string): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/user/favorites/${guid}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete alert");
  }
};

const createAlert = async (alertData: Partial<FavoriteStockFull>): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/user/favorites`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alertData),
  });

  if (!response.ok) {
    throw new Error("Failed to create alert");
  }
};

const updateAlert = async (guid: string, alertData: Partial<FavoriteStockFull>): Promise<void> => {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/org/user/favorites/${guid}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alertData),
  });

  if (!response.ok) {
    throw new Error("Failed to update alert");
  }
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

    return data as Model[];
  } catch (error) {
    console.error("Failed to fetch saved models:", error);
    return [];
  }
};

const fetchMonitoredStockData = async (guids: string[], days: number = 6000): Promise<any[]> => {
  const token = sessionStorage.getItem("access_token");

  try {
    const responses = await Promise.all(
      guids.map(async (guid) => {
        const url = `${API_BASE_URL}/org/stocks/check/with-relations/?root_guid=${guid}&days=6000`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch stock data for ${guid}: ${res.status}`);
        }

        const data = await res.json();
        return data;
      })
    );

    return responses.map(arr => (Array.isArray(arr) && arr.length > 0 ? arr[0] : null));
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

  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_BASE_URL}/org/user/retire-model`, {
    method: "PUT", // Changed to PUT based on Swagger UI image
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      saved_model_guid: guid,
      retired: true
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to remove model");
  }
};


const shareSavedModel = async (userId: string, modelGuid: string): Promise<void> => {
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

const setStockAlert = async (
  stock_guid: string,
  upper_threshold: number,
  lower_threshold: number,
  // Optional enhanced parameters that will be ignored for now
  alert_frequency?: string,
  email_notifications?: string[],
  phone_notifications?: string[]
): Promise<void> => {
  const token = sessionStorage.getItem("access_token");

  try {
    // For now, only send the original 3 parameters to match your existing API
    const response = await fetch(`${API_BASE_URL}/org/user/monitoring/thresholds`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        stock_guid,
        upper_threshold,
        lower_threshold
        // Note: alert_frequency, email_notifications, phone_notifications are not sent
        // until your backend supports them
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to set alert: ${response.statusText}`);
    }

    // TODO: When your backend supports enhanced features, you can add additional API calls here:

    // if (alert_frequency || email_notifications || phone_notifications) {
    //   await setEnhancedAlertPreferences(stock_guid, {
    //     alert_frequency,
    //     email_notifications,
    //     phone_notifications
    //   });
    // }

  } catch (error) {
    console.error("Error setting alert:", error);
    throw error;
  }
};

const toggleStockMonitoring = async (stock_guid: string, monitored: boolean): Promise<void> => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await fetch(`${API_BASE_URL}/org/user/monitoring/toggle`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stock_guid, monitored }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Toggle monitoring failed:", errorData);
      throw new Error(`Failed to toggle monitoring. Status: ${response.status}`);
    }

    console.log("Toggled monitoring successfully");
  } catch (error) {
    console.error("Error in toggleStockMonitoring:", error);
    throw error; // re-throw to let the calling function handle UI feedback
  }
};

const addFavoriteStock = async (favStocksGuid: string): Promise<void> => {
  const token = sessionStorage.getItem("access_token");

  try {
    const response = await fetch(`${API_BASE_URL}/org/favorites/add`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fav_stocks_guid: favStocksGuid
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to add favorite stock:", errorData);
      throw new Error(`Failed to add favorite stock. Status: ${response.status}`);
    }

    console.log("Favorite stock added successfully");
  } catch (error) {
    console.error("Error adding favorite stock:", error);
    throw error;
  }
};

export {
  // Existing exports
  addOrgUser,
  removeOrgUser,
  toggleStockMonitoring,
  fetchGraphData,
  fetchFavoriteStocks,
  fetchMonitoredStockData,
  fetchOrgUsers,
  shareStockWithUser,
  fetchSavedModel,
  removeFavoriteStock,
  removeSavedModel,
  shareSavedModel,
  setStockAlert,
  addFavoriteStock,

  // New exports for AlertPage
  updateAlertStatus,
  deleteAlert,
  createAlert,
  updateAlert,
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