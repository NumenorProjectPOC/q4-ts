import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import GridLayout from "../components/GridComponent";
import axios from "axios";

const MainPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [gridCount, setGridCount] = useState<number>(4); // Default to 4 grids
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const guids = ["111", "114", "187"]; // Example GUIDs
        const response = await axios.get("http://localhost:8000/users/stocks/?guids=21377984-fe94-445c-934b-3b3e0c1cdabe&guids=7951d219-4fdc-4f51-a21e-bf6000b4421f&guids=bcf7252b-c427-4cbf-8274-f892ceb5b0ed",);
        setData(response.data);
        setGridCount(response.data.length);
        
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const updateGridCount = (count: number) => {
    setGridCount(count);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        <div className="flex h-full w-full gap-2 md:gap-4">
          <div
            className={`${
              isCollapsed ? "w-12 md:w-16" : "w-20 sm:w-40 md:w-64"
            } h-full bg-gray-100 border border-gray-200 rounded-lg p-2 flex flex-col items-center justify-start text-lg font-bold text-gray-700 transition-all duration-300 relative flex-shrink-0 overflow-hidden`}
          >
            <button
              onClick={toggleCollapse}
              className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors duration-200 z-10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 md:h-4 md:w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>
            <span className="mt-8">1</span>
   
          </div>
          <div className="flex-grow h-full overflow-hidden">
            {loading ? (
              <p className="text-center text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <GridLayout gridCount={gridCount} data={data} />
      
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;