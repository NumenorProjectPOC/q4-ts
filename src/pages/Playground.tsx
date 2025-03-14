import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchGraphData } from '../services/quantiforeApi';
import Navbar from "../components/Navbar";
import { GraphData, NodeData, LinkData } from '../services/types';
import { ChevronUp, ChevronDown, Calendar, Info } from 'lucide-react';
import formatStockName from '../utils/utility';

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

interface SimulationSettings {
  timeUnit: "days" | "weeks" | "months" | "years";
  value: number;
}

const Playground: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedElement, setSelectedElement] = useState<NodeData | LinkData | null>(null);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    timeUnit: "years",
    value: 0
  });
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    const stockName = "India-population";
    fetchGraphData(stockName)
      .then((data: any) => {
        console.log(data, "Data fetched from API");
        setGraphData(data); 
      })
      .catch(error => console.error("Error fetching graph data:", error));
  }, []);

  const updateValue = (increment: boolean) => {

    // if (!selectedElement || !graphData) return;
    // const newGraphData = { ...graphData };
    // const isNode = 'id' in selectedElement;

    // if (!isNode) return; // Only handle node updates

    // if (selectedElement.id === newGraphData.stock.guid) {
    
    //   const currentValue = newGraphData.stock.value.value;
    //   const unit = newGraphData.stock.value.unit;
    //   const change = increment ? 1 : -1;
    //   newGraphData.stock.value = { value: currentValue + change, unit: unit };

    //   newGraphData.related_stocks = newGraphData.related_stocks.map(stock => {
    //     if (!stock.relationship) return stock;
    //     const weight = stock.relationship.weight / 100;
    //     const isPositive = stock.relationship.impact === "positive";
    //     const currentStockValue = stock.value.value;
    //     const stockUnit = stock.value.unit;
    //     const valueChange = change * weight * (isPositive ? 1 : -1);

    //     return {
    //       ...stock,
    //       value: { value: currentStockValue + valueChange, unit: stockUnit }
    //     };
    //   });
    // } else {
    //   const relatedStock = newGraphData.related_stocks.find(
    //     stock => stock.guid === selectedElement.id
    //   );
    //   if (relatedStock) {
    //     const currentValue = relatedStock.value.value;
    //     const unit = relatedStock.value.unit;
    //     const change = increment ? 1 : -1;
    //     relatedStock.value = { value: currentValue + change, unit: unit };

    //     if (relatedStock.relationship) {
    //       const weight = relatedStock.relationship.weight / 100;
    //       const isPositive = relatedStock.relationship.impact === "positive";
    //       const mainStockValue = newGraphData.stock.value.value;
    //       const mainUnit = newGraphData.stock.value.unit;
    //       const valueChange = change * weight * (isPositive ? 1 : -1);
    //       newGraphData.stock.value = { value: mainStockValue + valueChange, unit: mainUnit };
    //     }
    //   }
    // }

    // setGraphData(newGraphData);

    // // Update selected element
    // if (selectedElement.id === newGraphData.stock.guid) {
    //   setSelectedElement({
    //     ...selectedElement,
    //     value: newGraphData.stock.value
    //   });
    // } else {
    //   const updatedStock = newGraphData.related_stocks.find(
    //     stock => stock.guid === selectedElement.id
    //   );
    //   if (updatedStock) {
    //     setSelectedElement({
    //       ...selectedElement,
    //       value: updatedStock.value
    //     });
    //   }
    // }
  };

  const simulateTimeChange = (value: number) => {
    // if (!graphData) return;

    // // This is a simplified simulation. In a real application,
    // // you would likely have a more complex model for how values change over time
    // const newGraphData = { ...graphData };

    // // Calculate growth factor based on time unit and value
    // let yearEquivalent = 0;
    // switch (simulationSettings.timeUnit) {
    //   case "days":
    //     yearEquivalent = value / 365;
    //     break;
    //   case "weeks":
    //     yearEquivalent = value / 52;
    //     break;
    //   case "months":
    //     yearEquivalent = value / 12;
    //     break;
    //   case "years":
    //     yearEquivalent = value;
    //     break;
    // }

    // // Apply growth factor to main stock
    // const mainStockValue = newGraphData.stock.value.value;
    // const mainUnit = newGraphData.stock.value.unit;
    // // Assuming 2% annual growth rate for population as a simple model
    // const newMainValue = mainStockValue * Math.pow(1.02, yearEquivalent);
    // newGraphData.stock.value = { value: newMainValue, unit: mainUnit };

    // // Apply corresponding changes to related stocks
    // newGraphData.related_stocks = newGraphData.related_stocks.map(stock => {
    //   if (!stock.relationship) return stock;

    //   const currentValue = stock.value.value;
    //   const unit = stock.value.unit;
    //   let growthRate = 0.02; // Default

    //   // Adjust growth rate based on relationship
    //   if (stock.relationship.impact === "positive") {
    //     growthRate = 0.02 + (stock.relationship.weight / 500); // Small positive adjustment
    //   } else {
    //     growthRate = 0.02 - (stock.relationship.weight / 500); // Small negative adjustment
    //   }

    //   const newValue = currentValue * Math.pow(1 + growthRate, yearEquivalent);
    //   return {
    //     ...stock,
    //     value: { value: newValue, unit: unit }
    //   };
    // });

    // setGraphData(newGraphData);

    // // Update selected element if any
    // if (selectedElement && 'id' in selectedElement) {
    //   if (selectedElement.id === newGraphData.stock.guid) {
    //     setSelectedElement({
    //       ...selectedElement,
    //       value: newGraphData.stock.value
    //     });
    //   } else {
    //     const updatedStock = newGraphData.related_stocks.find(
    //       stock => stock.guid === selectedElement.id
    //     );
    //     if (updatedStock) {
    //       setSelectedElement({
    //         ...selectedElement,
    //         value: updatedStock.value
    //       });
    //     }
    //   }
    // }
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
    setSimulationSettings({
      ...simulationSettings,
      value: newValue
    });
    simulateTimeChange(newValue);
  };

  const isEdgeSelected = selectedElement && !('id' in selectedElement);

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col">
      <Navbar showLogo={true} showTabs={true} />
      <div className="main-content flex flex-1">
        <div className="graph-container flex-grow bg-transparent flex justify-center items-center overflow-hidden">
          {graphData && (
            <GraphComponent
              graphData={graphData}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              sidebarWidth={sidebarWidth}
            />
          )}
        </div>
        <div className="sidebar w-80 p-8 sidebar" ref={sidebarRef}>
          <div className="sidebar-content">
            <h2 className="text-xl font-semibold text-secondary-gray mb-4">Details</h2>
            {selectedElement && (
              <>
                <div className="bg-card-bg border border-card-border rounded-lg shadow-md p-6 hover:bg-hover-effect">
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    <strong>
                      {'id' in selectedElement
                        ? formatStockName(selectedElement.name || "")
                        : `Connection Details`}
                    </strong>
                  </h3>
                  <hr className="border-gray-500 mb-3" />

                  {/* Node Selected */}
                  {'id' in selectedElement && selectedElement.value !== undefined && (
                    <div className="text-text-secondary mb-1 flex items-center justify-between">
                      <span>Value:</span>
                      <div className="flex items-center">
                        <button
                          className="mr-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
                          onClick={() => updateValue(false)}
                        >
                          <ChevronDown size={16} />
                        </button>
                        {Math.round(selectedElement.value.value)}
                        <button
                          className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
                          onClick={() => updateValue(true)}
                        >
                          <ChevronUp size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  {/*details for value and unit*/}
                  {'id' in selectedElement && selectedElement.value !== undefined && (
                    <div className="text-text-secondary mb-1 flex items-center justify-between">
                      <div>
                        <br />
                        {`Unit: ${selectedElement.value.unit}`}
                      </div>
                    </div>
                  )}

                  {/* Edge Selected - Show Characteristics */}
                  {isEdgeSelected && (
                    <div className="mt-2">
                      <div className="flex items-center mb-2">
                        <Info className="mr-2 text-gray-600" size={16} />
                        <h4 className="text-md font-medium">Characteristics</h4>
                      </div>

                      {'impact' in selectedElement && selectedElement.impact && (
                        <div className="text-text-secondary mb-1 flex justify-between">
                          <span>Impact:</span>
                          <span className={selectedElement.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                            {selectedElement.impact}
                          </span>
                        </div>
                      )}

                      {'weight' in selectedElement && selectedElement.weight !== undefined && (
                        <div className="text-text-secondary mb-1 flex justify-between">
                          <span>Weight:</span>
                          <span>{selectedElement.weight}</span>
                        </div>
                      )}

                      {'flow' in selectedElement && selectedElement.flow !== undefined && (
                        <div className="text-text-secondary mb-1 flex justify-between">
                          <span>Flow:</span>
                          <span>{selectedElement.flow}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Simulation Panel */}
                {!isEdgeSelected && (
                  <div className="mt-6">
                    <div className="bg-card-bg border border-card-border rounded-lg shadow-md p-6">
                      <div className="flex items-center mb-4">
                        <Calendar className="mr-2 text-gray-600" size={18} />
                        <h3 className="text-lg font-medium text-text-primary">Time Simulation</h3>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Time Unit:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(['days', 'weeks', 'months', 'years'] as const).map((unit) => (
                            <button
                              key={unit}
                              className={`px-3 py-2 text-sm rounded-md transition ${simulationSettings.timeUnit === unit
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                              onClick={() => handleTimeUnitChange(unit)}
                            >
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-gray-600">Simulate future:</p>
                          <span className="text-sm font-medium">
                            {simulationSettings.value} {simulationSettings.timeUnit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={
                            simulationSettings.timeUnit === 'days' ? 365 :
                              simulationSettings.timeUnit === 'weeks' ? 52 :
                                simulationSettings.timeUnit === 'months' ? 36 : 10
                          }
                          value={simulationSettings.value}
                          // onChange={handleSliderChange}
                          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Now</span>
                          <span>
                            {simulationSettings.timeUnit === 'days' ? '365 days' :
                              simulationSettings.timeUnit === 'weeks' ? '52 weeks' :
                                simulationSettings.timeUnit === 'months' ? '36 months' : '10 Years'}
                          </span>
                        </div>
                        <div className="mt-2">
                          <button
                            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            onClick={() => simulateTimeChange(simulationSettings.value)}
                          >
                            Simulate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </>
            )}

            {!selectedElement && (
              <p className="text-gray-600">Click on a node or edge to see details.</p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;