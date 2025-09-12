import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Plus, Minus, RefreshCw, Home, AlertCircle, CheckCircle, Clock, Eye, ChevronRight, Trash2, Sparkles, Zap, Check, ExternalLink, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockData, useAIWebSocket, AISearchResponse } from '../context/AIWebSocketContext';
import { addFavoriteStock, removeFavoriteStock } from '../services/quantiforeApi';
import { formatStockName } from '../utils/utility';

interface AISearchComponentProps {
    isOpen: boolean;
    onClose: () => void;
    onStockFound?: (stockData: any) => void;
    onAddToFavorites?: (stockData: any) => void;
    onRemoveFromFavorites?: (stockData: any) => void;
    onShowToast?: (type: 'completed' | 'error' | 'warning', message: string) => void;
    onGoToDashboard?: (targetTab?: 'monitoring' | 'visualization') => void;
    savedStocks?: StockData[];
    currentTab?: 'visualization' | 'monitoring' | 'dashboard';
}

interface CachedQuery {
    query: string;
    timestamp: number;
    response: AISearchResponse;
}

const RECENT_QUERIES_KEY = 'quantifore_ai_cached_queries';
const MAX_RECENT_QUERIES = 5;
const MAX_CONSECUTIVE_FAILURES = 3;
const FAILURE_COOLDOWN_TIME = 30000; // 30 seconds

const AISearchComponent: React.FC<AISearchComponentProps> = ({
    isOpen,
    onClose,
    onStockFound,
    onAddToFavorites,
    onRemoveFromFavorites,
    onShowToast,
    onGoToDashboard,
    savedStocks = [],
    currentTab = 'dashboard'
}) => {
    const [query, setQuery] = useState("");
    const [recentQueries, setRecentQueries] = useState<CachedQuery[]>([]);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [consecutiveFailures, setConsecutiveFailures] = useState(0);
    const [lastFailureTime, setLastFailureTime] = useState<number>(0);
    const [isInCooldown, setIsInCooldown] = useState(false);
    const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
    
    const { sendQuery, searchResponse, isConnected, reconnect, clearSearch, setSearchResponse } = useAIWebSocket();
    
    const { status, stockResults, errorMessage } = searchResponse;
    const currentQueryRef = useRef(""); 
    const inputRef = useRef<HTMLInputElement>(null);
    const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSearchAttemptRef = useRef<number>(0);

    // Monitor connection status and handle cooldowns
    useEffect(() => {
        if (!isConnected) {
            setServerStatus('offline');
            // Start cooldown after consecutive failures
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                setIsInCooldown(true);
                if (cooldownTimerRef.current) {
                    clearTimeout(cooldownTimerRef.current);
                }
                cooldownTimerRef.current = setTimeout(() => {
                    setIsInCooldown(false);
                    setConsecutiveFailures(0);
                }, FAILURE_COOLDOWN_TIME);
            }
        } else {
            setServerStatus('online');
            setConsecutiveFailures(0);
            setIsInCooldown(false);
            if (cooldownTimerRef.current) {
                clearTimeout(cooldownTimerRef.current);
                cooldownTimerRef.current = null;
            }
        }

        return () => {
            if (cooldownTimerRef.current) {
                clearTimeout(cooldownTimerRef.current);
            }
        };
    }, [isConnected, consecutiveFailures]);

    // Get current favorites from session storage
    const getCurrentFavorites = () => {
        try {
            const cached = sessionStorage.getItem("favorite_stocks");
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error("Error parsing favorites:", error);
        }
        return [];
    };

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_QUERIES_KEY);
            if (stored) {
                const queries: CachedQuery[] = JSON.parse(stored);
                if (Array.isArray(queries) && queries.every(q => q.query && q.timestamp && q.response)) {
                    setRecentQueries(queries);
                } else {
                    localStorage.removeItem(RECENT_QUERIES_KEY);
                }
            }
        } catch (error) {
            console.error('Error parsing cached queries:', error);
            localStorage.removeItem(RECENT_QUERIES_KEY);
        }
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Effect to cache a search result when it completes or errors
    useEffect(() => {
        const queryToCache = currentQueryRef.current;
        if ((status === 'completed' || status === 'error') && queryToCache) {
            addToRecentQueries(queryToCache, searchResponse);
            currentQueryRef.current = "";

            // Handle error tracking
            if (status === 'error') {
                setConsecutiveFailures(prev => prev + 1);
                setLastFailureTime(Date.now());
            } else if (status === 'completed') {
                setConsecutiveFailures(0);
            }
        }
    }, [status, searchResponse]);

    const saveRecentQueries = (queries: CachedQuery[]) => {
        try {
            localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(queries));
            setRecentQueries(queries);
        } catch (error) {
            console.error('Error saving recent queries:', error);
        }
    };

    const addToRecentQueries = (searchQuery: string, response: AISearchResponse) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        const lowercasedQuery = trimmed.toLowerCase();
        
        const newEntry: CachedQuery = { query: trimmed, timestamp: Date.now(), response };
        
        const updatedQueries = [newEntry, ...recentQueries.filter(q => q.query.toLowerCase() !== lowercasedQuery)]
            .slice(0, MAX_RECENT_QUERIES);
        
        saveRecentQueries(updatedQueries);
    };

    const removeRecentQuery = (indexToRemove: number) => {
        const updatedQueries = recentQueries.filter((_, index) => index !== indexToRemove);
        saveRecentQueries(updatedQueries);
    };

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            onShowToast?.('warning', 'Please enter a search query');
            return;
        }

        // Prevent spam requests
        const now = Date.now();
        if (now - lastSearchAttemptRef.current < 1000) {
            onShowToast?.('warning', 'Please wait a moment before searching again');
            return;
        }
        lastSearchAttemptRef.current = now;

        // Check if server is offline or in cooldown
        if (!isConnected) {
            if (isInCooldown) {
                const remainingTime = Math.ceil((FAILURE_COOLDOWN_TIME - (now - lastFailureTime)) / 1000);
                onShowToast?.('warning', `Server appears to be down. Please wait ${remainingTime}s before retrying.`);
                return;
            }
            onShowToast?.('error', 'Cannot connect to server. Please check your connection.');
            return;
        }

        currentQueryRef.current = trimmed;

        try {
            await sendQuery(trimmed);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Search failed';
            onShowToast?.('error', errorMsg);
            currentQueryRef.current = "";
            setConsecutiveFailures(prev => prev + 1);
        }
    };
    
    const handleRecentQueryClick = (cachedQuery: CachedQuery) => {
        setQuery(cachedQuery.query);
        setSearchResponse(cachedQuery.response);
    };

    const handleDiscard = () => {
        clearSearch();
        setQuery("");
    };

    const handleRetry = () => {
        if (!isConnected && !isInCooldown) {
            reconnect();
        } else if (query.trim()) {
            handleSearch();
        } else {
            onShowToast?.('warning', 'Please enter a search query to retry');
        }
    };

    const handleAddToFavorites = async (stock: StockData) => {
        try {
            await addFavoriteStock(stock.guid);
            
            // Update session storage
            const cached = sessionStorage.getItem("favorite_stocks");
            let favorites = cached ? JSON.parse(cached) : [];
            
            const newFavorite = {
                ...stock,
                label: formatStockName(stock.name),
                value: stock.name.toLowerCase().replace(/\s+/g, '_'),
                guid: stock.guid,
                monitored: false
            };
            
            // Check if already exists
            const exists = favorites.some((fav: any) => fav.guid === stock.guid);
            if (!exists) {
                favorites.unshift(newFavorite);
                sessionStorage.setItem("favorite_stocks", JSON.stringify(favorites));
            }
            
            onAddToFavorites?.(stock);
            const type = stock.context === 'model' ? 'model' : 'stock';
            onShowToast?.('completed', `${stock.name} added to saved ${type}s!`);
        } catch (error) {
            onShowToast?.('error', 'Failed to add to favorites');
        }
    };

    const handleRemoveFromFavorites = async (stock: StockData) => {
        try {
            await removeFavoriteStock(stock.guid);
            
            // Update session storage
            const cached = sessionStorage.getItem("favorite_stocks");
            if (cached) {
                const favorites = JSON.parse(cached);
                const updatedFavorites = favorites.filter((fav: any) => fav.guid !== stock.guid);
                sessionStorage.setItem("favorite_stocks", JSON.stringify(updatedFavorites));
            }
            
            onRemoveFromFavorites?.(stock);
            const type = stock.context === 'model' ? 'model' : 'stock';
            onShowToast?.('completed', `${stock.name} removed from saved ${type}s!`);
        } catch (error) {
            onShowToast?.('error', 'Failed to remove from favorites');
        }
    };

    const handleGoToDashboard = (targetTab?: 'monitoring' | 'visualization') => {
        onGoToDashboard?.(targetTab);
        onClose();
    };

    // Enhanced function to check if stock is saved
    const isStockSaved = (stock: StockData) => {
        const currentFavorites = getCurrentFavorites();
        return currentFavorites.some((fav: any) => fav.guid === stock.guid || fav.name === stock.name);
    };

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { 
            if (event.key === 'Escape') onClose(); 
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (status === "completed" && stockResults.length > 0) {
            onStockFound?.(stockResults[0]);
        }
    }, [status, stockResults, onStockFound]);

    useEffect(() => {
        if (status === "error" && errorMessage) {
            // Only show toast for new errors, not repeated ones
            if (consecutiveFailures <= 1) {
                onShowToast?.('error', errorMessage);
            }
        }
    }, [status, errorMessage, consecutiveFailures, onShowToast]);

    // Render connection status indicator
    const renderConnectionStatus = () => {
        if (serverStatus === 'offline' || !isConnected) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-sm text-red-700 bg-red-50 px-4 py-3 rounded-lg border border-red-200 flex items-center gap-2"
                >
                    <WifiOff className="w-4 h-4" />
                    <div className="flex-1">
                        <span className="font-medium">Server Offline</span>
                        {isInCooldown && (
                            <span className="ml-2 text-xs">
                                (Retrying in {Math.ceil((FAILURE_COOLDOWN_TIME - (Date.now() - lastFailureTime)) / 1000)}s)
                            </span>
                        )}
                    </div>
                    {!isInCooldown && (
                        <button
                            onClick={() => reconnect()}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
                        >
                            Retry
                        </button>
                    )}
                </motion.div>
            );
        }

        if (serverStatus === 'online' && consecutiveFailures > 0 && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200 flex items-center gap-2"
                >
                    <AlertCircle className="w-4 h-4" />
                    Connection unstable. Some features may not work properly.
                </motion.div>
            );
        }

        return null;
    };

    // Check if search should be disabled
    const isSearchDisabled = status === "processing" || !query.trim() || !isConnected || isInCooldown;

    return (
        <AnimatePresence>
            {isOpen && (
                <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    >
                        {/* Clean Header */}
                        <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">AI Stock Discovery</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>Discover and analyze with AI-powered search</span>
                                            <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                                                isConnected 
                                                    ? "text-green-700 bg-green-50 border-green-200" 
                                                    : "text-red-700 bg-red-50 border-red-200"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    isConnected ? "bg-green-500" : "bg-red-500"
                                                }`} />
                                                {serverStatus === "online" ? "Online" : 
                                                 serverStatus === "offline" ? "Offline" : "Connecting"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6 overflow-y-auto bg-white">
                            <div className="mb-6">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <motion.div
                                            className={`relative rounded-lg border-2 bg-white transition-all ${
                                                isInputFocused 
                                                    ? "border-cyan-400 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]" 
                                                    : "border-gray-200 hover:border-gray-300"
                                            } ${status === "processing" ? "opacity-70" : ""} ${
                                                !isConnected ? "opacity-50" : ""
                                            }`}
                                        >
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                {status === "processing" ? (
                                                    <div className="w-5 h-5 border-2 border-cyan-300 border-t-cyan-500 rounded-full animate-spin" />
                                                ) : !isConnected ? (
                                                    <WifiOff className="w-5 h-5 text-red-400" />
                                                ) : (
                                                    <Search className="w-5 h-5" />
                                                )}
                                            </div>
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                onFocus={() => setIsInputFocused(true)}
                                                onBlur={() => setIsInputFocused(false)}
                                                onKeyDown={(e) => e.key === "Enter" && !isSearchDisabled && handleSearch()}
                                                placeholder={
                                                    !isConnected 
                                                        ? "Server offline - check connection"
                                                        : "Search for stocks using company names or market descriptions..."
                                                }
                                                disabled={!isConnected || status === "processing"}
                                                className="w-full pl-11 pr-10 py-3 text-base bg-transparent focus:outline-none placeholder-gray-400"
                                            />
                                            <AnimatePresence>
                                                {query && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        onClick={() => setQuery("")}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </div>
                                    <motion.button
                                        onClick={handleSearch}
                                        disabled={isSearchDisabled}
                                        className="px-6 py-3 rounded-lg font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)" }}
                                        whileHover={{ scale: isSearchDisabled ? 1 : 1.02 }}
                                        whileTap={{ scale: isSearchDisabled ? 1 : 0.98 }}
                                    >
                                        {status === "processing" ? (
                                            <span className="inline-flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Searching</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2">
                                                <Zap className="h-5 w-5" />
                                                <span>Search</span>
                                            </span>
                                        )}
                                    </motion.button>
                                </div>

                                {renderConnectionStatus()}
                            </div>
                            
                            <div className="min-h-[400px] flex flex-col">
                                {status === "idle" && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                            <Search className="h-10 w-10 text-cyan-500" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-gray-900 mb-3">Smart Stock Discovery</h4>
                                        <p className="text-gray-500 max-w-md mb-6">
                                            Use natural language to find stocks that match your investment criteria and market interests.
                                        </p>
                                        
                                        {recentQueries.length > 0 && (
                                            <div className="w-full max-w-2xl">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Clock className="h-5 w-5 text-gray-400" />
                                                    <h5 className="text-sm font-medium text-gray-600">Recent Searches</h5>
                                                </div>
                                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                    <ul className="divide-y divide-gray-200">
                                                        {recentQueries.map((cachedQuery, index) => (
                                                            <motion.li
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="group"
                                                            >
                                                                <div className="flex items-center">
                                                                    <button
                                                                        onClick={() => handleRecentQueryClick(cachedQuery)}
                                                                        className="flex-1 flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150"
                                                                    >
                                                                        <span className="text-sm text-gray-800 truncate mr-3">{cachedQuery.query}</span>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            {cachedQuery.response.status === 'completed' && cachedQuery.response.stockResults.length > 0 && (
                                                                                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                                                    {cachedQuery.response.stockResults.length} found
                                                                                </span>
                                                                            )}
                                                                            {cachedQuery.response.status === 'completed' && cachedQuery.response.stockResults.length === 0 && (
                                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                                    0 found
                                                                                </span>
                                                                            )}
                                                                            {cachedQuery.response.status === 'error' && (
                                                                                <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                                                    Error
                                                                                </span>
                                                                            )}
                                                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                                                        </div>
                                                                    </button>
                                                                    <motion.button
                                                                        onClick={() => removeRecentQuery(index)}
                                                                        className="p-2 mx-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100"
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        title="Remove from recent searches"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </motion.button>
                                                                </div>
                                                            </motion.li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {status === "processing" && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                            <div className="w-10 h-10 border-4 border-gray-300 border-t-cyan-500 rounded-full animate-spin"></div>
                                        </div>
                                        <h4 className="text-xl font-semibold text-gray-900 mb-3">Analyzing Market Data</h4>
                                        <p className="text-gray-500 max-w-md">
                                            Our AI is processing your search across thousands of stocks and market data points to find the best matches.
                                        </p>
                                    </div>
                                )}

                                {status === "error" && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                            <AlertCircle className="h-10 w-10 text-red-500" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-gray-900 mb-3">Search Unavailable</h4>
                                        <p className="text-gray-500 max-w-md mb-6">
                                            {errorMessage || (!isConnected ? "Server is offline. Please check your connection and try again." : "Unable to process your search request.")}
                                        </p>
                                        {!isInCooldown && (
                                            <button
                                                onClick={handleRetry}
                                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                {!isConnected ? 'Retry Connection' : 'Retry Search'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {status === "completed" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="h-6 w-6 text-green-500" />
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    Discovery Complete - {stockResults.length} Item{stockResults.length !== 1 ? 's' : ''} Found
                                                </h4>
                                            </div>
                                            <button
                                                onClick={handleDiscard}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-sm"
                                                title="Clear search results"
                                            >
                                                <X className="h-4 w-4" /> Discard
                                            </button>
                                        </div>

                                        {stockResults.length > 0 ? (
                                            <div className="grid gap-4">
                                                {stockResults.map((stock, index) => {
                                                    const isSaved = isStockSaved(stock);
                                                    
                                                    const renderActionButtons = () => {
                                                        if ((stock.context === 'stock' && currentTab === 'monitoring') || (stock.context === 'model' && currentTab === 'visualization')) {
                                                            const buttonText = stock.context === 'model' ? 'Saved Models' : 'Favorites';
                                                            
                                                            if (isSaved) {
                                                                return (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                                                                            <Check className="h-4 w-4" />
                                                                            <span className="text-sm font-medium">In {buttonText}</span>
                                                                        </div>
                                                                        
                                                                        <button 
                                                                            onClick={() => handleGoToDashboard(currentTab as 'monitoring' | 'visualization')} 
                                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
                                                                        >
                                                                            <ExternalLink className="h-4 w-4" />
                                                                            View in {currentTab === 'monitoring' ? 'Monitoring' : 'Visualization'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <button 
                                                                        onClick={() => handleAddToFavorites(stock)} 
                                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
                                                                    >
                                                                        <Plus className="h-4 w-4" /> Add to {buttonText}
                                                                    </button>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    };

                                                    const renderNavigationMessage = () => {
                                                        if (stock.context === 'stock' && currentTab === 'visualization') {
                                                            return (
                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                                                        <TrendingUp className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-700 mb-3">This is a stock. Go to the Monitoring Dashboard to track its performance.</p>
                                                                        <button 
                                                                            onClick={() => handleGoToDashboard('monitoring')} 
                                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium"
                                                                        >
                                                                            <TrendingUp className="h-4 w-4" /> Go to Monitoring
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        if (stock.context === 'model' && currentTab !== 'visualization') {
                                                            return (
                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                                                        <Eye className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-700 mb-3">This is a model. Go to the Visualization tab to explore its structure.</p>
                                                                        <button 
                                                                            onClick={() => handleGoToDashboard('visualization')} 
                                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium"
                                                                        >
                                                                            <Eye className="h-4 w-4" /> Go to Visualization
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    };
                                                    
                                                    return (
                                                        <motion.div
                                                            key={stock.guid}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6"
                                                        >
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <h5 className="text-lg font-semibold text-gray-900">{stock.name}</h5>
                                                                    {stock.context && (
                                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">
                                                                            {stock.context}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {renderActionButtons()}
                                                            </div>
                                                            
                                                            {renderNavigationMessage() && (
                                                                <div className="mt-4">
                                                                    {renderNavigationMessage()}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-gray-500">No matching stocks or models were found for your query.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AISearchComponent;