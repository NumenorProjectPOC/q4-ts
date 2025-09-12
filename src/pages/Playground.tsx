//Playground.tsx(Parent-Visualization Dashboard)
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useReducer } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchSavedModel, fetchGraphData, removeSavedModel, shareSavedModel } from '../services/quantiforeApi';
import RightSidebar from "../components/RightSidebar";
import { GraphData, NodeData, LinkData } from '../services/types';
import { Calendar, Info, Eye, Pause, Play, RefreshCw, Search, Share2, Trash2, ArrowRight, TrendingUp, TrendingDown, Minus, Activity, Zap, Target, ChevronRight, ChevronLeft, Waypoints } from 'lucide-react';
import { formatStockName } from '../utils/utility';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import ShareModal from '../components/ui/ShareModal';
import Toast from '../components/ui/Toast';
import { enhancedSimulateStockGrowth, simulateStockGrowth } from '../utils/simulation';
import { AnimatePresence, motion } from "framer-motion";
import AISearchComponent from '../components/AISearchComponent';
import { useNavigate } from 'react-router-dom';
import Dock from '../components/ui/Dock';

interface ValueUnit {
    value: number;
    unit: string;
}

interface Relationship {
    impact: "positive" | "negative";
    weight: number;
    flow: number;
}

interface Stock {
    guid: string;
    name: string;
    value: ValueUnit;
    context?: string;
    relationship?: Relationship;
}

interface Model {
    model_guid: string;
    model_name: string;
    shared_by: string;
    shared_by_username: string;
}

interface SimulationSettings {
    timeUnit: "hours" | "days" | "weeks" | "months" | "years";
    value: number;
}

const Playground: React.FC = () => {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<LinkData | null>(null);
    const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
        timeUnit: "years",
        value: 0
    });
    const [simulationValue, setSimulationValue] = useState<number>(0);
    const [animatedSimulationValue, setAnimatedSimulationValue] = useState<number>(0);
    const sidebarWidthRef = useRef(0);
    const [sidebarWidth, setSidebarWidth] = useState(0);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [editedValue, setEditedValue] = useState<number | string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStockName, setCurrentStockName] = useState("");
    const [runSimulation, setRunSimulation] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [savedModels, setSavedModels] = useState<Stock[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [modelToShare, setModelToShare] = useState<Stock | null>(null);
    const [confirmPopup, setConfirmPopup] = useState<{ model: Stock | null }>({ model: null });
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [toastSocket, setToastSocket] = useState<{ type: "completed" | "error" | "warning", message: string } | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [visualizingModelId, setVisualizingModelId] = useState<string | null>(null);
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [showAISearch, setShowAISearch] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showSimulationPanel, setShowSimulationPanel] = useState(false);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    const navigate = useNavigate();

    // Layout effect for sidebar width
    useLayoutEffect(() => {
        const updateSidebarWidth = () => {
            if (sidebarRef.current) {
                const newWidth = sidebarRef.current.offsetWidth;
                if (newWidth !== sidebarWidthRef.current) {
                    sidebarWidthRef.current = newWidth;
                    setSidebarWidth(newWidth);
                }
            }
        };

        updateSidebarWidth();

        const resizeObserver = new ResizeObserver(updateSidebarWidth);
        if (sidebarRef.current) {
            resizeObserver.observe(sidebarRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Load saved models
    useEffect(() => {
        const loadSavedModels = async () => {
            try {
                const cached = sessionStorage.getItem("saved_models");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setSavedModels(parsed);
                            return;
                        }
                    } catch (parseError) {
                        sessionStorage.removeItem("saved_models");
                    }
                }

                const models = await fetchSavedModel();
                const formatted = models.map((model) => ({
                    guid: model.model_guid,
                    name: model.model_name,
                    value: { value: 0, unit: "unknown" },
                    sharedBy: model.shared_by_username || null,
                }));

                if (formatted.length > 0) {
                    sessionStorage.setItem("saved_models", JSON.stringify(formatted));
                    setSavedModels(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch saved models", error);
                setToast({
                    type: "error",
                    message: "Could not load saved models. Please try again.",
                });
            }
        };

        loadSavedModels();
    }, []);

    // Fetch graph data when stock changes
    useEffect(() => {
        if (!currentStockName) return;

        setIsLoading(true);
        fetchGraphData(currentStockName)
            .then((data: GraphData) => {
                setGraphData(data);
                setShowPlaceholder(false);
            })
            .catch((error) => {
                console.error("Error fetching graph data:", error);
                setToast({
                    type: "error",
                    message: "Failed to load graph data. Please try again.",
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [currentStockName]);

    // Handle stored visualization state
    useEffect(() => {
        const storedVisualizingId = sessionStorage.getItem("visualizing_model_id");
        if (storedVisualizingId) {
            setVisualizingModelId(storedVisualizingId);
            setCurrentStockName(storedVisualizingId);
            setShowPlaceholder(false);
            setIsLoading(true);

            fetchGraphData(storedVisualizingId)
                .then((data: GraphData) => {
                    setGraphData(data);
                    setShowPlaceholder(false);
                })
                .catch((error) => {
                    console.error("Error fetching graph data:", error);
                    setVisualizingModelId(null);
                    setShowPlaceholder(true);
                    setCurrentStockName("");
                    setGraphData(null);
                    sessionStorage.removeItem("visualizing_model_id");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, []);

    // Handle visualization state changes
    useEffect(() => {
        if (visualizingModelId) {
            sessionStorage.setItem("visualizing_model_id", visualizingModelId);
            setShowPlaceholder(false);
            setShowDetailsPanel(true);
            setShowSimulationPanel(true);
        } else {
            sessionStorage.removeItem("visualizing_model_id");
            setShowPlaceholder(true);
            setCurrentStockName("");
            setGraphData(null);
            setShowDetailsPanel(false);
            setShowSimulationPanel(false);
        }
    }, [visualizingModelId]);

    const setSelectedElement = useCallback((element: NodeData | LinkData | null) => {
        setEditedValue(null);
        if (element && 'source' in element) {
            setSelectedNode(null);
            setSelectedEdge(element as LinkData);
        } else if (element && 'id' in element) {
            setSelectedNode(element as NodeData);
            setSelectedEdge(null);
        } else {
            setSelectedNode(null);
            setSelectedEdge(null);
        }
    }, []);

    const handleSave = useCallback(() => {
        if (!graphData || editedValue === null || editedValue === '' || editedValue === '-') return;

        const newValue = typeof editedValue === 'string' ? parseInt(editedValue, 10) : editedValue;
        if (isNaN(newValue)) return;

        const newGraphData = JSON.parse(JSON.stringify(graphData));

        if (selectedNode) {
            const nodeToUpdate = newGraphData.nodes.find((n: NodeData) => n.id === selectedNode.id);
            if (nodeToUpdate) {
                nodeToUpdate.value.value = newValue;
            }
            if (selectedNode.id === newGraphData.stock.guid) {
                newGraphData.stock.value.value = newValue;
            }
        } else {
            newGraphData.stock.value.value = newValue;
            const mainStockNode = newGraphData.nodes.find((n: NodeData) => n.id === newGraphData.stock.guid);
            if (mainStockNode) {
                mainStockNode.value.value = newValue;
            }
        }

        setGraphData(newGraphData);

        if (selectedNode) {
            setSelectedNode(prev => prev ? { ...prev, value: { ...prev.value, value: newValue } } : null);
        }

        setEditedValue(null);
    }, [selectedNode, editedValue, graphData]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || val === '-') {
            setEditedValue(val);
        } else {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                setEditedValue(num);
            }
        }
    };

    const handleTimeUnitChange = useCallback((unit: "hours" | "days" | "weeks" | "months" | "years") => {
        setSimulationSettings(prevSettings => ({
            ...prevSettings,
            timeUnit: unit,
            value: 0
        }));
        setSimulationValue(0);
        setAnimatedSimulationValue(0);
    }, []);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        setSimulationValue(newValue);
    }, []);

    const handleReset = useCallback(() => {
        setSimulationSettings(prevSettings => ({
            ...prevSettings,
            value: 0
        }));
        setSimulationValue(0);
        setAnimatedSimulationValue(0);
    }, []);

    const animateSimulation = useCallback((targetValue: number, duration: number) => {
        setRunSimulation(true);
        setIsSimulating(true);
        setTimeout(() => {
            setRunSimulation(false);
            setIsSimulating(false);
        }, duration);
    }, []);

    const memoizedSimulationSettings = useMemo(() => ({
        timeUnit: simulationSettings.timeUnit,
        value: simulationSettings.value,
    }), [simulationSettings.timeUnit, simulationSettings.value]);

    const memoizedSelectedElement = useMemo(() => selectedNode || selectedEdge, [selectedNode, selectedEdge]);

    // New: derived flag to decide whether to show right widgets
  const shouldShowRightWidgets = !!graphData && !isLoading && !showPlaceholder;

    return (
        <div className="relative flex flex-col h-screen w-full overflow-hidden bg-white text-gray-900">
            {/* Header - Enhanced Red Theme */}
            <header className="relative flex items-center justify-between px-8 h-20 bg-white shadow-lg border-b border-brand-red-100 z-30">
                <div className="flex items-center space-x-4">
                    <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg">
                            <Waypoints className="w-5 h-5 text-red-700" />
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-gray-900">
                                {graphData ? formatStockName(graphData.stock.name) : 'Visualization'}
                            </div>
                            <div className="text-sm text-gray-600">Interactive model exploration and analysis</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {graphData && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Live Data
                        </div>
                    )}
                    <motion.button
                        className="relative ml-4 rounded-full bg-white p-2.5 text-gray-700 shadow-lg hover:bg-red-50 border border-red-200"
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        aria-label="Toggle right sidebar"
                    >
                        <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ rotate: isPanelOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                animate={{
                                    d: isPanelOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16",
                                }}
                            />
                        </motion.svg>
                    </motion.button>
                </div>
            </header>

            <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-red-400 to-orange-400 blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-tr from-blue-400 to-purple-400 blur-3xl"></div>
                </div>

                {/* Left Sidebar - Fixed Icon */}
                <motion.div
                    className={`${isSidebarCollapsed ? "w-16" : "w-94"} absolute left-6 top-6 bottom-6 z-20 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl flex flex-col transition-all duration-300`}
                    ref={sidebarRef}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-red-50 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            {!isSidebarCollapsed && (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                                        <Waypoints className="w-4 h-4 text-white" />
                                    </div>
                                    <h2 className="font-bold text-gray-900">Model Search</h2>
                                </div>
                            )}
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="ms-[-10px] p-2 rounded-xl hover:bg-red-50 text-gray-600 transition-colors border border-red-200 shadow-sm"
                            >
                                {/* Fixed Icon Logic */}
                                {isSidebarCollapsed ? (
                                    <ChevronRight className="w-4 h-4" />
                                ) : (
                                    <ChevronLeft className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {!isSidebarCollapsed ? (
                        <div className="flex-1 flex flex-col">
                            {/* AI Search Button - Enhanced Red Theme */}
                            <div className="p-6 border-b border-gray-200">
                                <motion.button
                                    onClick={() => setShowAISearch(true)}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 group shadow-lg hover:shadow-xl"
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <span className="font-semibold">AI Stock Search</span>
                                    <div className="ml-auto">
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </motion.button>
                            </div>

                            {/* Saved Models - Enhanced Design */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                            Saved Models
                                        </h3>
                                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                                            {savedModels.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {savedModels.length > 0 ? savedModels.map((model) => {
                                            const isSelected = visualizingModelId === model.name;
                                            return (
                                                <motion.div
                                                    key={model.guid}
                                                    className={`p-4 rounded-xl border transition-all group cursor-pointer ${isSelected
                                                        ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-lg'
                                                        : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-lg'}`}
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-gray-900 truncate mb-1">
                                                                {formatStockName(model.name)}
                                                            </div>
                                                            {isSelected && (
                                                                <div className="text-xs text-red-600 flex items-center gap-1 font-medium">
                                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                                                    Currently viewing
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <motion.button
                                                                onClick={() => {
                                                                    if (visualizingModelId === model.name) {
                                                                        setVisualizingModelId(null);
                                                                    } else {
                                                                        setVisualizingModelId(model.name);
                                                                        setCurrentStockName(model.name);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-lg transition-all ${isSelected
                                                                    ? 'text-red-600 hover:bg-red-200 bg-red-100'
                                                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                title={isSelected ? "Stop Visualization" : "Visualize"}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={() => {
                                                                    setModelToShare(model);
                                                                    setShowShareModal(true);
                                                                }}
                                                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                title="Share"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={() => setConfirmPopup({ model })}
                                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                title="Remove"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        }) : (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-sm text-gray-500 mb-1 font-medium">No saved models</p>
                                                <p className="text-xs text-gray-400">Use AI search to find models</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Collapsed state
                        <div className="p-3">
                            <button
                                onClick={() => setShowAISearch(true)}
                                className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                                title="AI Data Search"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Graph Area - Full Width */}
                <div className="absolute inset-0">
                    {showPlaceholder ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.div
                                className="text-center space-y-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
                                    <Waypoints className="w-10 h-10 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Start Exploring Models</h3>
                                    <p className="text-gray-500 max-w-md">
                                        Select a saved model from the sidebar to visualize its network and relationships.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <GraphComponent
                            key={visualizingModelId}
                            isLoading={isLoading}
                            simulationSettings={memoizedSimulationSettings}
                            simulationValue={simulationValue}
                            graphData={graphData}
                            selectedElement={memoizedSelectedElement}
                            setSelectedElement={setSelectedElement}
                            sidebarWidth={sidebarWidth}
                            nodeValueChangeCallback={() => { }}
                            runSimulation={runSimulation}
                        />
                    )}
                </div>

                {/* Aligned Widgets - Both positioned from top with proper spacing */}
                <AnimatePresence>
                    {showDetailsPanel && shouldShowRightWidgets && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="absolute right-6 top-6 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-20"
                        >
                            {/* Simple Panel Header */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-red-50 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <Info className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">
                                        {selectedEdge ? 'Relationship Details' : 'Model Details'}
                                    </h3>
                                </div>
                            </div>

                            {/* Panel Content - Always Expanded */}
                            <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
                                {selectedEdge?.relationshipList && selectedEdge.relationshipList.length > 0 ? (
                                    /* Edge Details */
                                    <div className="space-y-4">
                                        {selectedEdge.relationshipList.map((rel, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {rel.impact === 'positive' ? (
                                                            <div className="p-1.5 bg-green-100 rounded-lg">
                                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                            </div>
                                                        ) : rel.impact === 'negative' ? (
                                                            <div className="p-1.5 bg-red-100 rounded-lg">
                                                                <TrendingDown className="w-4 h-4 text-red-600" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-1.5 bg-gray-100 rounded-lg">
                                                                <Minus className="w-4 h-4 text-gray-600" />
                                                            </div>
                                                        )}
                                                        <span className={`text-sm font-bold capitalize ${rel.impact === 'positive' ? 'text-green-700' :
                                                                rel.impact === 'negative' ? 'text-red-700' : 'text-gray-700'
                                                            }`}>
                                                            {rel.impact} Impact
                                                        </span>
                                                    </div>
                                                    <div className="bg-white px-3 py-1 rounded-lg border border-gray-200">
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {Math.round(rel.weight * 100)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-xl p-3 mb-3 border border-gray-100">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex-1">
                                                            <div className="text-gray-500 mb-1 text-xs uppercase tracking-wider font-medium">From</div>
                                                            <div className="font-bold text-gray-900">
                                                                {formatStockName(rel.fromName)}
                                                            </div>
                                                        </div>
                                                        <div className="mx-4 flex items-center">
                                                            <ArrowRight className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-gray-500 mb-1 text-xs uppercase tracking-wider font-medium">To</div>
                                                            <div className="font-bold text-gray-900">
                                                                {formatStockName(rel.toName)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-600">
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                                        Flow: {rel.flow}
                                                    </span>
                                                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">
                                                        Weight: {rel.weight}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : selectedNode ? (
                                    /* Node Details */
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                                                    <Target className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">
                                                        {formatStockName(selectedNode.name || "")}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">Node Value</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="bg-white rounded-lg p-3 border border-red-100">
                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Value</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={editedValue !== null ? editedValue : Math.round(selectedNode.value?.value || 0)}
                                                            onChange={handleValueChange}
                                                            className="w-full px-3 py-2 pr-16 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 font-bold"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-red-100">
                                                            {selectedNode.value?.unit || 'units'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <motion.button
                                                    onClick={handleSave}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-lg hover:shadow-xl"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Zap className="w-4 h-4" />
                                                        Save Changes
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                ) : graphData ? (
                                    /* Default Details */
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                                                    <Target className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">
                                                        {formatStockName(graphData.stock.name)}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">Main Stock</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="bg-white rounded-lg p-3 border border-red-100">
                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Value</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={editedValue !== null ? editedValue : Math.round(graphData.stock.value.value)}
                                                            onChange={handleValueChange}
                                                            className="w-full px-3 py-2 pr-16 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 font-bold"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-red-100">
                                                            {graphData.stock.value.unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                <motion.button
                                                    onClick={handleSave}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-lg hover:shadow-xl"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Zap className="w-4 h-4" />
                                                        Save Changes
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </div>

                                        <div className="text-center py-4">
                                            <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">
                                                Click on nodes or edges to see detailed information
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Aligned Simulation Panel - Positioned below Details panel */}
                <AnimatePresence>
                    {showSimulationPanel && shouldShowRightWidgets && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="absolute right-6 top-96 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-b-2xl shadow-2xl z-20"
                        >
                            {/* Simple Panel Header */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-green-50 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                                        <Activity className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Time Simulation</h3>
                                </div>
                            </div>

                            {/* Panel Content - Always Expanded */}
                            <div className="p-6 space-y-6">
                                {/* Time Unit Selection */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Time Unit
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['hours', 'days', 'weeks', 'months', 'years'] as const).map((unit) => (
                                            <motion.button
                                                key={unit}
                                                onClick={() => handleTimeUnitChange(unit)}
                                                className={`px-3 py-2 text-sm rounded-lg border transition-all font-semibold ${simulationSettings.timeUnit === unit
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-300 text-white shadow-lg'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:border-emerald-200'
                                                    }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span className="capitalize">{unit}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            Future Projection
                                        </label>
                                        <span className="text-sm bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                                            {simulationValue} {simulationSettings.timeUnit}
                                        </span>
                                    </div>

                                    <div className="relative mb-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max={
                                                simulationSettings.timeUnit === 'hours' ? 168 :
                                                    simulationSettings.timeUnit === 'days' ? 365 :
                                                        simulationSettings.timeUnit === 'weeks' ? 52 :
                                                            simulationSettings.timeUnit === 'months' ? 36 : 10
                                            }
                                            value={simulationValue}
                                            onChange={handleSliderChange}
                                            className="w-full h-3 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-lg appearance-none cursor-pointer slider-modern"
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                                        <span>Now</span>
                                        <span>
                                            {simulationSettings.timeUnit === 'hours' ? '1 Week' :
                                                simulationSettings.timeUnit === 'days' ? '1 Year' :
                                                    simulationSettings.timeUnit === 'weeks' ? '1 Year' :
                                                        simulationSettings.timeUnit === 'months' ? '3 Years' : '10 Years'}
                                        </span>
                                    </div>
                                </div>

                                {/* Control Buttons */}
                                <div className="space-y-3">
                                    <motion.button
                                        onClick={() => animateSimulation(simulationValue, 2000)}
                                        disabled={isSimulating}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                        whileHover={{ scale: isSimulating ? 1 : 1.02 }}
                                        whileTap={{ scale: isSimulating ? 1 : 0.98 }}
                                    >
                                        {isSimulating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Running Simulation...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Start Simulation
                                            </>
                                        )}
                                    </motion.button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            onClick={() => setIsPaused(!isPaused)}
                                            disabled={simulationValue === 0}
                                            className="px-3 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-lg hover:from-amber-200 hover:to-orange-200 transition-all font-bold disabled:opacity-50 text-sm flex items-center justify-center gap-1 border border-amber-200"
                                            whileHover={{ scale: simulationValue === 0 ? 1 : 1.05 }}
                                            whileTap={{ scale: simulationValue === 0 ? 1 : 0.95 }}
                                        >
                                            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                                            {isPaused ? 'Resume' : 'Pause'}
                                        </motion.button>
                                        <motion.button
                                            onClick={handleReset}
                                            className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all font-bold text-sm flex items-center justify-center gap-1 border border-gray-300"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Reset
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Backdrop and Sidebar */}
            <AnimatePresence>
                {isPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setIsPanelOpen(false)}
                        />
                        <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
                    </>
                )}
            </AnimatePresence>

            {/* Modals and Popups */}
            {confirmPopup.model && (
                <ConfirmationPopup
                    title="Remove Saved Model"
                    message={`Are you sure you want to remove ${confirmPopup.model.name}?`}
                    onConfirm={() => {
                        setConfirmPopup({ model: null });
                    }}
                    onCancel={() => setConfirmPopup({ model: null })}
                />
            )}

            {showShareModal && modelToShare && (
                <ShareModal
                    isStock={false}
                    itemLabel={modelToShare.name}
                    itemGuid={modelToShare.guid}
                    onClose={() => {
                        setShowShareModal(false);
                        setModelToShare(null);
                    }}
                />
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {toastSocket && (
                <Toast
                    type={toastSocket.type === 'completed' ? 'success' : toastSocket.type}
                    message={toastSocket.message}
                    onClose={() => setToastSocket(null)}
                />
            )}

            <AISearchComponent
                isOpen={showAISearch}
                onClose={() => setShowAISearch(false)}
                onStockFound={() => { }}
                onAddToFavorites={() => { }}
                onRemoveFromFavorites={() => { }}
                onShowToast={() => { }}
                onGoToDashboard={() => { }}
                currentTab="visualization"
            />

            <style>{`
                .slider-modern::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #10b981, #14b8a6);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                    
                .slider-modern::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #10b981, #14b8a6);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
            `}</style>
            <Dock />
        </div>
    );
};

export default Playground;