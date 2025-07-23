import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchSavedModel, fetchGraphData, removeSavedModel, shareSavedModel } from '../services/quantiforeApi';
import DashboardSwitcher from "../components/ui/DashboardSwitcher";
import RightSidebar from "../components/RightSidebar";
import { GraphData, NodeData, LinkData } from '../services/types';
import { Calendar, Info, Eye, Pause, Play, RefreshCw, Search, Share2, Trash2 } from 'lucide-react';
import { formatStockName } from '../utils/utility';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import ShareModal from '../components/ui/ShareModal';
import Toast from '../components/ui/Toast';
import { simulateStockGrowth } from '../utils/simulation';
import { AnimatePresence, motion } from "framer-motion";

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
    timeUnit: "days" | "weeks" | "months" | "years";
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
    const [editedValue, setEditedValue] = useState<number | null>(null);
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
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState<'details' | 'simulation' | 'both' | null>(null);
    const [visualizingModelId, setVisualizingModelId] = useState<string | null>(null);
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [showPills, setShowPills] = useState(false);

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

    useEffect(() => {

        const loadSavedModels = async () => {
            try {
                // Check cache first
                const cached = sessionStorage.getItem("saved_models");
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (cached.length > 0) {
                        setSavedModels(parsed);
                        console.log("Loaded saved models from sessionStorage:", parsed);
                        return;
                    }
                }

                // Fetch from API if not cached
                const models = await fetchSavedModel();
                const formatted = models.map((model) => ({
                    guid: model.model_guid,
                    name: model.model_name,
                    value: { value: 0, unit: "unknown" },
                    sharedBy: model.shared_by_username || null,
                }));

                // Only store in sessionStorage if data exists
                if (formatted.length > 0) {
                    sessionStorage.setItem("saved_models", JSON.stringify(formatted));
                    setSavedModels(formatted);
                    console.log("Fetched and cached saved models:", formatted);
                } else {
                    console.warn("No models returned from API — not storing in cache.");
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

    useEffect(() => {
        if (!currentStockName) return;

        setIsLoading(true);
        fetchGraphData(currentStockName)
            .then((data: GraphData) => {
                console.log("GRAPHDATA →", data);
                setGraphData(data);
            })
            .catch((error) => {
                console.error("Error fetching graph data:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [currentStockName]);

    // Replace the existing useEffect for visualization state
    useEffect(() => {
        const storedVisualizingId = sessionStorage.getItem("visualizing_model_id");
        if (storedVisualizingId) {
            setVisualizingModelId(storedVisualizingId);
            setCurrentStockName(storedVisualizingId);
            setShowPlaceholder(false);
            setIsLoading(true); // Add loading state

            // Fetch data for the stored model
            fetchGraphData(storedVisualizingId)
                .then((data: GraphData) => {
                    console.log("GRAPHDATA →", data);
                    setGraphData(data);
                    setShowPlaceholder(false);
                })
                .catch((error) => {
                    console.error("Error fetching graph data:", error);
                    // On error, reset to placeholder
                    setVisualizingModelId(null);
                    setShowPlaceholder(true);
                    setCurrentStockName("");
                    setGraphData(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, []);

    // Add this effect to handle visualization state changes
    useEffect(() => {
        if (visualizingModelId) {
            sessionStorage.setItem("visualizing_model_id", visualizingModelId);
            setShowPlaceholder(false);
        } else {
            sessionStorage.removeItem("visualizing_model_id");
            setShowPlaceholder(true);
            setCurrentStockName("");
            setGraphData(null);
        }
    }, [visualizingModelId]);

    useEffect(() => {
        if (graphData && !showPlaceholder) {
            setActiveSection('both');
            setShowPills(true);
        } else {
            setShowPills(false);
            setActiveSection(null);
        }
    }, [graphData, showPlaceholder]);

    const setSelectedElement = useCallback((element: NodeData | LinkData | null) => {
        if (element && 'source' in element) {
            // If the element is an edge
            setSelectedNode(null);
            setSelectedEdge(element as LinkData);
        } else if (element && 'id' in element) {
            // If the element is a node
            setSelectedNode(element as NodeData);
            setSelectedEdge(null);
        } else {
            // If the element is null
            setSelectedNode(null);
            setSelectedEdge(null);
        }

        console.log("Selected element:", element);
    }, []);

    const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

    const toggleRightSidebar = () => setIsRightSidebarCollapsed((prev) => !prev);

    const toggleSection = (section: 'details' | 'simulation') => {
        if (activeSection === section) {
            // If the clicked section is open, close it
            setActiveSection(null);
        } else if (activeSection === null) {
            // If nothing is open, open the clicked section
            setActiveSection(section);
        } else if (activeSection === 'both') {
            // If both are open, close the clicked section (keep the other open)
            setActiveSection(section === 'details' ? 'simulation' : 'details');
        } else {
            // If the other section is open, open both
            setActiveSection('both');
        }
    };

    const collapseAllSections = () => {
        setActiveSection(null);
    };

    // Rest of your functions (updateValue, animateSimulation, etc.)
    const updateValue = useCallback((increment: boolean) => {
        if (!selectedNode || !graphData) return;

        // Function to recursively update related stocks
        const updateRelatedStocks = (stockGuid: string, change: number, isMainStock: boolean = false) => {
            // Find the stock being updated
            let stockToUpdate;
            if (isMainStock) {
                stockToUpdate = graphData.stock;
            } else {
                stockToUpdate = graphData.nodes.find((node) => node.id === stockGuid);
            }

            if (!stockToUpdate) return; // Stock not found

            // Update the stock's value directly
            const currentValue = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.value : 0;
            const unit = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.unit : '';
            stockToUpdate.value = { value: currentValue + change, unit: unit };
        };

        if (selectedNode.id === graphData.stock.guid) {
            const change = increment ? 1 : -1;
            updateRelatedStocks(graphData.stock.guid, change, true);
        } else {
            const change = increment ? 1 : -1;
            updateRelatedStocks(selectedNode.id, change);
        }

        setGraphData({ ...graphData });

        if (selectedNode.id === graphData.stock.guid) {
            setSelectedNode({
                ...selectedNode,
                value: graphData.stock.value
            });
        } else {
            const updatedStock = graphData.nodes.find(
                (node: NodeData) => node.id === selectedNode.id
            );
            if (updatedStock) {
                setSelectedNode({
                    ...selectedNode,
                    value: updatedStock.value
                });
            }
        }
    }, [graphData, selectedNode]);

    const animateSimulation = useCallback((targetValue: number, duration: number) => {
        setRunSimulation(true);
        setIsSimulating(true);

        const timeInSeconds = (() => {
            switch (simulationSettings.timeUnit) {
                case "days": return targetValue * 86400;
                case "weeks": return targetValue * 604800;
                case "months": return targetValue * 2629746; // avg seconds
                case "years": return targetValue * 31556952;
                default: return 0;
            }
        })();

        if (graphData) {
            const startVals = {
                [graphData.stock.guid]: graphData.stock.value.value,
                ...graphData.nodes.reduce((acc, s) => {
                    acc[s.id] = s.value.value;
                    return acc;
                }, {} as Record<string, number>)
            };

            const newVals = simulateStockGrowth(graphData, timeInSeconds, startVals);

            setGraphData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    stock: {
                        ...prev.stock,
                        value: {
                            ...prev.stock.value,
                            value: newVals[prev.stock.guid],
                        },
                    },
                    nodes: prev.nodes.map(rs => ({
                        ...rs,
                        value: {
                            ...rs.value,
                            value: newVals[rs.id],
                        },
                    })),
                };
            });
        }

        // animation part (optional)
        const startTime = performance.now();
        const animateSlider = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const newValue = simulationValue + (targetValue - simulationValue) * progress;
            setAnimatedSimulationValue(newValue);
            if (progress < 1) requestAnimationFrame(animateSlider);
            else {
                setSimulationValue(targetValue);
                setAnimatedSimulationValue(targetValue);
                setRunSimulation(false);
                setIsSimulating(false);
            }
        };

        requestAnimationFrame(animateSlider);
    }, [graphData, simulationSettings.timeUnit, simulationValue]);

    const handlePause = useCallback(() => {
        setIsPaused(!isPaused);
    }, [isPaused]);

    const handleReset = useCallback(() => {
        setSimulationSettings(prevSettings => ({
            ...prevSettings,
            value: 0
        }));
    }, []);

    const handleTimeUnitChange = useCallback((unit: "days" | "weeks" | "months" | "years") => {
        setSimulationSettings(prevSettings => ({
            ...prevSettings,
            timeUnit: unit,
            value: 0
        }));
    }, []);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        setSimulationValue(newValue); // Update separate state variable
    }, []);

    const handleNodeValueChange = useCallback((nodeId: string, newValue: number) => {
        setGraphData((prevGraphData) => {
            if (!prevGraphData) return prevGraphData;
            // Function to recursively update related stocks
            const updateRelatedStocks = (stockGuid: string, change: number, isMainStock: boolean = false) => {
                // Find the stock being updated
                let stockToUpdate;
                if (isMainStock) {
                    stockToUpdate = prevGraphData.stock;
                } else {
                    stockToUpdate = prevGraphData.nodes.find((node) => node.id === stockGuid);
                }

                if (!stockToUpdate) return; // Stock not found

                // Update the stock's value directly
                const unit = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.unit : '';
                stockToUpdate.value = { value: newValue, unit: unit };
            };

            // Determine which stock to update and initiate recursive updates
            if (nodeId === prevGraphData.stock.guid) {
                updateRelatedStocks(prevGraphData.stock.guid, newValue, true); // True means this is the main stock
            } else {
                updateRelatedStocks(nodeId, newValue);
            }


            return { ...prevGraphData };
        });
    }, []);

    const handleSave = useCallback(() => {
        if (selectedNode && editedValue !== null) {
            handleNodeValueChange(selectedNode?.id, editedValue);
            setEditedValue(null);
        }
    }, [selectedNode, editedValue, handleNodeValueChange]);

    const handleDiveIntoNode = useCallback(() => {
        if (selectedNode && !selectedNode.isCenter) {
            setCurrentStockName(selectedNode.id);
        }
    }, [selectedNode]);

    const handleSearchQuery = async () => {
        if (!searchQuery.trim()) return;
        setIsSearchLoading(true);
        try {
            const data = null;
            // const data = await fetchGraphData(searchQuery.trim());
            // setGraphData(data);
            // setCurrentStockName(searchQuery.trim());
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsSearchLoading(false);
            // optionally keep search open or close
            setShowSearch(false);
        }
    };

    const handleModelRemove = async (model: Stock) => {
        try {
            await removeSavedModel(model.guid);
            setSavedModels(prev => prev.filter(m => m.guid !== model.guid));
            setToast({ type: "success", message: `${model.name} removed.` });
        } catch (err) {
            console.error(err);
            setToast({ type: "error", message: `Failed to remove ${model.name}.` });
        }
    };

    const handleModelShare = async (email: string, model: Stock) => {
        try {
            await shareSavedModel(model.guid, email);
            setToast({ type: "success", message: `Shared ${model.name} with ${email}.` });
        } catch (err) {
            console.error(err);
            setToast({ type: "error", message: `Failed to share ${model.name}.` });
        } finally {
            setShowShareModal(false);
        }
    };

    // Memoize simulationSettings
    const memoizedSimulationSettings = useMemo(() => ({
        timeUnit: simulationSettings.timeUnit,
        value: simulationSettings.value,
    }), [simulationSettings.timeUnit, simulationSettings.value]);

    const memoizedSelectedElement = useMemo(() => selectedNode || selectedEdge, [selectedNode, selectedEdge]);

    useEffect(() => {
        console.log("Selected Edge Updated:", selectedEdge);
    }, [selectedEdge]);

    return (
        <div className="h-screen bg-teal-50 text-text-primary flex flex-col">
            <DashboardSwitcher />
            <header className="shadow-sm border-b border-gray-200/80 px-6 py-4 bg-white/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-5">
                    <img src="/qf-logo0.1.svg" alt="Quantifore Logo" className="h-8 w-auto mt-3" />
                </div>
            </header>

            <div className="main-content p-2 md:p-4 flex flex-1 overflow-hidden relative">
                {/* Left Sidebar - Overlay */}
                <div className={`${isSidebarCollapsed ? "w-16" : "w-80"} absolute left-2 top-2 bottom-2 z-10 sidebar bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 backdrop-blur-xl border border-gray-200 rounded-lg p-2 flex flex-col text-gray-700 shadow-xl transition-all duration-300 flex-shrink-0 overflow-hidden`}>
                    <button
                        onClick={toggleSidebar}
                        className={`${isSidebarCollapsed ? "right-3" : "right-1"} absolute top-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1 z-10 shadow-xl transition-transform duration-300`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="#115e59" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={5}
                                d={isSidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                            />
                        </svg>
                    </button>
                    {!isSidebarCollapsed && (
                        <div className="mt-10 px-2 flex flex-col gap-4 w-full transition-all duration-500 ease-in-out">
                            <div className="space-y-2 pb-8">
                                <h3 className="text-md text-gray-800 font-semibold pb-2">Search for Models</h3>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search models..."
                                    className="w-full px-4 py-2 rounded-full shadow-md border border-gray-200 bg-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-300 pb-8">
                                <h3 className="text-md font-medium text-gray-500 tracking-wide">Saved Models</h3>
                                {savedModels.length > 0 ? (
                                    savedModels.map((model) => {
                                        const isSelected = visualizingModelId === model.name;

                                        return (
                                            // 1. Added 'group' class to the parent div
                                            <div
                                                key={model.guid}
                                                className={`
                                                    group
                                                    p-4
                                                    rounded-lg 
                                                    flex justify-between items-center 
                                                    transition-all duration-300
                                                    text-gray-900
                                                    ${isSelected ? "bg-gradient-to-r from-blue-200 to-cyan-200 shadow-md border-2 border-blue-300"
                                                        : "bg-gradient-to-r from-cyan-100 to-teal-100 border-2 border-transparent hover:shadow-lg"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-gray-900 truncate">
                                                        {formatStockName(model.name)}
                                                    </span>
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                                    )}
                                                </div>

                                                {/* 2. Applied conditional visibility to the entire icon container */}
                                                <div className={`flex items-center space-x-1 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                    }`}>
                                                    {/* Visualize */}
                                                    <button
                                                        onClick={() => {
                                                            const isCurrentlyVisualizing = visualizingModelId === model.name;

                                                            if (isCurrentlyVisualizing) {
                                                                // If currently visualizing this model, stop visualization
                                                                setVisualizingModelId(null);
                                                                setSelectedModels(prev => prev.filter(m => m !== model.name));
                                                            } else {
                                                                // If not visualizing or visualizing different model, start visualization
                                                                setVisualizingModelId(model.name);
                                                                setCurrentStockName(model.name);
                                                                setSelectedModels([model.name]);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-md text-gray-500 hover:text-green-600 hover:bg-green-100/50 transition-colors"
                                                        title={visualizingModelId === model.name ? "Stop Visualization" : "Visualize"}
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Share */}
                                                    <button
                                                        onClick={() => {
                                                            setModelToShare(model);
                                                            setShowShareModal(true);
                                                        }}
                                                        className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-100/50 transition-colors"
                                                        title="Share"
                                                    >
                                                        <Share2 size={15} />
                                                    </button>

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => {
                                                            setConfirmPopup({ model });
                                                        }}
                                                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100/70 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500">No saved models found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {showPlaceholder && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 z-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                            <Search className="w-12 h-12 text-teal-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-700">Start Exploring Models</h3>
                            <p className="text-gray-500 max-w-md">
                                Click the eye icon next to any saved model to visualize its data and start playing with the interactive graph.
                            </p>
                        </div>
                    </div>
                )}

                {/* Graph Container - Full Width */}
                {!showPlaceholder && (
                    <GraphComponent
                        isLoading={isLoading}
                        simulationSettings={memoizedSimulationSettings}
                        simulationValue={simulationValue}
                        graphData={graphData}
                        selectedElement={memoizedSelectedElement}
                        setSelectedElement={setSelectedElement}
                        sidebarWidth={sidebarWidth}
                        nodeValueChangeCallback={handleNodeValueChange}
                        runSimulation={runSimulation}
                    />
                )}

                {/* Right Sidebar - Replaced with expandable pills */}
                {showPills && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-4">
                        {/* Stock Details Pill */}
                        <div className="relative">
                            <div className={`${(activeSection === 'details' || activeSection === 'both')
                                ? 'bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30'
                                : ''
                                }`}>
                                <button
                                    onClick={() => toggleSection('details')}
                                    className={`w-full transition-all duration-300 ${(activeSection === 'details' || activeSection === 'both')
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl px-6 py-4 rounded-t-2xl'
                                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 p-4 rounded-full'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${(activeSection === 'details' || activeSection === 'both') ? 'bg-white/20' : 'bg-white/20'}`}>
                                            <Info size={20} className="text-white" />
                                        </div>
                                        {(activeSection === 'details' || activeSection === 'both') && (
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-semibold text-lg whitespace-nowrap">Stock Details</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative group">
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                            </svg>
                                                        </button>
                                                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-white/95 text-gray-700 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-[60] shadow-md border border-gray-200 backdrop-blur-sm max-w-xs whitespace-nowrap">
                                                            <span className="italic text-xs">Click on any node or edge to see detailed information</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleSection('details'); }}
                                                        className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                                        title="Minimize"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {/* Show expand icon when minimized */}
                                        {!(activeSection === 'details' || activeSection === 'both') && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8l4-4 4 4m0 8l-4 4-4-4" />
                                            </svg>
                                        )}
                                    </div>
                                </button>

                                {/* Stock Details Content */}
                                <AnimatePresence>
                                    {(activeSection === 'details' || activeSection === 'both') && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-4 w-80 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-2run"
                                        >
                                            {/* Show Selected Node Details if available, otherwise show main stock */}
                                            {selectedNode && selectedNode.id !== graphData?.stock.guid ? (
                                                <div className="space-y-4">
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                                        <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center gap-2">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                            {formatStockName(selectedNode.name || "")}
                                                        </h3>

                                                        {selectedNode.value !== undefined && (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-700 font-medium">Value:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            value={editedValue !== null ? editedValue : Math.round(selectedNode.value.value)}
                                                                            onChange={(e) => setEditedValue(parseInt(e.target.value))}
                                                                            className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-700 font-medium">Unit:</span>
                                                                    <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">{selectedNode.value.unit}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={handleSave}
                                                            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                                        >
                                                            <span className="relative z-10">Save Changes</span>
                                                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        </button>
                                                    </div>

                                                    {/* {!selectedNode.isCenter && (
                                                    <button
                                                        onClick={handleDiveIntoNode}
                                                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                                    >
                                                        <span className="relative z-10">Dive Deeper</span>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    </button>
                                                )} */}
                                                </div>
                                            ) : selectedEdge?.relationshipList && selectedEdge.relationshipList.length > 0 ? (
                                                /* Show Edge Details */
                                                <div className="space-y-4">
                                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                                        <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                                            Connection Details
                                                        </h3>

                                                        <div className="space-y-3">
                                                            {selectedEdge.relationshipList.map((rel, idx) => (
                                                                <div key={idx} className="bg-white/80 rounded-lg p-4 border border-purple-200">
                                                                    {/* Direction Header */}
                                                                    <div className="mb-3 pb-2 border-b border-gray-200">
                                                                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                            <span className="text-purple-600">From:</span>
                                                                            <span className="bg-purple-100 px-2 py-1 rounded text-purple-700">
                                                                                {rel.fromName}
                                                                            </span>
                                                                            <span className="text-gray-400">→</span>
                                                                            <span className="text-purple-600">To:</span>
                                                                            <span className="bg-purple-100 px-2 py-1 rounded text-purple-700">
                                                                                {rel.toName}
                                                                            </span>
                                                                        </h4>
                                                                    </div>

                                                                    {/* Relationship Details */}
                                                                    {/* Relationship Details */}
                                                                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm">
                                                                        {/* Impact */}
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="text-gray-600 font-medium">Impact:</span>
                                                                            <span className={`font-semibold capitalize px-3 py-1 rounded-full text-xs ${rel.impact === 'positive' ? 'bg-green-100 text-green-800' :
                                                                                    rel.impact === 'negative' ? 'bg-red-100 text-red-800' :
                                                                                        'bg-gray-100 text-gray-800'
                                                                                }`}>
                                                                                {rel.impact}
                                                                            </span>
                                                                        </div>

                                                                        {/* Weight */}
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="text-gray-600 font-medium">Weight:</span>
                                                                            <span className="font-semibold bg-gray-100 px-2 py-1 rounded text-gray-800">
                                                                                {rel.weight}
                                                                            </span>
                                                                        </div>

                                                                        {/* Flow */}
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="text-gray-600 font-medium">Flow:</span>
                                                                            <span className="font-semibold bg-gray-100 px-2 py-1 rounded text-gray-800">
                                                                                {rel.flow}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Show Main Stock Details as fallback */
                                                graphData && (
                                                    <div className="space-y-4">
                                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                                                            <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center gap-2">
                                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                                {formatStockName(graphData.stock.name || "")}
                                                            </h3>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-700 font-medium">Value:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            value={editedValue !== null ? editedValue : Math.round(graphData.stock.value.value)}
                                                                            onChange={(e) => setEditedValue(parseInt(e.target.value))}
                                                                            className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-700 font-medium">Unit:</span>
                                                                    <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">{graphData.stock.value.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Save button applies for main stock as well */}
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={handleSave}
                                                                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                                            >
                                                                <span className="relative z-10">Save Changes</span>
                                                                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Time Simulation Pill */}
                        {graphData && (
                            <div className="relative">
                                <div className={`${(activeSection === 'simulation' || activeSection === 'both')
                                    ? 'bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30'
                                    : ''
                                    }`}>
                                    <button
                                        onClick={() => toggleSection('simulation')}
                                        className={`w-full transition-all duration-300 ${(activeSection === 'simulation' || activeSection === 'both')
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl px-6 py-4 rounded-t-2xl'
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 p-4 rounded-full'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${(activeSection === 'simulation' || activeSection === 'both') ? 'bg-white/20' : 'bg-white/20'}`}>
                                                <Calendar size={20} className="text-white" />
                                            </div>
                                            {(activeSection === 'simulation' || activeSection === 'both') && (
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-semibold text-lg whitespace-nowrap">Time Simulation</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative group">
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                </svg>
                                                            </button>
                                                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-white/95 text-gray-700 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-[60] shadow-md border border-gray-200 backdrop-blur-sm max-w-xs whitespace-nowrap">
                                                                <span className="italic text-xs">Project how your model's values will change over time</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleSection('simulation'); }}
                                                            className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                                            title="Minimize"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Show expand icon when minimized */}
                                            {!(activeSection === 'simulation' || activeSection === 'both') && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8l4-4 4 4m0 8l-4 4-4-4" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>

                                    {/* Time Simulation Content */}
                                    <AnimatePresence>
                                        {(activeSection === 'simulation' || activeSection === 'both') && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-4 w-80 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 space-y-6"
                                            >
                                                {/* === NO CHANGE NEEDED === */}
                                                {/* All the existing time simulation controls remain the same */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Time Unit</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {(['days', 'weeks', 'months', 'years'] as const).map((unit) => (
                                                            <button
                                                                key={unit}
                                                                onClick={() => handleTimeUnitChange(unit)}
                                                                className={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden group ${simulationSettings.timeUnit === unit
                                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                                                                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:shadow-md hover:scale-102'
                                                                    }`}
                                                            >
                                                                <span className="relative z-10 capitalize">{unit}</span>
                                                                {simulationSettings.timeUnit === unit && (
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-30 blur-sm"></div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-sm font-semibold text-gray-700">Simulate Future</h4>
                                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                            {simulationValue} {simulationSettings.timeUnit}
                                                        </div>
                                                    </div>

                                                    <div className="relative py-4">
                                                        <div className="absolute h-3 top-1/2 left-0 right-0 -mt-1.5 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full shadow-inner"></div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={
                                                                simulationSettings.timeUnit === 'days' ? 365 :
                                                                    simulationSettings.timeUnit === 'weeks' ? 52 :
                                                                        simulationSettings.timeUnit === 'months' ? 36 : 10
                                                            }
                                                            value={simulationValue}
                                                            onChange={handleSliderChange}
                                                            className="appearance-none w-full h-3 bg-transparent rounded-full cursor-pointer relative z-10 slider-thumb"
                                                            style={{ WebkitAppearance: 'none', background: 'transparent' }}
                                                        />
                                                    </div>

                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Now</span>
                                                        <span>
                                                            {simulationSettings.timeUnit === 'days' ? '1 Year' :
                                                                simulationSettings.timeUnit === 'weeks' ? '1 Year' :
                                                                    simulationSettings.timeUnit === 'months' ? '3 Years' : '10 Years'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Simulation Controls */}
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => animateSimulation(simulationValue, 2000)}
                                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                                    >
                                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                                            <Play size={18} />
                                                            Start Simulation
                                                        </span>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    </button>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={handlePause}
                                                            disabled={simulationValue === 0}
                                                            className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                                                                {isPaused ? 'Resume' : 'Pause'}
                                                            </span>
                                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        </button>

                                                        <button
                                                            onClick={handleReset}
                                                            className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                                                        >
                                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                                <RefreshCw size={16} />
                                                                Reset
                                                            </span>
                                                            <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {confirmPopup.model && (
                    <ConfirmationPopup
                        title="Remove Saved Model"
                        message={`Are you sure you want to remove ${confirmPopup.model.name}?`}
                        onConfirm={() => {
                            handleModelRemove(confirmPopup.model!);
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

            </div>
            {/* Menu button*/}
            <motion.button
                className="fixed top-5 right-8 z-[60] p-2 rounded-full bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white/90 transition-all shadow-lg hover:scale-105"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isPanelOpen ? "Close menu" : "Open menu"}
            >
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                            d: isPanelOpen
                                ? "M6 18L18 6M6 6l12 12"
                                : "M4 6h16M4 12h16M4 18h16"
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </motion.svg>
            </motion.button>

            {/* Backdrop and Sidebar */}
            <AnimatePresence>
                {isPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                            onClick={() => setIsPanelOpen(false)}
                        />
                        <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Playground;