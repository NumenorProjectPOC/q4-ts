// src/context/AIWebSocketContext.tsx

import React, { createContext, useContext, useRef, useEffect, useState, ReactNode } from 'react';
import { formatStockName } from '../utils/utility';
// 1. Import the new utility function
import { getStaticAISearchResponse } from '../utils/aiSearchUtils';

export type SearchStatus = "idle" | "processing" | "completed" | "error";

export type StockData = {
    name: string;
    guid: string;
    context: string;
};

export interface AISearchResponse {
    status: SearchStatus;
    stockResults: StockData[];
    errorMessage: string;
}

interface AIWebSocketContextType {
    // 2. Update the sendQuery signature
    sendQuery: (query: string, currentTab?: 'visualization' | 'monitoring' | 'dashboard') => Promise<void>;
    searchResponse: AISearchResponse;
    isConnected: boolean;
    reconnect: () => void;
    clearSearch: () => void;
    setSearchResponse: (response: AISearchResponse) => void;
}

const AIWebSocketContext = createContext<AIWebSocketContextType | undefined>(undefined);

interface AIWebSocketProviderProps {
    children: ReactNode;
    wsUrl?: string;
}

export const AIWebSocketProvider: React.FC<AIWebSocketProviderProps> = ({
    children,
    wsUrl = import.meta.env.VITE_WEBSOCKET_URL
}) => {
    const queryTimeoutRef = useRef<number | null>(null);
    // 4. For simulation, let's assume we are always connected.
    const [isConnected, setIsConnected] = useState(true);
    const [searchResponse, setSearchResponse] = useState<AISearchResponse>({
        status: "idle",
        stockResults: [],
        errorMessage: "",
    });

    const updateSearchResponse = (updates: Partial<AISearchResponse>) => {
        setSearchResponse(prev => ({ ...prev, ...updates }));
    };

    const clearSearch = () => {
        setSearchResponse({
            status: "idle",
            stockResults: [],
            errorMessage: "",
        });
        if (queryTimeoutRef.current) {
            clearTimeout(queryTimeoutRef.current);
            queryTimeoutRef.current = null;
        }
    };

    // 3. Replace the original sendQuery function with our static simulation
    const sendQuery = async (
        query: string,
        currentTab?: 'visualization' | 'monitoring' | 'dashboard'
    ): Promise<void> => {
        return new Promise((resolve) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                // You can handle this case if needed, but the UI component already does.
                resolve();
                return;
            }

            // Start by setting the status to processing
            updateSearchResponse({
                status: "processing",
                stockResults: [],
                errorMessage: ""
            });

            // Get the static response from our utility function
            const staticResponse = getStaticAISearchResponse(trimmedQuery, currentTab);

            if (staticResponse) {
                // If we have a matching static response, show it after a short delay
                queryTimeoutRef.current = setTimeout(() => {
                    // The utility already returns the data in the correct format (AISearchResponse)
                    // We just need to format the name for display consistency
                    const formattedResults = staticResponse.stockResults.map(stock => ({
                        ...stock,
                        name: formatStockName(stock.name),
                    }));

                    setSearchResponse({ ...staticResponse, stockResults: formattedResults });
                    resolve();
                }, 1500); // 1.5-second delay
            } else {
                // For any other query, show the "limited resources" error after a longer delay
                queryTimeoutRef.current = setTimeout(() => {
                    updateSearchResponse({
                        status: "error",
                        errorMessage: "Our AI is currently busy. Finding results may take longer as resources are limited. Please try a different query.",
                        stockResults: []
                    });
                    resolve();
                }, 3000); // 3-second delay
            }
        });
    };
    
    // A simple reconnect function for the simulation
    const reconnect = () => {
        setIsConnected(true);
        console.log("Simulating reconnect...");
    };

    // We can simplify the useEffect for the static version, as we don't need a real connection.
    useEffect(() => {
        // This effect can be left empty or removed if you are ONLY using the static data.
        // Keeping it helps if you want to switch back later.
        console.log("AIWebSocketProvider mounted (static mode).");
        return () => {
            if (queryTimeoutRef.current) {
                clearTimeout(queryTimeoutRef.current);
            }
        };
    }, []);


    const contextValue: AIWebSocketContextType = {
        sendQuery,
        searchResponse,
        isConnected,
        reconnect,
        clearSearch,
        setSearchResponse,
    };

    return (
        <AIWebSocketContext.Provider value={contextValue}>
            {children}
        </AIWebSocketContext.Provider>
    );
};

export const useAIWebSocket = () => {
    const context = useContext(AIWebSocketContext);
    if (context === undefined) {
        throw new Error('useAIWebSocket must be used within an AIWebSocketProvider');
    }
    return context;
};