import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchSavedModel, fetchGraphData, removeSavedModel, shareSavedModel } from '../services/quantiforeApi';
import Navbar from "../components/Navbar";
import { GraphData, NodeData, LinkData } from '../services/types';
import { Calendar, Info, Eye, Pause, Play, RefreshCw, Search, Share2, Trash2 } from 'lucide-react';
import { formatStockName } from '../utils/utility';
import LoadingScreen from '../components/ui/LoadingScreen';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import ShareModal from '../components/ui/ShareModal';
import Toast from '../components/ui/Toast';


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
    related_stocks?: Stock[];
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
    }, [setSelectedNode, setSelectedEdge]);
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
              setSavedModels(parsed);
              console.log("Loaded saved models from sessionStorage:", parsed);
              return;
            }
      
            // Fetch from API if not cached
            const models = await fetchSavedModel();
            const formatted = models.map((model) => ({
              guid: model.model_guid,
              name: model.model_name,
              value: { value: 0, unit: "unknown" },
              sharedBy: model.shared_by_username || null,
            }));
      
            // Store in cache
            sessionStorage.setItem("saved_models", JSON.stringify(formatted));
            setSavedModels(formatted);
            console.log("Fetched and cached saved models:", formatted);
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
      

    const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

    // useEffect(() => {
    //     fetchGraphData(currentStockName)
    //         .then((data: any) => {
    //             console.log(data, "Data fetched from API");
    //             setGraphData(data);
    //             setIsLoading(false);
    //         })
    //         .catch(error => {
    //             console.error("Error fetching graph data:", error);
    //             setIsLoading(false);
    //         });
    // }, [currentStockName]);

    useEffect(() => {
        if (!currentStockName) return;

        setIsLoading(true);

        fetchGraphData(currentStockName)
            .then((data: any) => {
                console.log(data, "Data fetched from API");
                setGraphData(data);
            })
            .catch(error => {
                console.error("Error fetching graph data:", error);
            })
            .finally(() => {
                setIsLoading(false); // Hide loading after response
            });
    }, [currentStockName]);

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
                stockToUpdate = graphData.related_stocks.find((stock: Stock) => stock.guid === stockGuid);
            }

            if (!stockToUpdate) return; // Stock not found

            // Update the stock's value directly
            const currentValue = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.value : 0;
            const unit = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.unit : '';
            stockToUpdate.value = { value: currentValue + change, unit: unit };
        };

        // Determine which stock to update and initiate recursive updates
        if (selectedNode.id === graphData.stock.guid) {
            const change = increment ? 1 : -1;
            updateRelatedStocks(graphData.stock.guid, change, true); // True means this is the main stock
        } else {
            const change = increment ? 1 : -1;
            updateRelatedStocks(selectedNode.id, change);
        }

        // Update state with new graph data
        setGraphData({ ...graphData });

        // Update selected node
        if (selectedNode.id === graphData.stock.guid) {
            setSelectedNode({
                ...selectedNode,
                value: graphData.stock.value
            });
        } else {
            const updatedStock = graphData.related_stocks.find(
                (stock: Stock) => stock.guid === selectedNode.id
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

        // Animate the slider
        const startTime = performance.now();
        const animateSlider = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const newValue = simulationValue + (targetValue - simulationValue) * progress;
            setAnimatedSimulationValue(newValue); // Update animated slider value

            if (progress < 1) {
                requestAnimationFrame(animateSlider);
            } else {
                // Animation complete, set the actual value
                setSimulationValue(targetValue);
                setAnimatedSimulationValue(targetValue);
                setRunSimulation(false);
                setIsSimulating(false);
            }
        };

        requestAnimationFrame(animateSlider);

        // No need to update simulationSettings.value here.

        // setTimeout(() => {
        //     setRunSimulation(false);
        //     setIsSimulating(false);
        // }, duration);

        // setSimulationSettings((prevSettings) => ({
        //     ...prevSettings,
        //     value: targetValue,
        // }));
    }, [simulationValue]); // Removed simulationSettings, targetValue from dependencies
    //useCallback dependancy issues were fixed here

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
                    stockToUpdate = prevGraphData.related_stocks.find((stock: Stock) => stock.guid === stockGuid);
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

    return (
        <div className="h-screen bg-teal-50 text-text-primary flex flex-col font-poppins">
            <Navbar showLogo={true} showTabs={true} />
            {/* <div className="w-full flex justify-center mt-6">
                    <div className="flex items-center gap-3 px-5 py-2 rounded-full shadow-xl border border-white/50 backdrop-blur-md bg-gradient-to-r from-teal-300/20 to-cyan-300/20">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchQuery()}
                            placeholder="Search for the models you want"
                            className="text-gray-800 placeholder-gary-200 text-sm sm:text-base w-64 bg-transparent focus:outline-none"
                        />
                        <button
                            onClick={handleSearchQuery}
                            disabled={isLoading}
                            className="p-2 rounded-full hover:bg-white/10 transition duration-150"
                        >
                            {isLoading ? (
                                <svg
                                    className="animate-spin h-4 w-4 text-gray-300"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    ></path>
                                </svg>
                            ) : (
                                <Search size={18} className="text-gray-400" />
                            )}
                        </button>
                    </div>
                </div> */}


            <div className="main-content p-2 md:p-4 flex flex-1">
                <div className={`${isSidebarCollapsed ? "w-16" : "w-80"} sidebar bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 backdrop-blur-xl border border-gray-200 rounded-lg p-2 flex flex-col text-gray-700 shadow-xl transition-all duration-300 relative flex-shrink-0 overflow-hidden`}>
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
                            <div className="space-y-2 pt-2 border-b border-gray-300 pb-8">
                                <h3 className="text-md text-gray-800 font-semibold pb-2">Saved Models</h3>
                                {savedModels.length > 0 ? (
                                    savedModels.map((model) => {
                                        const isSelected = selectedModels.includes(model.name); // You already have selectedModels state

                                        return (
                                            <div
                                                key={model.guid}
                                                className={`p-2 pl-3 pr-2 rounded-lg flex justify-between items-center shadow-sm transition-all duration-300 ${isSelected
                                                    ? "bg-gradient-to-r from-cyan-400 to-teal-300 text-green-900"
                                                    : "bg-gradient-to-r from-cyan-200 to-teal-100 text-gray-800"
                                                    }`}
                                            >
                                                <span
                                                    onClick={() => setCurrentStockName(model.name)}
                                                    className="text-sm font-medium truncate cursor-pointer hover:underline hover:text-teal-600"
                                                    title="Click to open"
                                                >
                                                    {model.name}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {/* Visualize */}
                                                    <button
                                                        onClick={() => {
                                                            setCurrentStockName(model.name); // ✅ Set the model name
                                                            const updated = isSelected
                                                                ? selectedModels.filter((m) => m !== model.name)
                                                                : [...selectedModels, model.name];
                                                            setSelectedModels(updated);
                                                        }}
                                                        className={`p-1 rounded-full hover:bg-teal-600/30 transition ${isSelected ? "text-green-800" : "text-gray-600"}`}
                                                        title="Visualize"
                                                    >
                                                        <Eye size={16} />
                                                    </button>


                                                    {/* Share */}
                                                    <button
                                                        onClick={() => {
                                                            setModelToShare(model);
                                                            setShowShareModal(true);
                                                        }}
                                                        className="p-1 rounded-full hover:bg-blue-600/30 text-gray-600 transition"
                                                        title="Share"
                                                    >
                                                        <Share2 size={16} />
                                                    </button>

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => {
                                                            setConfirmPopup({ model });
                                                        }}
                                                        className="p-1 rounded-full hover:bg-red-600/30 text-gray-600 transition"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={16} />
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
                <div className="graph-container flex-grow bg-transparent flex justify-center items-center overflow-hidden relative">
                    {/* {isLoading && (
                        // <div className=" flex items-center justify-center bg-white/70 z-50 relative">
                        //     <LoadingScreen message="Loading models..." />
                        // </div>
                    )} */}
                    
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
                            // key={graphData.stock.guid}
                        />
                    
                </div>
                <div className="sidebar w-80 p-2 sidebar bg-teal-50" style={{ position: 'relative' }} ref={sidebarRef}>
                    <div className="sidebar-content">
                        <h2 className="text-xl font-semibold text-teal-700 mb-4 tracking-tight">Stock Details</h2>
                        {!selectedNode && !selectedEdge && (
                            <p className="text-gray-600">Click on a node or edge to see details.</p>
                        )}
                        {selectedNode && (
                            <>
                                <div className="bg-teal-50 border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-500"></div>

                                    <h3 className="text-lg font-medium text-teal-700 mb-2 relative z-10">
                                        <strong>
                                            {formatStockName(selectedNode.name || "")}
                                        </strong>
                                    </h3>
                                    <hr className="border-gray-200 mb-3" />

                                    {/* Node Selected */}
                                    {selectedNode.value !== undefined && (
                                        <div className="text-gray-700 mb-1 flex items-center">
                                            <span>Value:</span>
                                            <div className="flex items-center ml-6">
                                                <input
                                                    type="number"
                                                    value={editedValue !== null ? editedValue : Math.round(selectedNode.value.value)}
                                                    onChange={(e) => setEditedValue(parseInt(e.target.value))}
                                                    className="w-16 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {/* Details for value and unit */}
                                    {selectedNode.value !== undefined && (
                                        <div className="text-gray-700 mb-1 flex items-center justify-between">
                                            <div>
                                                <br />
                                                {`Unit: ${selectedNode.value.unit}`}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between mt-4">
                                        <button
                                            className="py-2 px-4 rounded font-medium transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none flex-grow"
                                            onClick={handleSave}
                                        >
                                            <span className="relative z-10">Save</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded transition-opacity duration-300"></div>
                                            <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-sky-900"></div>
                                        </button>
                                    </div>
                                    {selectedNode && !selectedNode.isCenter && (
                                        <button
                                            className="w-full py-2 px-4 mt-2 rounded font-medium transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-sky-400 to-sky-900 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none flex-grow"
                                            onClick={handleDiveIntoNode}
                                        >
                                            <span className="relative z-10">Dive In</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 opacity-0 hover:opacity-100 rounded transition-opacity duration-300"></div>
                                            <div className="absolute inset-0 rounded opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-blue-400"></div>
                                        </button>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-cyan-500 to-transparent opacity-10"></div>
                                </div>
                            </>
                        )}

                        {selectedEdge && (
                            <div className="mt-4 bg-teal-50 border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-blue-500"></div>

                                <div className="flex items-center mb-2">
                                    <Info className="mr-2 text-blue-500" size={16} />
                                    <h4 className="text-md font-medium text-blue-700">Connection Details</h4>
                                </div>

                                {'impact' in selectedEdge && selectedEdge.impact && (
                                    <div className="text-gray-700 mb-1 flex justify-between">
                                        <span>Impact:</span>
                                        <span className={selectedEdge.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                                            {selectedEdge.impact}
                                        </span>
                                    </div>
                                )}

                                {'weight' in selectedEdge && selectedEdge.weight !== undefined && (
                                    <div className="text-gray-700 mb-1 flex justify-between">
                                        <span>Weight:</span>
                                        <span>{selectedEdge.weight}</span>
                                    </div>
                                )}

                                {'flow' in selectedEdge && selectedEdge.flow !== undefined && (
                                    <div className="text-gray-700 mb-1 flex justify-between">
                                        <span>Flow:</span>
                                        <span>{selectedEdge.flow}</span>
                                    </div>
                                )}

                                <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-blue-500 to-transparent opacity-10"></div>
                            </div>
                        )}

                        {graphData && (
                            <div className="mt-6">
                                <div className="bg-teal-50 border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>

                                    <div className="flex items-center mb-4">
                                        <Calendar className="mr-2 text-blue-500" size={18} />
                                        <h3 className="text-lg font-medium text-blue-700">Time Simulation</h3>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-2">Time Unit:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['days', 'weeks', 'months', 'years'] as const).map((unit) => (
                                                <button
                                                    key={unit}
                                                    className={`
                                                                    px-3 py-2 text-sm rounded-md transition-all duration-300 relative overflow-hidden
                                                                    ${simulationSettings.timeUnit === unit
                                                            ? 'shadow-lg transform scale-105'
                                                            : 'hover:shadow-md'}
                                                                `}
                                                    onClick={() => handleTimeUnitChange(unit)}
                                                >
                                                    <div className={`
                                                                    absolute inset-0 bg-gradient-to-r
                                                                    ${simulationSettings.timeUnit === unit
                                                            ? 'from-blue-500 to-cyan-400'
                                                            : 'from-gray-100 to-gray-200 hover:from-blue-50 hover:to-cyan-50'}
                                                                `}></div>
                                                    <span className={`
                                                                    relative z-10
                                                                    ${simulationSettings.timeUnit === unit ? 'text-white' : 'text-gray-800'}
                                                                `}>
                                                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                                    </span>

                                                    {simulationSettings.timeUnit === unit && (
                                                        <div className="absolute inset-0 opacity-30 blur-sm bg-gradient-to-r from-blue-300 to-cyan-300"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <p className="text-sm text-gray-600">Simulate future:</p>
                                            <span className="text-sm font-medium text-blue-600">
                                                {Math.round(animatedSimulationValue)} {simulationSettings.timeUnit}
                                            </span>
                                        </div>
                                        <div className="relative py-2">
                                            <div className="absolute h-2 top-1/2 left-0 right-0 -mt-1 bg-gradient-to-r from-blue-100 to-teal-900 rounded-lg"></div>
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
                                                className="appearance-none w-full h-2 bg-transparent rounded-lg cursor-pointer relative z-10"
                                                style={{
                                                    WebkitAppearance: 'none',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Now</span>
                                            <span>
                                                {simulationSettings.timeUnit === 'days' ? '365 days' :
                                                    simulationSettings.timeUnit === 'weeks' ? '52 weeks' :
                                                        simulationSettings.timeUnit === 'months' ? '36 months' : '10 Years'}
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                className="w-full py-2 rounded font-medium transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none"
                                                onClick={() => animateSimulation(simulationValue, 2000)}
                                            >
                                                <span className="relative z-10">Simulate</span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                                                <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-pink-400"></div>
                                            </button>
                                            <div className="mt-2 flex justify-between">
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="bg-teal-50 border border-gray-200 hover:border-pink-300 text-gray-800 py-2 px-2 rounded-full shadow focus:outline-none flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
                                                        onClick={handlePause}
                                                        disabled={simulationValue === 0}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-pink-50 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                                                        {isPaused ? <Play size={16} className="relative z-10" /> : <Pause size={16} className="relative z-10" />}
                                                    </button>
                                                    <button
                                                        className="bg-teal-50 border border-gray-200 hover:border-pink-300 text-gray-800 py-2 px-2 rounded-full shadow focus:outline-none flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
                                                        onClick={handleReset}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-pink-50 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                                                        <RefreshCw size={16} className="relative z-10" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-cyan-500 to-transparent opacity-10"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-blue-500 to-transparent opacity-10"></div>
                                </div>
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
                </div>


            </div>
        </div>
    );
};

export default Playground;