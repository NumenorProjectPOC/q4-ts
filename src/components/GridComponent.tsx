import React from "react";
import GraphMonitorComponent from './MonitoringGraph'

// Define the data interface based on your sample
interface DataItem {
  time: string;
  value_unit: string;
  stockcreationtime: string;
  predicted_value_unit: string | null;
  predicted_value_unit_1: string | null;
  predicted_value_unit_2: string | null;
  guid: string;
}

interface Dataset {
  stock_data?: DataItem[];
  upper_threshold?: number;
  lower_threshold?: number;
}

interface GridLayoutProps {
  gridCount: number;
  data: (DataItem[] | null)[];
  loadingMap: Record<number, boolean>;
  selectedStocks: string[];
  stockOptions: { label: string; value: string }[];
}


const GridLayout: React.FC<GridLayoutProps> = ({ gridCount, data, loadingMap, stockOptions, selectedStocks }) => {
  console.log(data, 'Grid data received');
  // Ensure that we only use available datasets
  const availableData = data.map((item) => item || null); // Initialize availableData based on the provided data
  // Generate grid items dynamically
  const gridItems = Array.from({ length: gridCount }, (_, index) => ({
    id: index + 1,
    content: stockOptions.find(s => s.value === selectedStocks[index])?.label,
    dataset: (availableData[index] as Dataset) || {}, // Explicitly type dataset as Dataset
  }));

  const getGridClasses = () => {
    switch (gridCount) {
      case 1:
        return "grid-cols-1 grid-rows-1";
      case 2:
        return "grid-cols-1 grid-rows-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 md:grid-rows-2";
      case 4:
      default:
        return "grid-cols-2 grid-rows-2";
    }
  };


  return (
    <div className={`grid ${getGridClasses()} gap-2 md:gap-4 h-full w-full`}>
      {gridItems.map((item, index) => (
        <div
          key={item.id}
          className={`${gridCount === 3 && index === 2
            ? "md:col-span-2"
            : gridCount === 3
              ? "md:col-span-1"
              : ""
            }`}
        >
          {loadingMap[index] ? (
            <div className="flex items-center justify-center h-full w-full text-teal-800 font-medium">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-600 border-t-transparent mr-2"></div>
              Loading...
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 border border-gray-200 rounded-lg p-1 md:p-4 
              flex flex-col justify-center text-base md:text-lg font-bold text-gray-700 h-full w-full">
              <div>{item.content}</div>
              <GraphMonitorComponent
                data={item.dataset?.stock_data || []}
                upperThreshold={item.dataset?.upper_threshold || 0}
                lowerThreshold={item.dataset?.lower_threshold || 0}
                index={index}
                availableRanges={["1D", "1M", "6M", "1Y", "Max"]}
                defaultRange="1M"
              />
            </div>
          )}
        </div>
      ))}

    </div>
  );

};

export default GridLayout;
