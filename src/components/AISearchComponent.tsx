import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Plus, RefreshCw, Home, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SearchStatus = "idle" | "processing" | "completed" | "error";  

type StockData = {
    symbol: string;
    name: string;
    price?: number;
    change?: number;
    changePercent?: number;
    marketCap?: string;
    volume?: string;
};

interface AISearchComponentProps {
    isOpen: boolean;
    onClose: () => void;
    onStockFound?: (stockData: any) => void;
    onAddToFavorites?: (stockData: any) => void;
    onShowToast?: (type: 'success' | 'error' | 'warning', message: string) => void;
    onGoToDashboard?: () => void;
}

const AISearchComponent: React.FC<AISearchComponentProps> = ({
    isOpen,
    onClose,
    onStockFound,
    onAddToFavorites,
    onShowToast,
    onGoToDashboard
}) => {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<SearchStatus>("idle");
    const [stockResults, setStockResults] = useState<StockData[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const socketRef = useRef<WebSocket | null>(null);

    const initWebSocket = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const socket = new WebSocket("ws://192.168.0.184:8000/ws/ai-query");
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("AI WebSocket connected");
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.status === "processing") {
                        setStatus("processing");
                    } else if (data.status === "completed" && data.response?.users) {
                        // Transform the users data to stock format
                        const stocks: StockData[] = data.response.users.map((user: any) => ({
                            symbol: user.lastName || 'N/A',
                            name: `${user.firstName} ${user.lastName}`,
                            price: Math.random() * 1000 + 50, // Mock data
                            change: (Math.random() - 0.5) * 20,
                            changePercent: (Math.random() - 0.5) * 10,
                            marketCap: `${(Math.random() * 100 + 10).toFixed(1)}B`,
                            volume: `${(Math.random() * 50 + 5).toFixed(1)}M`
                        }));
                        setStockResults(stocks);
                        setStatus("completed");
                    } else if (data.stock_found && data.stock_data) {
                        setStockResults([data.stock_data]);
                        setStatus("completed");
                        onStockFound?.(data.stock_data);
                    } else if (data.error || data.status === "error") {
                        setErrorMessage(data.error || data.message || "Search failed");
                        setStatus("error");
                        onShowToast?.('error', data.error || "Search failed");
                    }
                } catch (error) {
                    console.error("Error parsing AI response:", error);
                    setErrorMessage("Invalid response format");
                    setStatus("error");
                    onShowToast?.('error', 'Received invalid response from AI');
                }
            };

            socket.onerror = (error) => {
                console.error("AI WebSocket error:", error);
                setErrorMessage("Connection error occurred");
                setStatus("error");
                onShowToast?.('error', 'AI Assistant connection failed');
            };

            socket.onclose = () => {
                console.log("AI WebSocket disconnected");
            };
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            setErrorMessage("Failed to connect to AI Assistant");
            setStatus("error");
            onShowToast?.('error', 'Failed to connect to AI Assistant');
        }
    };

    const sendQuery = () => {
        const trimmed = query.trim();
        if (!trimmed) {
            onShowToast?.('warning', 'Please enter a search query');
            return;
        }

        setStatus("processing");
        setStockResults([]);
        setErrorMessage("");

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            initWebSocket();
            setTimeout(() => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    const accessToken = sessionStorage.getItem('access_token');
                    const message = {
                        query: trimmed,
                        token: accessToken
                    };
                    
                    socketRef.current.send(JSON.stringify(message));
                }
            }, 1000);
        } else {
            try {
                const accessToken = sessionStorage.getItem('access_token');
                const message = {
                    query: trimmed,
                    token: accessToken
                };
                
                socketRef.current.send(JSON.stringify(message));
            } catch (error) {
                console.error("Error sending message:", error);
                setErrorMessage("Failed to send query");
                setStatus("error");
                onShowToast?.('error', 'Failed to send query');
            }
        }

        // Timeout handler
        setTimeout(() => {
            if (status === "processing") {
                setErrorMessage("Request timed out");
                setStatus("error");
                onShowToast?.('error', 'Request timed out');
            }
        }, 30000);
    };

    const handleRetry = () => {
        setStatus("idle");
        setErrorMessage("");
        setStockResults([]);
    };

    const handleAddToFavorites = (stock: StockData) => {
        onAddToFavorites?.(stock);
        onShowToast?.('success', `${stock.name} added to favorites!`);
    };

    const handleGoToDashboard = () => {
        onGoToDashboard?.();
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setStatus("idle");
            setStockResults([]);
            setErrorMessage("");
            initWebSocket();
        } else if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.close();
            socketRef.current = null;
        }

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [isOpen]);

    const StatusIcon = () => {
        switch (status) {
            case "processing":
                return <Clock className="h-6 w-6 text-blue-500" />;
            case "completed":
                return <CheckCircle className="h-6 w-6 text-green-500" />;
            case "error":
                return <AlertCircle className="h-6 w-6 text-red-500" />;
            default:
                return <Search className="h-6 w-6 text-gray-400" />;
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div
                        onClick={onClose}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 p-6">
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">AI Stock Search</h3>
                                            <p className="text-cyan-100 text-sm">Find and discover stocks with AI assistance</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                                {/* Search Input */}
                                <div className="mb-6">
                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && status === "idle" && sendQuery()}
                                                placeholder="Search for stocks by name, symbol, or description..."
                                                disabled={status === "processing"}
                                                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all duration-300 disabled:opacity-50 disabled:bg-gray-100"
                                            />
                                        </div>
                                        <button
                                            onClick={sendQuery}
                                            disabled={status === "processing" || !query.trim()}
                                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {status === "processing" ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                            Search
                                        </button>
                                    </div>
                                </div>

                                {/* Status Content */}
                                <div className="min-h-[400px] flex flex-col">
                                    {status === "idle" && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                                                <Search className="h-10 w-10 text-cyan-500" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-800 mb-3">Ready to Search</h4>
                                            <p className="text-gray-500 max-w-md mb-6">
                                                Enter a company name, stock symbol, or describe what you're looking for to get started.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                                    <div className="font-medium text-cyan-600 mb-1">Company Name</div>
                                                    <div className="text-gray-600">"Apple Inc"</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                                    <div className="font-medium text-cyan-600 mb-1">Stock Symbol</div>
                                                    <div className="text-gray-600">"AAPL"</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                                    <div className="font-medium text-cyan-600 mb-1">Description</div>
                                                    <div className="text-gray-600">"Tech company"</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {status === "processing" && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-6">
                                                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-800 mb-3">Processing Your Search</h4>
                                            <p className="text-gray-500 max-w-md">
                                                Our AI is analyzing your query and searching through thousands of stocks. This may take a moment.
                                            </p>
                                            <div className="mt-6 text-sm text-gray-400">
                                                Please don't close this window...
                                            </div>
                                        </div>
                                    )}

                                    {status === "error" && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                                            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                                                <AlertCircle className="h-10 w-10 text-red-500" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-800 mb-3">Search Failed</h4>
                                            <p className="text-gray-500 max-w-md mb-6">
                                                {errorMessage || "Something went wrong while processing your search. Please try again."}
                                            </p>
                                            <button
                                                onClick={handleRetry}
                                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Try Again
                                            </button>
                                        </div>
                                    )}

                                    {status === "completed" && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                                    <h4 className="text-lg font-semibold text-gray-800">
                                                        Search Completed - {stockResults.length} Results Found
                                                    </h4>
                                                </div>
                                                <button
                                                    onClick={handleGoToDashboard}
                                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                                                >
                                                    <Home className="h-4 w-4" />
                                                    Go to Dashboard
                                                </button>
                                            </div>

                                            <div className="grid gap-4">
                                                {stockResults.map((stock, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <h5 className="text-lg font-semibold text-gray-800">{stock.name}</h5>
                                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded">
                                                                        {stock.symbol}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                    {stock.price && (
                                                                        <div>
                                                                            <div className="text-gray-500">Price</div>
                                                                            <div className="font-medium">${stock.price.toFixed(2)}</div>
                                                                        </div>
                                                                    )}
                                                                    {stock.change && (
                                                                        <div>
                                                                            <div className="text-gray-500">Change</div>
                                                                            <div className={`font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {stock.marketCap && (
                                                                        <div>
                                                                            <div className="text-gray-500">Market Cap</div>
                                                                            <div className="font-medium">{stock.marketCap}</div>
                                                                        </div>
                                                                    )}
                                                                    {stock.volume && (
                                                                        <div>
                                                                            <div className="text-gray-500">Volume</div>
                                                                            <div className="font-medium">{stock.volume}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddToFavorites(stock)}
                                                                className="ml-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                                Add to Favorites
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AISearchComponent;