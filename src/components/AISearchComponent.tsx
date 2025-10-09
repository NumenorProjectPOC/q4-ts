import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, RefreshCw, AlertCircle, CheckCircle, Clock, Eye, ChevronRight, Trash2, Check, ExternalLink, WifiOff, Sparkles, Bot, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StockData, useAIWebSocket, AISearchResponse } from '../context/AIWebSocketContext';
import { addFavoriteStock, addSavedModel, removeFavoriteStock } from '../services/quantiforeApi';
import { formatStockName } from '../utils/utility';
import { useTheme } from '../context/ThemeContext';

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
    currentTab
}) => {
    const { isDarkMode } = useTheme();
    const [query, setQuery] = useState("");
    const [recentQueries, setRecentQueries] = useState<CachedQuery[]>([]);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [consecutiveFailures, setConsecutiveFailures] = useState(0);
    const [lastFailureTime, setLastFailureTime] = useState<number>(0);
    const [isInCooldown, setIsInCooldown] = useState(false);
    const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
    const [savingStocks, setSavingStocks] = useState<Set<string>>(new Set());

    const { sendQuery, searchResponse, isConnected, reconnect, clearSearch, setSearchResponse } = useAIWebSocket();

    const { status, stockResults, errorMessage } = searchResponse;
    const currentQueryRef = useRef("");
    const inputRef = useRef<HTMLInputElement>(null);
    const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSearchAttemptRef = useRef<number>(0);
    const modalRef = useRef<HTMLDivElement>(null);

    // Monitor connection status and handle cooldowns
    useEffect(() => {
        if (!isConnected) {
            setServerStatus('offline');
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

    // Handle outside click and escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

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
            await sendQuery(trimmed, currentTab);
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
        // Add to loading set
        setSavingStocks(prev => new Set(prev).add(stock.guid));

        try {
            // Check if it's a model or stock based on context
            if (stock.context === 'model') {
                // Save to models
                await addSavedModel(stock.guid);

                // Update saved models in session storage
                const cachedModels = sessionStorage.getItem("saved_models");
                let savedModels = cachedModels ? JSON.parse(cachedModels) : [];

                const newSavedModel = {
                    ...stock,
                    label: formatStockName(stock.name),
                    value: stock.name.toLowerCase().replace(/\s+/g, '_'),
                    guid: stock.guid,
                    context: 'model'
                };

                const exists = savedModels.some((model: any) => model.guid === stock.guid);
                if (!exists) {
                    savedModels.unshift(newSavedModel);
                    sessionStorage.setItem("saved_models", JSON.stringify(savedModels));
                }

                onShowToast?.('completed', `${stock.name} saved to models successfully!`);

            } else {
                // Save to favorite stocks (existing functionality)
                await addFavoriteStock(stock.guid);

                const cached = sessionStorage.getItem("favorite_stocks");
                let favorites = cached ? JSON.parse(cached) : [];

                const newFavorite = {
                    ...stock,
                    label: formatStockName(stock.name),
                    value: stock.name.toLowerCase().replace(/\s+/g, '_'),
                    guid: stock.guid,
                    monitored: false
                };

                const exists = favorites.some((fav: any) => fav.guid === stock.guid);
                if (!exists) {
                    favorites.unshift(newFavorite);
                    sessionStorage.setItem("favorite_stocks", JSON.stringify(favorites));
                }

                onShowToast?.('completed', `${stock.name} added to favorites successfully!`);
            }

            onAddToFavorites?.(stock);

        } catch (error) {
            console.error("Error adding to collection:", error);
            const type = stock.context === 'model' ? 'model' : 'stock';
            onShowToast?.('error', `Failed to save ${type}. Please try again.`);
        } finally {
            // Remove from loading set
            setSavingStocks(prev => {
                const newSet = new Set(prev);
                newSet.delete(stock.guid);
                return newSet;
            });
        }
    };

    const handleRemoveFromFavorites = async (stock: StockData) => {
        try {
            await removeFavoriteStock(stock.guid);

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

    const isStockSaved = (stock: StockData) => {
        const currentFavorites = getCurrentFavorites();
        return currentFavorites.some((fav: any) => fav.guid === stock.guid || fav.name === stock.name);
    };

    useEffect(() => {
        if (status === "completed" && stockResults.length > 0) {
            onStockFound?.(stockResults[0]);
        }
    }, [status, stockResults, onStockFound]);

    useEffect(() => {
        if (status === "error" && errorMessage) {
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
                    className={`mt-4 text-sm px-4 py-3 rounded-xl border flex items-center gap-3 ${isDarkMode
                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                            : 'text-red-700 bg-red-50 border-red-200'
                        }`}
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
                            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${isDarkMode
                                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                                }`}
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
                    className={`mt-4 text-sm px-4 py-3 rounded-xl border flex items-center gap-3 ${isDarkMode
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    Connection unstable. Some features may not work properly.
                </motion.div>
            );
        }

        return null;
    };

    const isSearchDisabled = status === "processing" || !query.trim() || !isConnected || isInCooldown;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Theme-aware Backdrop */}
                    <motion.div
                        className={`absolute inset-0 backdrop ${isDarkMode ? 'bg-black/70' : 'bg-black/60'
                            }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Improved Modal */}
                    <motion.div
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`relative w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${isDarkMode
                                ? 'bg-slate-900/95 border-neutral-700/50 backdrop-blur-xl'
                                : 'bg-white/95 border-gray-100/50 backdrop-blur-xl'
                            }`}
                    >
                        {/* Improved Header */}
                        <div className={`border-b ${isDarkMode
                                ? 'bg-slate-800/50 border-neutral-700/50'
                                : 'bg-gray-50/50 border-gray-200/50'
                            }`}>
                            <div className={`relative flex justify-between items-center px-8 py-6`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${isDarkMode
                                            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400'
                                            : 'bg-gradient-to-br from-neutral-500/10 to-neutral-500/10 text-neutral-600'
                                        }`}>
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>AI Stock Discovery</h3>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-500'}>
                                                Discover and analyze with AI-powered search
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${isConnected
                                                    ? isDarkMode
                                                        ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                                                        : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                                                    : isDarkMode
                                                        ? 'text-red-400 bg-red-500/20 border-red-500/30'
                                                        : 'text-red-700 bg-red-100 border-red-200'
                                                }`}>
                                                <motion.span
                                                    className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    animate={isConnected ? { opacity: [1, 0.5, 1], scale: [1, 1.2, 1] } : {}}
                                                    transition={isConnected ? { duration: 2, repeat: Infinity } : {}}
                                                />
                                                {serverStatus === "online" ? "Online" :
                                                    serverStatus === "offline" ? "Offline" : "Connecting"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    className={`p-2.5 rounded-xl transition-all duration-200 ${isDarkMode
                                            ? 'text-neutral-400 hover:bg-neutral-700/50 hover:text-white'
                                            : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                                        }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-6 h-6" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className={`flex-1 p-8 overflow-y-auto ${isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'
                            }`}>
                            {/* Improved Search Bar */}
                            <div className="mb-8">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <motion.div
                                            className={`relative rounded-2xl border-2 transition-all ${isInputFocused
                                                    ? isDarkMode
                                                        ? 'border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)] bg-slate-800'
                                                        : 'border-neutral-500 shadow-[0_0_0_4px_rgba(100,100,100,0.15)] bg-white'
                                                    : isDarkMode
                                                        ? 'border-neutral-600 hover:border-neutral-500 bg-slate-800/50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                                } ${status === "processing" ? "opacity-70" : ""} ${!isConnected ? "opacity-50" : ""
                                                }`}
                                        >
                                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-neutral-400' : 'text-gray-400'
                                                }`}>
                                                {status === "processing" ? (
                                                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDarkMode
                                                            ? 'border-red-300 border-t-red-500'
                                                            : 'border-neutral-300 border-t-neutral-500'
                                                        }`} />
                                                ) : !isConnected ? (
                                                    <WifiOff className="w-5 h-5" />
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
                                                className={`w-full pl-12 pr-12 py-4 text-base bg-transparent focus:outline-none font-medium ${isDarkMode
                                                        ? 'text-white placeholder-neutral-500'
                                                        : 'text-gray-900 placeholder-gray-400'
                                                    }`}
                                            />
                                            <AnimatePresence>
                                                {query && (
                                                    <button
                                                        onClick={() => setQuery("")}
                                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isDarkMode
                                                                ? 'hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300'
                                                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                                            }`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </div>
                                    <motion.button
                                        onClick={handleSearch}
                                        disabled={isSearchDisabled}
                                        className={`px-8 py-4 rounded-2xl font-semibold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                                : 'bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-neutral-800 hover:to-neutral-900'
                                            }`}
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
                                                <Sparkles className="h-5 w-5" />
                                                <span>Search</span>
                                            </span>
                                        )}
                                    </motion.button>
                                </div>

                                {renderConnectionStatus()}
                            </div>

                            {/* Content States */}
                            <div className="min-h-[400px] flex flex-col">
                                {status === "idle" && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <motion.div
                                            className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-lg ${isDarkMode
                                                    ? 'bg-gradient-to-br from-red-500/20 to-neutral-500/20'
                                                    : 'bg-gradient-to-br from-neutral-100 to-neutral-200'
                                                }`}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <Search className={`h-16 w-16 ${isDarkMode ? 'text-red-400' : 'text-neutral-600'
                                                }`} />
                                        </motion.div>
                                        <h4 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Stock Discovery</h4>
                                        <p className={`max-w-lg mb-8 text-lg leading-relaxed ${isDarkMode ? 'text-neutral-300' : 'text-gray-500'
                                            }`}>
                                            Use natural language to find stocks that match your area of interests.
                                        </p>

                                        {recentQueries.length > 0 && (
                                            <div className="w-full max-w-3xl">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className={`p-2 rounded-lg ${isDarkMode
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-neutral-100 text-neutral-600'
                                                        }`}>
                                                        <Clock className="h-5 w-5" />
                                                    </div>
                                                    <h5 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'
                                                        }`}>Recent Searches</h5>
                                                </div>
                                                <div className={`border rounded-2xl overflow-hidden shadow-sm ${isDarkMode
                                                        ? 'bg-slate-800/50 border-neutral-600'
                                                        : 'bg-white border-gray-200'
                                                    }`}>
                                                    <ul className={`divide-y ${isDarkMode ? 'divide-neutral-700' : 'divide-gray-100'
                                                        }`}>
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
                                                                        className={`flex-1 flex items-center justify-between px-6 py-4 text-left transition-colors duration-150 ${isDarkMode
                                                                                ? 'hover:bg-slate-700/30'
                                                                                : 'hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <span className={`text-base truncate mr-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'
                                                                            }`}>{cachedQuery.query}</span>
                                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                                            {cachedQuery.response.status === 'completed' && cachedQuery.response.stockResults.length > 0 && (
                                                                                <span className={`text-sm px-3 py-1 rounded-full font-medium ${isDarkMode
                                                                                        ? 'text-red-400 bg-red-500/20'
                                                                                        : 'text-neutral-700 bg-neutral-100'
                                                                                    }`}>
                                                                                    {cachedQuery.response.stockResults.length} found
                                                                                </span>
                                                                            )}
                                                                            {cachedQuery.response.status === 'completed' && cachedQuery.response.stockResults.length === 0 && (
                                                                                <span className={`text-sm px-3 py-1 rounded-full font-medium ${isDarkMode
                                                                                        ? 'text-neutral-400 bg-neutral-600/20'
                                                                                        : 'text-gray-600 bg-gray-100'
                                                                                    }`}>
                                                                                    0 found
                                                                                </span>
                                                                            )}
                                                                            {cachedQuery.response.status === 'error' && (
                                                                                <span className={`text-sm px-3 py-1 rounded-full font-medium ${isDarkMode
                                                                                        ? 'text-red-400 bg-red-500/20'
                                                                                        : 'text-red-700 bg-red-100'
                                                                                    }`}>
                                                                                    Error
                                                                                </span>
                                                                            )}
                                                                            <ChevronRight className={`h-5 w-5 ${isDarkMode ? 'text-neutral-500' : 'text-gray-400'
                                                                                }`} />
                                                                        </div>
                                                                    </button>
                                                                    <motion.button
                                                                        onClick={() => removeRecentQuery(index)}
                                                                        className={`p-3 mx-2 rounded-xl transition-all duration-150 opacity-0 group-hover:opacity-100 ${isDarkMode
                                                                                ? 'text-neutral-500 hover:text-red-400 hover:bg-red-500/10'
                                                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                                            }`}
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
                                        <motion.div
                                            className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-lg ${isDarkMode
                                                    ? 'bg-gradient-to-br from-red-500/20 to-neutral-500/20'
                                                    : 'bg-gradient-to-br from-neutral-100 to-neutral-200'
                                                }`}
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        >
                                            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${isDarkMode
                                                    ? 'border-red-300/30 border-t-red-500'
                                                    : 'border-neutral-300 border-t-neutral-600'
                                                }`}></div>
                                        </motion.div>
                                        <h4 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Analyzing Data</h4>
                                        <p className={`max-w-lg text-lg ${isDarkMode ? 'text-neutral-300' : 'text-gray-500'
                                            }`}>
                                            Our AI is processing your search across thousands of data points to find the best result.
                                        </p>
                                    </div>
                                )}

                                {status === "error" && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <motion.div
                                            className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-lg ${isDarkMode
                                                    ? 'bg-red-500/20'
                                                    : 'bg-red-100'
                                                }`}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                        >
                                            <AlertCircle className={`h-16 w-16 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                                }`} />
                                        </motion.div>
                                        <h4 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Search Unavailable</h4>
                                        <p className={`max-w-lg mb-8 text-lg ${isDarkMode ? 'text-neutral-300' : 'text-gray-500'
                                            }`}>
                                            {errorMessage || (!isConnected ? "Server is offline. Please check your connection and try again." : "Unable to process your search request.")}
                                        </p>
                                        {!isInCooldown && (
                                            <motion.button
                                                onClick={handleRetry}
                                                className={`px-8 py-4 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 ${isDarkMode
                                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <RefreshCw className="h-5 w-5" />
                                                {!isConnected ? 'Retry Connection' : 'Retry Search'}
                                            </motion.button>
                                        )}
                                    </div>
                                )}

                                {status === "completed" && (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${isDarkMode
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-neutral-100 text-neutral-600'
                                                    }`}>
                                                    <CheckCircle className="h-6 w-6" />
                                                </div>
                                                <h4 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                    Discovery Complete - {stockResults.length} Item{stockResults.length !== 1 ? 's' : ''} Found
                                                </h4>
                                            </div>
                                            <motion.button
                                                onClick={handleDiscard}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${isDarkMode
                                                        ? 'bg-neutral-600/20 text-neutral-300 hover:bg-neutral-600/30'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                title="Clear search results"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <X className="h-4 w-4" /> Discard
                                            </motion.button>
                                        </div>

                                        {stockResults.length > 0 ? (
                                            <div className="grid gap-6">
                                                {stockResults.map((stock, index) => {
                                                    const isSaved = isStockSaved(stock);

                                                    const renderActionButtons = () => {
                                                        if ((stock.context === 'stock' && currentTab === 'monitoring') || (stock.context === 'model' && currentTab === 'visualization')) {
                                                            const buttonText = stock.context === 'model' ? 'Saved Models' : 'Favorites';

                                                            if (isSaved) {
                                                                return (
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`flex items-center gap-2 px-4 py-2 border rounded-xl ${isDarkMode
                                                                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                                                : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                                                                            }`}>
                                                                            <Check className="h-4 w-4" />
                                                                            <span className="font-medium">In {buttonText}</span>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => handleGoToDashboard(currentTab as 'monitoring' | 'visualization')}
                                                                            className={`px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 ${isDarkMode
                                                                                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                                                                    : 'bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-neutral-800 hover:to-neutral-900'
                                                                                }`}
                                                                        >
                                                                            <ExternalLink className="h-4 w-4" />
                                                                            View in {currentTab === 'monitoring' ? 'Monitoring' : 'Visualization'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    // In your renderActionButtons function, update the button to show loading
                                                                    <button
                                                                        onClick={() => handleAddToFavorites(stock)}
                                                                        disabled={savingStocks.has(stock.guid)}
                                                                        className={`px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode
                                                                                ? 'bg-gradient-to-r from-neutral-600 to-neutral-700 hover:from-neutral-700 hover:to-neutral-800'
                                                                                : 'bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-neutral-800 hover:to-neutral-900'
                                                                            }`}
                                                                    >
                                                                        {savingStocks.has(stock.guid) ? (
                                                                            <>
                                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                                <span>Saving...</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Plus className="h-4 w-4" />
                                                                                <span>Add to {stock.context === 'model' ? 'Saved Models' : 'Favorites'}</span>
                                                                            </>
                                                                        )}
                                                                    </button>

                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    };

                                                    const renderNavigationMessage = () => {
                                                        if (stock.context === 'stock' && currentTab === 'visualization') {
                                                            return (
                                                                <div className={`border rounded-2xl p-6 flex items-start gap-4 ${isDarkMode
                                                                        ? 'bg-gradient-to-r from-red-500/10 to-neutral-500/10 border-red-500/20'
                                                                        : 'bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-200'
                                                                    }`}>
                                                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isDarkMode
                                                                            ? 'bg-gradient-to-br from-red-600 to-red-700'
                                                                            : 'bg-gradient-to-br from-neutral-700 to-neutral-800'
                                                                        }`}>
                                                                        <Activity className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className={`text-base mb-4 font-medium ${isDarkMode ? 'text-neutral-200' : 'text-gray-700'
                                                                            }`}>This is a stock. Go to the Monitoring Dashboard to track its performance.</p>
                                                                        <button
                                                                            onClick={() => handleGoToDashboard('monitoring')}
                                                                            className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all ${isDarkMode
                                                                                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                                                                    : 'bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-neutral-800 hover:to-neutral-900'
                                                                                }`}
                                                                        >
                                                                            <Activity className="h-4 w-4" /> Go to Monitoring
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        if (stock.context === 'model' && currentTab !== 'visualization') {
                                                            return (
                                                                <div className={`border rounded-2xl p-6 flex items-start gap-4 ${isDarkMode
                                                                        ? 'bg-gradient-to-r from-red-500/10 to-red-500/10 border-red-500/20'
                                                                        : 'bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-200'
                                                                    }`}>
                                                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isDarkMode
                                                                            ? 'bg-gradient-to-br from-red-600 to-red-700'
                                                                            : 'bg-gradient-to-br from-neutral-700 to-neutral-800'
                                                                        }`}>
                                                                        <Eye className="h-6 w-6" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className={`text-base mb-4 font-medium ${isDarkMode ? 'text-neutral-200' : 'text-gray-700'
                                                                            }`}>This is a model. Go to the Visualization tab to explore its structure.</p>
                                                                        <button
                                                                            onClick={() => handleGoToDashboard('visualization')}
                                                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neutral-700 to-red-700 hover:from-neutral-800 hover:to-red-800 text-white rounded-xl font-semibold transition-all"
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
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                                                            className={`rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 p-8 ${isDarkMode
                                                                    ? 'bg-slate-800/50 border-neutral-600'
                                                                    : 'bg-white border-gray-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="flex items-center gap-4">
                                                                    <h5 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                                        }`}>{stock.name}</h5>
                                                                    {stock.context && (
                                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${isDarkMode
                                                                                ? 'bg-neutral-600/20 text-neutral-300'
                                                                                : 'bg-gray-100 text-gray-700'
                                                                            }`}>
                                                                            {stock.context}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 flex-wrap mb-6">
                                                                {renderActionButtons()}
                                                            </div>

                                                            {renderNavigationMessage() && (
                                                                <div>
                                                                    {renderNavigationMessage()}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16">
                                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-neutral-600/20' : 'bg-gray-100'
                                                    }`}>
                                                    <Search className={`h-12 w-12 ${isDarkMode ? 'text-neutral-500' : 'text-gray-400'
                                                        }`} />
                                                </div>
                                                <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>No Results Found</h4>
                                                <p className={`text-lg ${isDarkMode ? 'text-neutral-300' : 'text-gray-500'
                                                    }`}>No matching stocks or models were found for your query.</p>
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