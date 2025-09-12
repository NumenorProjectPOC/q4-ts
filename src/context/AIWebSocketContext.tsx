import React, { createContext, useContext, useRef, useEffect, useState, ReactNode } from 'react';
import { formatStockName } from '../utils/utility';

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
    sendQuery: (query: string) => Promise<void>;
    searchResponse: AISearchResponse;
    isConnected: boolean;
    reconnect: () => void;
    clearSearch: () => void;
    setSearchResponse: (response: AISearchResponse) => void; // The new function
}

const AIWebSocketContext = createContext<AIWebSocketContextType | undefined>(undefined);

interface AIWebSocketProviderProps {
    children: ReactNode;
    wsUrl?: string;
}

export const AIWebSocketProvider: React.FC<AIWebSocketProviderProps> = ({
    children,
    wsUrl = "ws://10.200.200.1:8000/ws/ai-query"
}) => {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const queryTimeoutRef = useRef<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [searchResponse, setSearchResponse] = useState<AISearchResponse>({
        status: "idle",
        stockResults: [],
        errorMessage: "",
    });

    const updateSearchResponse = (updates: Partial<AISearchResponse>) => {
        setSearchResponse(prev => ({ ...prev, ...updates }));
    };

    // Added clearSearch function
    const clearSearch = () => {
        setSearchResponse({
            status: "idle",
            stockResults: [],
            errorMessage: "",
        });

        // Clear any ongoing query timeout
        if (queryTimeoutRef.current) {
            clearTimeout(queryTimeoutRef.current);
            queryTimeoutRef.current = null;
        }
    };

    const initWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        try {
            console.log("Initializing AI WebSocket connection...");
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("AI WebSocket connected");
                setIsConnected(true);
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            // MODIFIED: Simplified message handler for the new API contract
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("AI WebSocket message received:", data);

                    if (queryTimeoutRef.current) {
                        clearTimeout(queryTimeoutRef.current);
                        queryTimeoutRef.current = null;
                    }
                    if (data.status === "processing") {
                        updateSearchResponse({ status: "processing", stockResults: [], errorMessage: "" });
                    }
                    else if (data.status === "error") {
                        updateSearchResponse({
                            status: "error",
                            errorMessage: data.message || "An unknown error occurred.",
                            stockResults: []
                        });
                    }
                    else if (data.status === "completed") {
                        console.log("1122");

                        // The result object can be in `data.message` or `data.response`
                        const resultPayload = data.response.message;

                        // Check if we received a valid stock/model object
                        if (resultPayload && typeof resultPayload === 'object' && resultPayload.name && resultPayload.guid && resultPayload.context) {
                            console.log("uiuiu");

                            const newResult: StockData = {
                                name: formatStockName(resultPayload.name),
                                guid: resultPayload.guid,
                                context: resultPayload.context,
                            };
                            updateSearchResponse({
                                status: "completed",
                                stockResults: [newResult],
                                errorMessage: ""
                            });
                        } else {
                            // Completed, but no valid object found. Treat as "0 results".
                            updateSearchResponse({
                                status: "completed",
                                stockResults: [],
                                errorMessage: typeof resultPayload === 'string' ? resultPayload : ""
                            });
                        }
                    }
                    else {
                        console.warn("Unknown response format:", data);
                        updateSearchResponse({ status: "error", errorMessage: "Received an unknown response format." });
                    }
                } catch (error) {
                    console.error("Error parsing AI response:", error);
                    updateSearchResponse({ status: "error", errorMessage: "Invalid response format from server." });
                }
            };

            socket.onerror = (error) => {
                console.error("AI WebSocket error:", error);
                setIsConnected(false);
                updateSearchResponse({
                    status: "error",
                    errorMessage: "Connection error occurred",
                });
            };

            socket.onclose = (event) => {
                console.log("AI WebSocket disconnected:", event.code, event.reason);
                setIsConnected(false);
                if (event.code !== 1000) {
                    scheduleReconnect();
                }
            };

        } catch (error) {
            console.error("Failed to create AI WebSocket:", error);
            setIsConnected(false);
            updateSearchResponse({
                status: "error",
                errorMessage: "Failed to connect to AI Assistant",
            });
            scheduleReconnect();
        }
    };

    const scheduleReconnect = () => {
        if (reconnectTimeoutRef.current) return;

        console.log("Scheduling AI WebSocket reconnection in 5 seconds...");
        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            initWebSocket();
        }, 5000);
    };

    const sendQuery = async (query: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                reject(new Error('Please enter a search query'));
                return;
            }

            // Reset search state
            updateSearchResponse({
                status: "processing",
                stockResults: [],
                errorMessage: ""
            });

            const sendMessage = () => {
                if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }

                try {
                    const accessToken = sessionStorage.getItem('access_token');
                    const message = {
                        query: trimmedQuery,
                        token: accessToken
                    };

                    socketRef.current.send(JSON.stringify(message));

                    // Set timeout for the query
                    queryTimeoutRef.current = setTimeout(() => {
                        updateSearchResponse({
                            status: "error",
                            errorMessage: "Request timed out"
                        });
                        reject(new Error('Request timed out'));
                    }, 30000);

                    resolve();
                } catch (error) {
                    console.error("Error sending AI query:", error);
                    updateSearchResponse({
                        status: "error",
                        errorMessage: "Failed to send query"
                    });
                    reject(error);
                }
            };

            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                // If not connected, try to connect first
                initWebSocket();
                // Wait a bit for connection to establish
                setTimeout(() => {
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        sendMessage();
                    } else {
                        reject(new Error('Failed to establish connection'));
                    }
                }, 1000);
            } else {
                sendMessage();
            }
        });
    };

    const reconnect = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        initWebSocket();
    };

    // Initialize connection on mount and handle tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab is hidden, optionally close connection to save resources
                console.log("Tab hidden, keeping AI WebSocket connection alive");
            } else {
                // Tab is visible, ensure connection is active
                console.log("Tab visible, ensuring AI WebSocket connection");
                if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                    initWebSocket();
                }
            }
        };

        const handleBeforeUnload = () => {
            if (socketRef.current) {
                socketRef.current.close(1000, "Page unloading");
            }
        };

        // Initialize connection
        initWebSocket();

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // Cleanup
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (queryTimeoutRef.current) {
                clearTimeout(queryTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounting");
            }
        };
    }, [wsUrl]);

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