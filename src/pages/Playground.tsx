import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchGraphData } from '../services/quantiforeApi';
import Navbar from "../components/Navbar";
import { GraphData, NodeData, LinkData } from '../services/types';
import { ChevronUp, ChevronDown, Calendar, Info, Pause, Play, RefreshCw, Loader } from 'lucide-react';
import { formatStockName } from '../utils/utility';

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
    const [simulationValue, setSimulationValue] = useState<number>(0); // New state for slider value
    const [sidebarWidth, setSidebarWidth] = useState(0);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [editedValue, setEditedValue] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentStockName, setCurrentStockName] = useState("India-population");
    const [runSimulation, setRunSimulation] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    useLayoutEffect(() => {
        const updateSidebarWidth = () => {
            if (sidebarRef.current) {
                setSidebarWidth(sidebarRef.current.offsetWidth);
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
        fetchGraphData(currentStockName)
            .then((data: any) => {
                console.log(data, "Data fetched from API");
                setGraphData(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Error fetching graph data:", error);
                setIsLoading(false);
            });
    }, [currentStockName]);

    // Rest of your functions (updateValue, animateSimulation, etc.)
    const updateValue = (increment: boolean) => {
        if (!selectedNode || !graphData) return;
        const newGraphData = { ...graphData };

        // Function to recursively update related stocks
        const updateRelatedStocks = (stockGuid: string, change: number, isMainStock: boolean = false) => {
            // Find the stock being updated
            let stockToUpdate;
            if (isMainStock) {
                stockToUpdate = newGraphData.stock;
            } else {
                stockToUpdate = newGraphData.related_stocks.find(stock => stock.guid === stockGuid);
            }

            if (!stockToUpdate) return; // Stock not found

            // Update the stock's value directly
            const currentValue = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.value : 0;
            const unit = typeof stockToUpdate.value === 'object' ? stockToUpdate.value.unit : '';
            stockToUpdate.value = { value: currentValue + change, unit: unit };

            // If updating the main stock, update related stocks based on impact
            if (isMainStock) {
                newGraphData.related_stocks.forEach(relatedStock => {
                    if (!relatedStock.relationship) return;
                    const weight = relatedStock.relationship.weight / 100;
                    const isPositive = relatedStock.relationship.impact === "positive";
                    const valueChange = change * weight * (isPositive ? 1 : -1);
                    updateRelatedStocks(relatedStock.guid, valueChange); // Recursive call
                });
            }
        };

        // Determine which stock to update and initiate recursive updates
        if (selectedNode.id === newGraphData.stock.guid) {
            const change = increment ? 1 : -1;
            updateRelatedStocks(newGraphData.stock.guid, change, true); // True means this is the main stock
        } else {
            const change = increment ? 1 : -1;
            updateRelatedStocks(selectedNode.id, change);
        }

        // Update state with new graph data
        setGraphData(newGraphData);

        // Update selected node
        if (selectedNode.id === newGraphData.stock.guid) {
            setSelectedNode({
                ...selectedNode,
                value: newGraphData.stock.value
            });
        } else {
            const updatedStock = newGraphData.related_stocks.find(
                stock => stock.guid === selectedNode.id
            );
            if (updatedStock) {
                setSelectedNode({
                    ...selectedNode,
                    value: updatedStock.value
                });
            }
        }
    };

    const animateSimulation = (targetValue: number, duration: number) => {
        setRunSimulation(true);
        setIsSimulating(true);
        setTimeout(() => {
            setRunSimulation(false);
            setIsSimulating(false);
        }, duration);

        setSimulationSettings((prevSettings) => ({
            ...prevSettings,
            value: targetValue,
        }));
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        setSimulationSettings({
            ...simulationSettings,
            value: 0
        });
    };

    const handleTimeUnitChange = (unit: "days" | "weeks" | "months" | "years") => {
        setSimulationSettings({
            ...simulationSettings,
            timeUnit: unit,
            value: 0
        });
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        setSimulationValue(newValue); // Update separate state variable
    };

    const handleSave = () => {
        if (selectedNode && editedValue !== null) {
            handleNodeValueChange(selectedNode?.id, editedValue);
            setEditedValue(null);
        }
    };

    const handleNodeValueChange = (nodeId: string, newValue: number) => {
        setGraphData((prevGraphData) => {
            if (!prevGraphData) return prevGraphData;

            const updatedGraphData = { ...prevGraphData };

            if (updatedGraphData.stock.guid === nodeId) {
                updatedGraphData.stock.value = { ...updatedGraphData.stock.value, value: newValue };
            } else {
                const relatedStockIndex = updatedGraphData.related_stocks.findIndex((stock) => stock.guid === nodeId);
                if (relatedStockIndex !== -1) {
                    updatedGraphData.related_stocks[relatedStockIndex].value = {
                        ...updatedGraphData.related_stocks[relatedStockIndex].value,
                        value: newValue,
                    };
                }
            }
            return updatedGraphData;
        });
    };

    const handleDiveIntoNode = () => {
        if (selectedNode && !selectedNode.isCenter) {
            setCurrentStockName(selectedNode.id);
        }
    };

    return (
        <div className="h-screen bg-background text-text-primary flex flex-col">
            <Navbar showLogo={true} showTabs={true} />
            <div className="main-content flex flex-1">
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <h2 className="text-4xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-pink-500">
                            Loading stocks...
                        </h2>
                    </div>
                ) : (
                    <>
                        <div className="graph-container flex-grow bg-transparent flex justify-center items-center overflow-hidden">
                            {graphData && (
                                <GraphComponent
                                    simulationSettings={simulationSettings}
                                    simulationValue={simulationValue}
                                    graphData={graphData}
                                    selectedElement={selectedNode || selectedEdge}
                                    setSelectedElement={(element) => {
                                        if (element && 'id' in element) {
                                            setSelectedNode(element);
                                            setSelectedEdge(null);
                                        } else if (element) {
                                            setSelectedEdge(element);
                                            setSelectedNode(null);
                                        }
                                    }}
                                    sidebarWidth={sidebarWidth}
                                    nodeValueChangeCallback={handleNodeValueChange}
                                    runSimulation={runSimulation}
                                />
                            )}
                        </div>
                        <div className="sidebar w-80 p-8 sidebar bg-gradient-to-b from-white to-gray-50" ref={sidebarRef}>
                            <div className="sidebar-content">
                                <h2 className="text-xl font-mono font-semibold text-blue-700 mb-4 tracking-tight">Stock Details</h2>
                                {!selectedNode && !selectedEdge && (
                                    <p className="text-gray-600 font-mono">Click on a node or edge to see details.</p>
                                )}
                                {selectedNode && (
                                    <>
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                                            {/* Cyberpunk decorative element - top glow bar */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-pink-500"></div>

                                            <h3 className="text-lg font-mono font-medium text-blue-700 mb-2 relative z-10">
                                                <strong>
                                                    {formatStockName(selectedNode.name || "")}
                                                </strong>
                                            </h3>
                                            <hr className="border-gray-200 mb-3" />

                                            {/* Node Selected */}
                                            {selectedNode.value !== undefined && (
                                                <div className="text-gray-700 mb-1 flex items-center font-mono">
                                                    <span>Value:</span>
                                                    <div className="flex items-center ml-6">
                                                        <input
                                                            type="number"
                                                            value={editedValue !== null ? editedValue : Math.round(selectedNode.value.value)}
                                                            onChange={(e) => setEditedValue(parseInt(e.target.value))}
                                                            className="w-16 text-center border border-gray-300 rounded font-mono focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {/* Details for value and unit */}
                                            {selectedNode.value !== undefined && (
                                                <div className="text-gray-700 mb-1 flex items-center justify-between font-mono">
                                                    <div>
                                                        <br />
                                                        {`Unit: ${selectedNode.value.unit}`}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between mt-4">
                                                <button
                                                    className="py-2 px-4 rounded font-medium font-mono transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none flex-grow"
                                                    onClick={handleSave}
                                                >
                                                    <span className="relative z-10">Save</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded transition-opacity duration-300"></div>
                                                    <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-pink-400"></div>
                                                </button>
                                            </div>
                                            {selectedNode && !selectedNode.isCenter && (
                                                <button
                                                    className="w-full py-2 px-4 mt-2 rounded font-medium font-mono transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none flex-grow"
                                                    onClick={handleDiveIntoNode}
                                                >
                                                    <span className="relative z-10">Dive In</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 opacity-0 hover:opacity-100 rounded transition-opacity duration-300"></div>
                                                    <div className="absolute inset-0 rounded opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-blue-400"></div>
                                                </button>
                                            )}
                                            {/* Cyberpunk decorative element - bottom corner accent */}
                                            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-pink-500 to-transparent opacity-10"></div>
                                        </div>
                                    </>
                                )}

                                {selectedEdge && (
                                    <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden font-mono">
                                        {/* Cyberpunk decorative element - top glow bar */}
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

                                        {/* Cyberpunk decorative element - bottom corner accent */}
                                        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-blue-500 to-transparent opacity-10"></div>
                                    </div>
                                )}

                                {/* Simulation Panel with Cyberpunk Theme */}
                                {graphData && (
                                    <div className="mt-6">
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                                            {/* Cyberpunk decorative element - top glow bar */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>

                                            <div className="flex items-center mb-4">
                                                <Calendar className="mr-2 text-blue-500" size={18} />
                                                <h3 className="text-lg font-mono font-medium text-blue-700">Time Simulation</h3>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-sm text-gray-600 mb-2 font-mono">Time Unit:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(['days', 'weeks', 'months', 'years'] as const).map((unit) => (
                                                        <button
                                                            key={unit}
                                                            className={`
                                                                px-3 py-2 text-sm rounded-md transition-all duration-300 font-mono relative overflow-hidden
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
                                                    <p className="text-sm text-gray-600 font-mono">Simulate future:</p>
                                                    <span className="text-sm font-medium text-blue-600 font-mono">
                                                        {Math.round(simulationValue)} {simulationSettings.timeUnit}
                                                    </span>
                                                </div>
                                                <div className="relative py-2">
                                                    <div className="absolute h-2 top-1/2 left-0 right-0 -mt-1 bg-gradient-to-r from-blue-100 to-pink-100 rounded-lg"></div>
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
                                                <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
                                                    <span>Now</span>
                                                    <span>
                                                        {simulationSettings.timeUnit === 'days' ? '365 days' :
                                                            simulationSettings.timeUnit === 'weeks' ? '52 weeks' :
                                                                simulationSettings.timeUnit === 'months' ? '36 months' : '10 Years'}
                                                    </span>
                                                </div>
                                                <div className="mt-4">
                                                    <button
                                                        className="w-full py-2 rounded font-medium font-mono transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none"
                                                        onClick={() => animateSimulation(simulationValue, 2000)}
                                                    >
                                                        <span className="relative z-10">Simulate</span>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-pink-600 opacity-0 hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
                                                        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-30 transition-opacity duration-300 blur-md bg-gradient-to-r from-cyan-400 to-pink-400"></div>
                                                    </button>
                                                    <div className="mt-2 flex justify-between">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                className="bg-white border border-gray-200 hover:border-pink-300 text-gray-800 py-2 px-2 rounded-full shadow focus:outline-none flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
                                                                onClick={handlePause}
                                                                disabled={simulationValue === 0}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-pink-50 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                                                                {isPaused ? <Play size={16} className="relative z-10" /> : <Pause size={16} className="relative z-10" />}
                                                            </button>
                                                            <button
                                                                className="bg-white border border-gray-200 hover:border-pink-300 text-gray-800 py-2 px-2 rounded-full shadow focus:outline-none flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
                                                                onClick={handleReset}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-pink-50 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                                                                <RefreshCw size={16} className="relative z-10" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cyberpunk decorative elements */}
                                            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-pink-500 to-transparent opacity-10"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-blue-500 to-transparent opacity-10"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Playground;