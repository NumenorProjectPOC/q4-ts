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
  const availableData = data.map((item) => item || null);
  
  // Generate grid items dynamically
  const gridItems = Array.from({ length: gridCount }, (_, index) => ({
    id: index + 1,
    content: stockOptions.find(s => s.value === selectedStocks[index])?.label,
    dataset: (availableData[index] as Dataset) || {},
  }));

  const getGridClasses = () => {
    switch (gridCount) {
      case 1:
        return "grid-cols-1 grid-rows-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
      case 3:
        return "grid-cols-1 md:grid-cols-2 grid-rows-3 md:grid-rows-2";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2";
      case 5:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-5 sm:grid-rows-3 lg:grid-rows-2";
      case 6:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-6 sm:grid-rows-3 lg:grid-rows-2";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr";
    }
  };

  const getItemClasses = (index: number) => {
    // Special handling for 3-item grid
    if (gridCount === 3) {
      if (index === 2) {
        return "md:col-span-2"; // Last item spans 2 columns on medium screens and up
      }
      return "md:col-span-1";
    }
    return "";
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className={`grid ${getGridClasses()} gap-2 sm:gap-3 lg:gap-4 h-full w-full min-h-0`}>
        {gridItems.map((item, index) => (
          <div
            key={item.id}
            // MODIFIED: Removed the hardcoded min-h-[...] classes.
            // `min-h-0` is crucial for flexbox children inside a sized container, allowing them to shrink.
            className={`${getItemClasses(index)} min-h-0 flex flex-col`}
          >
            {loadingMap[index] ? (
              <div className="flex items-center justify-center h-full w-full text-teal-800 font-medium bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 border border-gray-200 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-600 border-t-transparent mr-2"></div>
                Loading...
              </div>
            ) : (
              // This structure is correct: parent is a flex-col, and the chart container is flex-1
              <div className="bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 border border-gray-200 rounded-lg p-2 sm:p-3 lg:p-4 flex flex-col h-full w-full min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-700 truncate">
                    {item.content}
                  </h3>
                </div>
                
                {/* Chart Container - This flex-1 and min-h-0 allows it to fill available space */}
                <div className="flex-1 min-h-0 w-full">
                  <GraphMonitorComponent
                    data={item.dataset?.stock_data || []}
                    upperThreshold={item.dataset?.upper_threshold || 0}
                    lowerThreshold={item.dataset?.lower_threshold || 0}
                    index={index}
                    availableRanges={["1D", "1M", "6M", "1Y", "Max"]}
                    defaultRange="1M"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridLayout;