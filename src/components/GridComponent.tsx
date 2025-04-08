import React from "react";
import GraphMonitorComponent from './MonitoringGraph'

// Define the data interface based on your sample
interface DataItem {
  time: string;
  value_unit: string;
  stockcreationtime: string;
  guid: string;
}

// Updated props interface to include data
interface GridLayoutProps {
  gridCount: number;
  data: DataItem[][];
}

const GridLayout: React.FC<GridLayoutProps> = ({ gridCount, data }) => {
  console.log(data.length, 'Grid data received');

  // Ensure that we only use available datasets
  const availableData = data.slice(0, gridCount);

  // Generate grid items dynamically
  const gridItems = Array.from({ length: gridCount }, (_, index) => ({
    id: index + 1,
    content: `Graph ${index + 1}`,
    dataset: availableData[index] || [], // Assign correct dataset or empty array if missing
  }));

  const getGridClasses = () => {
    switch (gridCount) {
      case 1:
        return "grid-cols-1 grid-rows-1";
      case 2:
        return "grid-cols-1 grid-rows-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 md:grid-rows-2"; // First row: 1 col, Second row: 2 cols
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
          className={`bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 border border-gray-200 rounded-lg p-1 md:p-4 
              flex flex-col items-center justify-center text-base md:text-lg font-bold text-gray-700
              ${gridCount === 3 ? (index === 0 ? "md:col-span-2" : "md:col-span-1") : ""}`} // 1st graph spans 2 cols
        >
          <div>{item.content}</div>
          <GraphMonitorComponent data={item.dataset} index={index} />
        </div>
      ))}
    </div>
  );

};

export default GridLayout;
