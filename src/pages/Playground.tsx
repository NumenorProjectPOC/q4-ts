import React, { useState, useEffect } from 'react';
import GraphComponent from '../components/GraphComponent';
import { fetchGraphData } from '../services/quantiforeApi';
import Navbar from "../components/Navbar";
import { GraphData, NodeData, LinkData } from '../services/types'

// Shared interfaces matching GraphComponent
interface Relationship {
  impact: "positive" | "negative";
  weight: number;
  flow: number;
}

interface Stock {
  guid: string;  // Added guid to match GraphComponent
  name: string;
  value: string;
  context?: string;
  relationship?: Relationship;
}





const Playground: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedElement, setSelectedElement] = useState<NodeData | LinkData | null>(null);

  useEffect(() => {
    const stockName = "kerala-population";
    fetchGraphData(stockName)
      .then((data: any) => {
        // Transform the API data to match our interfaces
        const transformedData: GraphData = {
          stock: {
            ...data.stock,
            guid: data.stock.guid || data.stock.id || String(Date.now()) // Ensure guid exists
          },
          related_stocks: data.related_stocks.map((stock: any) => ({
            ...stock,
            guid: stock.guid || stock.id || String(Date.now()) // Ensure guid exists
          }))
        };
        console.log(transformedData, "Data fetched and transformed from API");
        setGraphData(transformedData);
      })
      .catch(error => console.error("Error fetching graph data:", error));
  }, []);

  const updateValue = (increment: boolean) => {
    if (!selectedElement || !graphData) return;
    
    const newGraphData = { ...graphData };
    const isNode = 'id' in selectedElement; // Check if it's a NodeData
    
    if (!isNode) return; // Only handle node updates

    if (selectedElement.id === newGraphData.stock.guid) {
      const currentValue = parseFloat(newGraphData.stock.value||'');
      const change = increment ? 1 : -1;
      newGraphData.stock.value = `${currentValue + change} people`;

      newGraphData.related_stocks = newGraphData.related_stocks.map(stock => {
        if (!stock.relationship) return stock;
        const weight = stock.relationship.weight / 100;
        const isPositive = stock.relationship.impact === "positive";
        const currentStockValue = parseFloat(stock.value||'');
        const valueChange = change * weight * (isPositive ? 1 : -1);
        
        return {
          ...stock,
          value: `${(currentStockValue + valueChange).toFixed(2)} people`
        };
      });
    } else {
      const relatedStock = newGraphData.related_stocks.find(
        stock => stock.guid === selectedElement.id
      );
      if (relatedStock) {
        const currentValue = parseFloat(relatedStock.value||'');
        const change = increment ? 1 : -1;
        relatedStock.value = `${(currentValue + change).toFixed(2)} people`;

        if (relatedStock.relationship) {
          const weight = relatedStock.relationship.weight / 100;
          const isPositive = relatedStock.relationship.impact === "positive";
          const mainStockValue = parseFloat(newGraphData.stock.value||'');
          const valueChange = change * weight * (isPositive ? 1 : -1);
          newGraphData.stock.value = `${(mainStockValue + valueChange).toFixed(2)} people`;
        }
      }
    }

    setGraphData(newGraphData);
    
    // Update selected element
    if (selectedElement.id === newGraphData.stock.guid) {
      setSelectedElement({
        ...selectedElement,
        value: newGraphData.stock.value
      });
    } else {
      const updatedStock = newGraphData.related_stocks.find(
        stock => stock.guid === selectedElement.id
      );
      if (updatedStock) {
        setSelectedElement({
          ...selectedElement,
          value: updatedStock.value
        });
      }
    }
  };

  const formatName = (name: string) => name;

  return (
    <div className="h-screen bg-gray-800 text-white flex flex-col">
      <Navbar showLogo={true} showTabs={true} />
      <div className="main-content flex flex-1">
        <div className="graph-container flex-grow bg-transparent flex justify-center items-center overflow-hidden">
          {graphData && (
            <GraphComponent
              graphData={graphData}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
            />
          )}
        </div>
        <div className="sidebar w-80 p-8 sidebar">
          <div className="sidebar-content">
            <h2 className="text-xl font-semibold text-slate-300 mb-4">Details</h2>
            {selectedElement && 'id' in selectedElement ? (
              <div className="bg-gray-100 bg-opacity-20 rounded-lg shadow-md p-6 backdrop-filter backdrop-blur-md">
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  <strong>{formatName(selectedElement.name || "Influence")}</strong>
                </h3>
                <hr className="border-gray-500 mb-3" />
                {selectedElement.value !== undefined && (
                  <div className="text-slate-300 mb-1">
                    Value:
                    <button 
                      className="mx-2 px-2 py-1 bg-red-500 rounded hover:bg-red-600"
                      onClick={() => updateValue(false)}
                    >
                      ➖
                    </button>
                    {selectedElement.value}
                    <button 
                      className="mx-2 px-2 py-1 bg-green-500 rounded hover:bg-green-600"
                      onClick={() => updateValue(true)}
                    >
                      ➕
                    </button>
                  </div>
                )}
                {selectedElement.context && (
                  <div className="text-sm text-slate-300 italic mb-1">
                    Context: {selectedElement.context}
                  </div>
                )}
                {selectedElement.relationship?.impact && (
                  <div className="text-sm text-slate-300 mb-1">
                    Impact: {selectedElement.relationship.impact}
                  </div>
                )}
                {selectedElement.relationship?.weight && (
                  <div className="text-sm text-slate-300 mb-1">
                    Weight: {selectedElement.relationship.weight}
                  </div>
                )}
                {selectedElement.relationship?.flow && (
                  <div className="text-sm text-slate-300">
                    Flow: {selectedElement.relationship.flow}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Click on a node or edge to see details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;