import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchSavedModel, fetchGraphData, removeSavedModel, shareSavedModel } from '../services/quantiforeApi';
import RightSidebar from "../components/RightSidebar";
import { GraphData, NodeData, LinkData } from '../services/types';
import { Calendar, Info, Eye, Pause, Play, RefreshCw, Search, Share2, Trash2, Activity, Target, ChevronRight, ChevronLeft, Waypoints, Settings, Menu, BarChart3, MoreVertical, X } from 'lucide-react';
import { formatStockName } from '../utils/utility';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import ShareModal from '../components/ui/ShareModal';
import Toast from '../components/ui/Toast';
import ThemeToggle from '../components/ui/ThemeToggle';
import { AnimatePresence, motion } from "framer-motion";
import AISearchComponent from '../components/AISearchComponent';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Dock from '../components/ui/Dock';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';

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

type NodeColorThemeName =
    | 'realistic-dark'
    | 'realistic-light'
    | 'brand-auto'
    | 'brand-dark-minimal'
    | 'brand-light-minimal'
    | 'brand-gradient';

const Playground: React.FC = () => {
    const { isDarkMode } = useTheme();
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<LinkData | null>(null);
    const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
        timeUnit: "years",
        value: 0
    });
    const [simulationValue, setSimulationValue] = useState<number>(0);
    const sidebarWidthRef = useRef(0);
    const [sidebarWidth, setSidebarWidth] = useState(0);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [editedValue, setEditedValue] = useState<number | string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStockName, setCurrentStockName] = useState("");
    const [runSimulation, setRunSimulation] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [savedModels, setSavedModels] = useState<Stock[]>([]);
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
    const [nodeTheme, setNodeTheme] = useState<NodeColorThemeName>('realistic-dark');
    const [darkMode, setDarkMode] = useState(true);

    // Mobile-specific states
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [activeDropdownModel, setActiveDropdownModel] = useState<Stock | null>(null);
    const [showMobileControls, setShowMobileControls] = useState(false);

    const navigate = useNavigate();

    // Responsive detection
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);

            // Auto-collapse sidebar on mobile
            if (width < 768) {
                setIsSidebarCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Layout effect for sidebar width
    useLayoutEffect(() => {
        const updateSidebarWidth = () => {
            if (sidebarRef.current && !isMobile) {
                const newWidth = sidebarRef.current.offsetWidth;
                if (newWidth !== sidebarWidthRef.current) {
                    sidebarWidthRef.current = newWidth;
                    setSidebarWidth(newWidth);
                }
            } else if (isMobile) {
                // On mobile, sidebar doesn't affect graph width
                setSidebarWidth(0);
            }
        };

        updateSidebarWidth();

        const resizeObserver = new ResizeObserver(updateSidebarWidth);
        if (sidebarRef.current && !isMobile) {
            resizeObserver.observe(sidebarRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [isSidebarCollapsed, isMobile]);

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

                const models: Model[] = await fetchSavedModel();
                const formatted = models.map((model) => ({
                    guid: model.model_guid,
                    name: model.model_name,
                    value: { value: 0, unit: "Available" },
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

    // Handle visualization state changes
    useEffect(() => {
        if (visualizingModelId) {
            sessionStorage.setItem("visualizing_model_id", visualizingModelId);
            setShowPlaceholder(false);
        } else {
            sessionStorage.removeItem("visualizing_model_id");
            setShowPlaceholder(true);
            setCurrentStockName("");
            setGraphData(null);
            setSelectedNode(null);
            setSelectedEdge(null);
        }
    }, [visualizingModelId]);

    const refreshSavedModels = useCallback(async () => {
        try {
          // Fetch fresh saved models from API if you have an endpoint
          // For now, we'll rely on session storage updates from AISearchComponent
          const savedModels = sessionStorage.getItem("saved_models");
          if (savedModels) {
            const models = JSON.parse(savedModels);
            // Update your saved models state here if you have one
            // setSavedModels(models);
          }
        } catch (error) {
          console.error("Error refreshing saved models:", error);
        }
      }, []);
    //remove model
    const handleRemoveModel = useCallback(async (modelToRemove: Stock) => {
        try {
            // Set loading state if you want to show loading during deletion
            setIsLoading(true);

            // Call the API to retire/remove the model
            await removeSavedModel(modelToRemove.guid);

            // Remove from session storage
            const currentSavedModels = sessionStorage.getItem("saved_models");
            if (currentSavedModels) {
                const savedModels = JSON.parse(currentSavedModels);
                const updatedModels = savedModels.filter((model: any) => model.guid !== modelToRemove.guid);
                sessionStorage.setItem("saved_models", JSON.stringify(updatedModels));
            }

            // Update local state
            setSavedModels(prev => prev.filter(model => model.guid !== modelToRemove.guid));

            // If currently visualizing this model, stop visualizing
            if (visualizingModelId === modelToRemove.name) {
                setVisualizingModelId(null);
                setCurrentStockName("");
                setGraphData(null);
                setSelectedNode(null);
                setSelectedEdge(null);
                setShowPlaceholder(true);
            }

            // Show success message
            setToast({
                type: 'success',
                message: `${modelToRemove.name} has been removed successfully!`
            });

            // Close the confirmation popup
            setConfirmPopup({ model: null });

        } catch (error) {
            console.error('Failed to remove model:', error);

            // Show error message
            setToast({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to remove model. Please try again.'
            });

            // Close the confirmation popup anyway
            setConfirmPopup({ model: null });
        } finally {
            setIsLoading(false);
        }
    }, [visualizingModelId]);

    const handleGoToDashboard = (targetTab?: "monitoring" | "visualization") => {
        if (targetTab) navigate(`/${targetTab}`);
      };

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
        // On mobile, show controls panel when element is selected
        if (isMobile && element) {
            setShowMobileControls(true);
        }
    }, [isMobile]);

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
        } else {
            // Update the main stock in graphData for the details panel
            setGraphData(prev => prev ? { ...prev, stock: { ...prev.stock, value: { ...prev.stock.value, value: newValue } } } : null);
        }

        setToast({ type: "success", message: "Changes have been saved!" });
        setEditedValue(null);
    }, [selectedNode, editedValue, graphData]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || val === '-') {
            setEditedValue(val);
        } else {
            const num = parseInt(val.replace(/,/g, ''), 10);
            if (!isNaN(num)) {
                setEditedValue(num);
            }
        }
    };

    const handleTimeUnitChange = useCallback((unit: "hours" | "days" | "weeks" | "months" | "years") => {
        setSimulationSettings(prevSettings => ({ ...prevSettings, timeUnit: unit, value: 0 }));
        setSimulationValue(0);
    }, []);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSimulationValue(parseInt(e.target.value)), []);

    const handleReset = useCallback(() => {
        setSimulationValue(0);
        setIsPaused(false);
    }, []);

    const animateSimulation = useCallback(() => {
        setRunSimulation(true);
        setIsSimulating(true);
        setTimeout(() => {
            setRunSimulation(false);
            setIsSimulating(false);
        }, 2000); // Duration of the animation
    }, []);

    // Mobile Action Menu Component
    const MobileActionMenu: React.FC<{
        model: Stock;
        onClose: () => void;
        position: { x: number; y: number };
    }> = ({ model, onClose, position }) => {
        const isVisualizing = visualizingModelId === model.name;

        return (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={onClose}
                />

                {/* Menu */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className={`absolute z-50 min-w-[200px] rounded-xl border shadow-lg backdrop-blur-xl ${isDarkMode
                        ? 'bg-slate-900/95 border-neutral-700/50'
                        : 'bg-white/95 border-neutral-200/60'
                        }`}
                    style={{
                        left: Math.min(position.x, window.innerWidth - 220),
                        top: position.y + 10
                    }}
                >
                    <div className="p-2">
                        <div className={`px-3 py-2 text-xs font-bold ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                            }`}>
                            {formatStockName(model.name)}
                        </div>

                        <button
                            onClick={() => {
                                if (isVisualizing) {
                                    setVisualizingModelId(null);
                                } else {
                                    setVisualizingModelId(model.name);
                                    setCurrentStockName(model.name);
                                }
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isVisualizing
                                ? isDarkMode
                                    ? 'text-red-400 hover:bg-red-900/20'
                                    : 'text-red-600 hover:bg-red-50'
                                : isDarkMode
                                    ? 'text-white hover:bg-white/10'
                                    : 'text-neutral-700 hover:bg-neutral-100'
                                }`}
                        >
                            <Eye className="w-4 h-4" />
                            {isVisualizing ? 'Stop Visualizing' : 'Visualize'}
                        </button>

                        <button
                            onClick={() => {
                                setModelToShare(model);
                                setShowShareModal(true);
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                                ? 'text-white hover:bg-white/10'
                                : 'text-neutral-700 hover:bg-neutral-100'
                                }`}
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>

                        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                        <button
                            onClick={() => {
                                setConfirmPopup({ model });
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                                ? 'text-red-400 hover:bg-red-900/20'
                                : 'text-red-600 hover:bg-red-50'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove
                        </button>
                    </div>
                </motion.div>
            </>
        );
    };

    // Mobile Controls Panel
    const MobileControlsPanel: React.FC = () => {
        return (
            <AnimatePresence>
                {showMobileControls && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className={`fixed inset-x-0 bottom-20 z-40 mx-4 mb-4 rounded-t-2xl backdrop-blur-xl border-t border-l border-r shadow-2xl ${isDarkMode ? 'bg-slate-900/95 border-neutral-700/50' : 'bg-white/95 border-neutral-200/60'
                            }`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'
                            }`}>
                            <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                }`}>
                                <Info className="w-5 h-5 text-red-500" />
                                Controls
                            </h3>
                            <button
                                onClick={() => setShowMobileControls(false)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-neutral-100 text-neutral-500'
                                    }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                            {/* Model Details */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                                <h4 className="font-bold text-sm mb-3">Model Details</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="font-bold text-sm block mb-2">
                                            {selectedNode ? formatStockName(selectedNode.name) : formatStockName(graphData?.stock.name || 'Main Stock')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={editedValue !== null ? editedValue : Number((selectedNode?.value.value ?? graphData?.stock.value.value ?? 0).toFixed(2))}
                                                onChange={handleValueChange}
                                                className={`w-full p-3 pr-24 border rounded-lg font-bold transition-all ${isDarkMode
                                                    ? 'bg-slate-900/50 border-neutral-700 text-white focus:ring-red-500/50'
                                                    : 'bg-white border-neutral-300 text-neutral-800 focus:ring-red-300'
                                                    }`}
                                            />
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-md ${isDarkMode ? 'text-white/70 bg-slate-700' : 'text-neutral-600 bg-neutral-100'
                                                }`}>
                                                {selectedNode?.value.unit ?? graphData?.stock.value.unit ?? 'people'}
                                            </span>
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={handleSave}
                                        className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold shadow-lg hover:shadow-xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Save Changes
                                    </motion.button>
                                </div>
                            </div>

                            {/* Time Simulation */}
                            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    Time Simulation
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-bold mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Time Unit
                                        </label>
                                        <div className="grid grid-cols-5 gap-1">
                                            {(['Hours', 'Days', 'Weeks', 'Months', 'Years'] as const).map(unit => (
                                                <button
                                                    key={unit}
                                                    onClick={() => handleTimeUnitChange(unit.toLowerCase() as any)}
                                                    className={`px-2 py-1.5 text-xs rounded-md border font-semibold transition-all ${simulationSettings.timeUnit === unit.toLowerCase()
                                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md'
                                                        : isDarkMode
                                                            ? 'bg-slate-800 border-neutral-700 text-white/80 hover:bg-slate-700'
                                                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {unit}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-bold flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Future Projection
                                            </label>
                                            <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {simulationValue} {simulationSettings.timeUnit.slice(0, -1)}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={10}
                                            value={simulationValue}
                                            onChange={handleSliderChange}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 slider-thumb"
                                        />
                                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                            <span>Now</span>
                                            <span>10 Years</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <motion.button
                                            onClick={animateSimulation}
                                            disabled={isSimulating}
                                            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {isSimulating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Running...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    Start Simulation
                                                </>
                                            )}
                                        </motion.button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setIsPaused(!isPaused)}
                                                className={`py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 border ${isDarkMode
                                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-300'
                                                    }`}
                                            >
                                                <Pause className="w-3 h-3" />
                                                Pause
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className={`py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 border ${isDarkMode
                                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-300'
                                                    }`}
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    const shouldShowRightWidgets = !!graphData && !isLoading && !showPlaceholder && !isMobile;

    return (
        <div className={`relative flex flex-col h-screen w-full overflow-hidden transition-all duration-500 font-inter antialiased ${isDarkMode
            ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
            : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
            }`}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode ? 'bg-gradient-to-br from-red-500 to-neutral-600' : 'bg-gradient-to-br from-red-400 to-neutral-400'}`} />
                <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode ? 'bg-gradient-to-tr from-neutral-600 to-red-500' : 'bg-gradient-to-tr from-neutral-400 to-red-400'}`} />
            </div>

            {/* MOBILE MINIMAL HEADER */}
            {isMobile ? (
                <header className={`flex items-center justify-between px-4 h-16 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
                    ? 'bg-slate-900/90 border-neutral-700/30'
                    : 'bg-white/90 border-neutral-200/60'
                    }`}>
                    {/* Q Logo */}
                    <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <img
                            src="/Q-logo.svg"
                            alt="Quantifore logo"
                            className="h-8 select-none drop-shadow-sm"
                        />
                    </motion.div>

                    {/* Right Icons */}
                    <div className="flex items-center space-x-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Menu Button */}
                        <motion.button
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className={`rounded-lg p-2.5 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                                ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Menu className="h-5 w-5" />
                        </motion.button>
                    </div>
                </header>
            ) : (
                /* DESKTOP HEADER */
                <header className={`flex items-center justify-between px-4 sm:px-8 lg:px-12 h-20 sm:h-24 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
                    ? 'bg-slate-900/90 border-neutral-700/30'
                    : 'bg-white/90 border-neutral-200/60'
                    }`}>
                    <motion.div
                        className="flex items-center space-x-3 sm:space-x-5"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <img
                            src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
                            alt="Quantifore logo"
                            className="h-8 sm:h-10 select-none drop-shadow-sm"
                        />
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className={`p-2 sm:p-3 rounded-xl shadow-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-neutral-300 to-neutral-400'
                                }`}>
                                <BarChart3 className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-red-400' : 'text-neutral-900'
                                    }`} />
                            </div>
                            <div>
                                <div className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                    }`}>
                                    Visualization
                                </div>
                                <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                    }`}>Interactive Analytics</div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex items-center space-x-3">
                        {/* Live Connection Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isDarkMode
                            ? 'bg-white/5 text-emerald-400 border border-white/20'
                            : 'bg-white/60 text-emerald-700 border border-neutral-200/60'
                            }`}>
                            <motion.div
                                className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                                animate={{
                                    opacity: [1, 0.5, 1],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="hidden sm:inline">Live Data</span>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Settings Button */}
                        <motion.button
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className={`rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                                ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                        </motion.button>
                    </div>
                </header>
            )}

            {/* MAIN CONTENT LAYOUT */}
            <main className={`flex-1 relative overflow-hidden min-h-0 ${isMobile ? 'flex flex-col pb-20' : 'flex px-4 sm:px-8 lg:px-12 py-6 sm:py-8 gap-6'}`}>

                {/* MOBILE HORIZONTAL MODELS BAR */}
                {isMobile && (
                    <div className={`z-50 border-b backdrop-blur-xl flex-shrink-0 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/80'
                        }`}>
                        {/* AI Search Button */}
                        <div className="px-4 py-3">
                            <motion.button
                                onClick={() => setShowAISearch(true)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 shadow-md ${isDarkMode
                                    ? 'bg-red-800 text-white hover:bg-red-700'
                                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                    }`}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Search className="w-4 h-4" />
                                <span className="font-bold text-sm">AI Model Search</span>
                            </motion.button>
                        </div>

                        {/* Horizontal Models List */}
                        <div className="px-4 pb-3">
                            <div className={`flex items-center gap-2 mb-3`}>
                                <Waypoints className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-neutral-900'}`} />
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                                    Models ({savedModels.length})
                                </span>
                            </div>

                            {savedModels.length > 0 ? (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {savedModels.map((model, index) => {
                                        const isVisualizing = visualizingModelId === model.name;

                                        return (
                                            <motion.div
                                                key={model.guid}
                                                onClick={() => {
                                                    if (isVisualizing) {
                                                        setVisualizingModelId(null);
                                                    } else {
                                                        setVisualizingModelId(model.name);
                                                        setCurrentStockName(model.name);
                                                    }
                                                }}
                                                className={`flex-shrink-0 w-48 p-3 rounded-xl border transition-all duration-300 cursor-pointer relative ${isVisualizing
                                                    ? isDarkMode
                                                        ? "bg-slate-900/80 border-red-500/50 shadow-lg shadow-red-500/10"
                                                        : "bg-white border-red-500/50 shadow-lg shadow-red-500/10"
                                                    : isDarkMode
                                                        ? "bg-slate-900/60 border-neutral-700/50 hover:border-neutral-600/70"
                                                        : "bg-white/80 border-neutral-200/60 hover:border-neutral-300/80"
                                                    }`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                {isVisualizing && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none rounded-xl" />
                                                )}

                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <div className={`text-sm font-bold mb-1 truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                                            }`}>
                                                            {formatStockName(model.name)}
                                                        </div>
                                                        {isVisualizing ? (
                                                            <span className={`inline-flex items-center text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                                                }`}>
                                                                <motion.div
                                                                    className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"
                                                                    animate={{ opacity: [1, 0.5, 1] }}
                                                                    transition={{ duration: 2, repeat: Infinity }}
                                                                />
                                                                Viewing
                                                            </span>
                                                        ) : (
                                                            <div className={`text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                                                }`}>Available</div>
                                                        )}
                                                    </div>

                                                    {/* 3-dot menu button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setActiveDropdownModel(model);
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                                                            ? 'hover:bg-white/10 text-white/70'
                                                            : 'hover:bg-neutral-100 text-neutral-500'
                                                            }`}
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`text-center py-8 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/50'
                                    }`}>
                                    <Waypoints className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white/40' : 'text-neutral-400'
                                        }`} />
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                                        }`}>No saved models</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* DESKTOP SIDEBAR - Hidden on mobile */}
                {!isMobile && (
                    <motion.aside
                        ref={sidebarRef}
                        className={`${isSidebarCollapsed ? "w-[70px]" : "w-96"
                            } z-40 flex-shrink-0 border rounded-2xl sm:rounded-3xl flex flex-col transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden backdrop-blur-xl ${isDarkMode
                                ? 'border-neutral-700/50 bg-slate-900/60'
                                : 'border-neutral-200/60 bg-white/95'
                            }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ height: 'calc(100vh - 200px)' }}
                    >
                        {/* Desktop sidebar content - same as original but shorter */}
                        <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'
                            }`}>
                            {!isSidebarCollapsed && (
                                <h2 className={`text-lg font-bold tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                    }`}>
                                    <Search className="w-5 h-5" />
                                    Model Search
                                </h2>
                            )}
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className={`p-2 rounded-xl transition-all shadow-sm border ${isDarkMode
                                    ? 'hover:bg-white/10 text-white/80 border-white/20'
                                    : 'hover:bg-neutral-100/80 text-neutral-600 border-neutral-200/60'
                                    }`}
                                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            </button>
                        </div>
                        {!isSidebarCollapsed ? (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-6">
                                    <motion.button
                                        onClick={() => setShowAISearch(true)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 group shadow-lg hover:shadow-xl ${isDarkMode
                                            ? 'bg-red-800 text-white hover:bg-red-700'
                                            : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                            }`}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="font-bold">AI Model Search</span>
                                        <div className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Search className="w-5 h-5" />
                                        </div>
                                    </motion.button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-white/80' : 'text-neutral-600'
                                            }`}>
                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                            SAVED MODELS
                                        </h3>
                                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${isDarkMode
                                            ? 'bg-white/10 text-white/70 border border-white/20'
                                            : 'bg-neutral-100/80 text-neutral-600 border-neutral-200/60'
                                            }`}>
                                            {savedModels.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {savedModels.map((model, index) => {
                                            const isVisualizing = visualizingModelId === model.name;
                                            return (
                                                <motion.div
                                                    key={model.guid}
                                                    layout
                                                    className={`p-4 rounded-2xl border transition-all duration-300 group cursor-pointer relative overflow-hidden ${isVisualizing ? (isDarkMode
                                                        ? "bg-slate-900/80 border-red-500/50 shadow-lg shadow-red-500/10"
                                                        : "bg-white border-red-500/50 shadow-lg shadow-red-500/10"
                                                    ) : (isDarkMode
                                                        ? "bg-slate-900/60 border-neutral-700/50 hover:border-neutral-600/70 hover:bg-slate-900/80"
                                                        : "bg-white/80 border-neutral-200/60 hover:border-neutral-300/80 hover:bg-white hover:shadow-md"
                                                    )
                                                        }`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.04 }}
                                                    whileHover={{ y: -2 }}
                                                >
                                                    {isVisualizing && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                                                    )}
                                                    <div className="flex items-start justify-between relative z-10">
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-base font-bold mb-1 truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                                                }`}>
                                                                {formatStockName(model.name)}
                                                            </div>
                                                            {isVisualizing ? (
                                                                <span className={`inline-flex items-center text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                                                    }`}>
                                                                    <motion.div
                                                                        className="w-2 h-2 bg-red-500 rounded-full mr-2"
                                                                        animate={{ opacity: [1, 0.5, 1] }}
                                                                        transition={{ duration: 2, repeat: Infinity }}
                                                                    />
                                                                    Currently viewing
                                                                </span>
                                                            ) : (
                                                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                                                    }`}>Available</div>
                                                            )}
                                                        </div>
                                                        <div className={`flex items-center gap-1 transition-opacity ${isVisualizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                            }`}>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isVisualizing) {
                                                                        setVisualizingModelId(null);
                                                                    } else {
                                                                        setVisualizingModelId(model.name);
                                                                        setCurrentStockName(model.name);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-xl transition-all ${isVisualizing
                                                                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    : isDarkMode
                                                                        ? "text-white/60 hover:text-white hover:bg-white/10"
                                                                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
                                                                    }`}
                                                                title={isVisualizing ? "Stop Visualizing" : "Visualize"}
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setModelToShare(model);
                                                                    setShowShareModal(true);
                                                                }}
                                                                className={`p-2 rounded-xl transition-all ${isDarkMode
                                                                    ? "text-white/60 hover:text-white hover:bg-white/10"
                                                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
                                                                    }`}
                                                                title="Share"
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Share2 className="w-5 h-5" />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmPopup({ model });
                                                                }}
                                                                className={`p-2 rounded-xl transition-all ${isDarkMode
                                                                    ? "text-white/60 hover:text-red-400 hover:bg-white/10"
                                                                    : "text-neutral-500 hover:text-red-600 hover:bg-neutral-100/80"
                                                                    }`}
                                                                title="Remove"
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 flex flex-col items-center gap-4 mt-2">
                                <motion.button
                                    onClick={() => setShowAISearch(true)}
                                    className={`w-12 h-12 flex items-center justify-center text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${isDarkMode
                                        ? 'bg-red-800 text-white hover:bg-red-700'
                                        : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                        }`}
                                    title="AI Data Search"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Search className="w-6 h-6" />
                                </motion.button>
                            </div>
                        )}
                    </motion.aside>
                )}

                {/* GRAPH COMPONENT AREA */}

                <div className="absolute inset-0 overflow-hidden">
                    {showPlaceholder ? (
                        <div className="flex flex-col items-center justify-center h-full shadow-lg backdrop-blur-xl">
                            <motion.div
                                className="text-center space-y-6 sm:space-y-8 p-8 sm:p-12"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                {/* Animated Icon with Rotating Border */}
                                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mx-auto relative ${isDarkMode
                                    ? 'bg-white/5'
                                    : 'bg-gradient-to-tr from-neutral-200/80 to-neutral-300/80'
                                    }`}>
                                    <Waypoints className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-red-500' : 'text-neutral-600'
                                        }`} />
                                    <motion.div
                                        className={`absolute inset-0 rounded-2xl border-2 ${isDarkMode ? 'border-red-500/30' : 'border-neutral-400/30'}`}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                        }`}>
                                        Start Exploring Models
                                    </h3>
                                    <p className={`max-w-md text-sm sm:text-base font-medium leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                        }`}>
                                        Select a saved model from the {isMobile ? 'list above' : 'sidebar'} to visualize its network and relationships.
                                    </p>
                                </div>

                                {/* Optional Action Button */}
                                <motion.div
                                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                >
                                    <motion.button
                                        onClick={() => setShowAISearch(true)}
                                        className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base ${isDarkMode
                                            ? 'bg-red-800 text-white hover:bg-red-700'
                                            : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                            }`}
                                        whileTap={{ scale: 0.97 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        Look up for Models
                                    </motion.button>
                                </motion.div>

                                {/* Additional Hint with Pulse Animation */}
                                <motion.div
                                    className={`flex items-center justify-center gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-white/50' : 'text-neutral-400'
                                        }`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.6 }}
                                >
                                    <motion.div
                                        className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-red-500' : 'bg-red-600'}`}
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <span>Look for saved models in the {isMobile ? 'list above' : 'left sidebar'}</span>
                                </motion.div>
                            </motion.div>
                        </div>
                    ) : (
                        <>
                            {/* Replace ThemeSwitcher with FloatingThemeSwitcher - only for desktop */}
                            {!isMobile && (
                                <ThemeSwitcher
                                    currentTheme={nodeTheme}
                                    isDarkMode={isDarkMode}
                                    onThemeChange={(theme) => setNodeTheme(theme as NodeColorThemeName)}
                                    onModeToggle={() => setDarkMode(!isDarkMode)}
                                />
                            )}
                            <GraphComponent
                                key={visualizingModelId}
                                isLoading={isLoading}
                                graphData={graphData}
                                selectedElement={selectedNode || selectedEdge}
                                setSelectedElement={setSelectedElement}
                                sidebarWidth={sidebarWidth}
                                nodeValueChangeCallback={() => { }}
                                simulationSettings={simulationSettings}
                                simulationValue={simulationValue}
                                runSimulation={runSimulation}
                                isDarkMode={isDarkMode}
                                nodeTheme={nodeTheme}
                            />

                            {/* Mobile Controls Button - Floating */}
                            {isMobile && !showPlaceholder && (
                                <motion.button
                                    onClick={() => setShowMobileControls(true)}
                                    className={`fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg backdrop-blur-xl border z-30 flex items-center justify-center ${isDarkMode
                                        ? 'bg-slate-900/90 border-neutral-700/50 text-white'
                                        : 'bg-white/90 border-neutral-200/60 text-neutral-900'
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Settings className="w-6 h-6" />
                                </motion.button>
                            )}
                        </>
                    )}
                </div>

                {/* DESKTOP RIGHT PANELS - Only show on desktop */}

                <AnimatePresence>
                    {shouldShowRightWidgets && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className={`absolute right-6 top-6 w-80 backdrop-blur-xl border rounded-2xl shadow-2xl z-20 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/95'
                                    }`}
                            >
                                <div className={`p-4 border-b ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'}`}>
                                    <h3 className="font-bold flex items-center gap-3">
                                        <Info className="w-5 h-5 text-red-500" />
                                        Model Details
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                                        <label className="font-bold text-sm block mb-2">
                                            {selectedNode ? formatStockName(selectedNode.name) : formatStockName(graphData?.stock.name || 'Main Stock')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={editedValue !== null ? editedValue : Number((selectedNode?.value.value ?? graphData?.stock.value.value ?? 0).toFixed(2))}
                                                onChange={handleValueChange}
                                                className={`w-full p-2 pr-24 border rounded-lg font-bold transition-all ${isDarkMode
                                                    ? 'bg-slate-900/50 border-neutral-700 text-white focus:ring-red-500/50'
                                                    : 'bg-white border-neutral-300 text-neutral-800 focus:ring-red-300'
                                                    }`}
                                            />
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-md ${isDarkMode ? 'text-white/70 bg-slate-700' : 'text-neutral-600 bg-neutral-100'
                                                }`}>
                                                {selectedNode?.value.unit ?? graphData?.stock.value.unit ?? 'people'}
                                            </span>
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={handleSave}
                                        className="w-full py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all font-bold shadow-lg hover:shadow-xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="flex items-center justify-center gap-2">Save Changes</span>
                                    </motion.button>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className={`absolute right-6 top-[284px] w-80 backdrop-blur-xl border rounded-2xl shadow-2xl z-20 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/95'
                                    }`}
                            >
                                <div className={`p-4 border-b ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'}`}>
                                    <h3 className="font-bold flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-emerald-500" />
                                        Time Simulation
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="text-sm font-bold mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Time Unit
                                        </label>
                                        <div className="grid grid-cols-5 gap-1">
                                            {(['Hours', 'Days', 'Weeks', 'Months', 'Years'] as const).map(unit => (
                                                <button
                                                    key={unit}
                                                    onClick={() => handleTimeUnitChange(unit.toLowerCase() as any)}
                                                    className={`px-2 py-1.5 text-xs rounded-md border font-semibold transition-all ${simulationSettings.timeUnit === unit.toLowerCase()
                                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md'
                                                        : isDarkMode
                                                            ? 'bg-slate-800 border-neutral-700 text-white/80 hover:bg-slate-700'
                                                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {unit}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-bold flex items-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Future Projection
                                            </label>
                                            <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {simulationValue} {simulationSettings.timeUnit.slice(0, -1)}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={10}
                                            value={simulationValue}
                                            onChange={handleSliderChange}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 slider-thumb"
                                        />
                                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                                            <span>Now</span>
                                            <span>10 Years</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <motion.button
                                            onClick={animateSimulation}
                                            disabled={isSimulating}
                                            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {isSimulating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Running...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    Start Simulation
                                                </>
                                            )}
                                        </motion.button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setIsPaused(!isPaused)}
                                                className={`py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 border ${isDarkMode
                                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-300'
                                                    }`}
                                            >
                                                <Pause className="w-3 h-3" />
                                                Pause
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className={`py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 border ${isDarkMode
                                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-300'
                                                    }`}
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>

            {/* MOBILE CONTROLS PANEL */}
            <MobileControlsPanel />

            {/* Mobile Action Dropdown */}
            <AnimatePresence>
                {activeDropdownModel && (
                    <MobileActionMenu
                        model={activeDropdownModel}
                        onClose={() => setActiveDropdownModel(null)}
                        position={{
                            x: window.innerWidth - 220,
                            y: 200
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Modals and overlays - Same as original */}
            <AnimatePresence>
                {isPanelOpen && <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />}
            </AnimatePresence>
            {confirmPopup.model && (
                <ConfirmationPopup
                    title="Remove Saved Model"
                    message={`Are you sure you want to remove ${confirmPopup.model.name}?`}
                    onConfirm={() => handleRemoveModel(confirmPopup.model!)}
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
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
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
                onStockFound={(stock) => {
                    console.log("Data found:", stock);
                  }}
                onAddToFavorites={() => {
                    refreshSavedModels();
                  }}
                onRemoveFromFavorites={() => { }}
                onShowToast={(type, message) => {
                    setToastSocket({ type, message });
                  }}
                  onGoToDashboard={handleGoToDashboard}
                currentTab="visualization"
            />
            <Dock />
            <style>{`
                .custom-scrollbar::-webkit-scrollbar{width:6px;}
                .custom-scrollbar::-webkit-scrollbar-track{background:${isDarkMode ? '#1e293b' : '#f1f5f9'};border-radius:3px;}
                .custom-scrollbar::-webkit-scrollbar-thumb{background:${isDarkMode ? '#475569' : '#cbd5e1'};border-radius:3px;}
                .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:${isDarkMode ? '#64748b' : '#94a3b8'};}
                .slider-thumb::-webkit-slider-thumb { background: #10b981; }
                .slider-thumb::-moz-range-thumb { background: #10b981; }
            `}</style>
        </div>
    );
};

export default Playground;