import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import GridLayout from "../components/GridComponent";
import axios from "axios";

interface StockOption {
  label: string;
  value: string;
}

const stockOptions: StockOption[] = [
  { label: "Apple (AAPL)", value: "AAPL" },
  { label: "Microsoft (MSFT)", value: "MSFT" },
  { label: "Google (GOOGL)", value: "GOOGL" },
  { label: "Amazon (AMZN)", value: "AMZN" },
  { label: "Tesla (TSLA)", value: "TSLA" },
  { label: "Yahoo (YAHOO)", value: "YAHOO" },
  { label: "AsianPaints (ASPNT)", value: "ASPNT" },
  { label: "Tata (TATA)", value: "TATA" },
];

const MainPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [gridCount, setGridCount] = useState<number>(0);
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [favoritesExpanded, setFavoritesExpanded] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const allStocks: StockOption[] = Array.from({ length: 25 }, (_, i) => ({
    label: `Company ${i + 1} (CMP${i + 1})`,
    value: `CMP${i + 1}`,
  }));

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleFavorites = () => setFavoritesExpanded((prev) => !prev);

  const handleStockToggle = (value: string) => {
    if (selectedStocks.includes(value)) {
      // Deselect if already selected
      const updated = selectedStocks.filter((s) => s !== value);
      setSelectedStocks(updated);
      setGridCount(updated.length);
    } else if (selectedStocks.length < 4) {
      // Select if not already selected
      const updated = [...selectedStocks, value];
      setSelectedStocks(updated);
      setGridCount(updated.length);
    }
  };


  const handleStockRemove = (stock: string) => {
    const updated = selectedStocks.filter((s) => s !== stock);
    setSelectedStocks(updated);
    setGridCount(updated.length);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/users/stocks/?guids=21377984-fe94-445c-934b-3b3e0c1cdabe&guids=7951d219-4fdc-4f51-a21e-bf6000b4421f&guids=bcf7252b-c427-4cbf-8274-f892ceb5b0ed"
        );
        setData(response.data);
        setIsCollapsed(false)
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-teal-50 flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        <div className="flex h-full w-full gap-2 md:gap-4">
          <div
            className={`${isCollapsed ? "w-12 md:w-16" : "w-20 sm:w-40 md:w-72"} h-full bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 backdrop-blur-xl border border-gray-200 rounded-lg p-2 flex flex-col text-gray-700 shadow-lg transition-all duration-300 relative flex-shrink-0 overflow-hidden`}
          >
            <button
              onClick={toggleCollapse}
              className={`${isCollapsed ? "right-3" : "right-1"} absolute top-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1 z-10 shadow transition-transform duration-300`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="#115e59" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={5}
                  d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>

            <div
              className={`mt-10 px-2 flex flex-col gap-4 w-full transition-all duration-500 ease-in-out ${isCollapsed ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}
            >
              <div className="transition-all duration-[4200ms] delay-[300ms] ease-out animate-fade-in space-y-2 pb-8">
                <h3 className="text-md text-gray-800 font-semibold pb-2">Look for stocks you’re interested in</h3>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stocks..."
                  className="w-full px-4 py-2 rounded-full shadow-md border border-gray-200 bg-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-2 pt-2 border-b border-gray-300 animate-fade-in transition-all duration-[4200ms] delay-[300ms] pb-8">
                <h3 className="text-md text-gray-800 font-semibold pb-2">Add up to 4 of your favourite stocks</h3>
                <button
                  onClick={toggleFavorites}
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-medium text-sm py-2 px-4 rounded-full shadow transition-all"
                >
                  {favoritesExpanded ? "Hide Favorite Stocks" : "Show Favorite Stocks"}
                </button>

                {favoritesExpanded && (
                  <div className="mt-2 flex flex-col gap-2 pr-1 pt-2 overflow-y-auto scrollbar-none">
                    {stockOptions
                      .filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
                      .map((stock) => {
                        const isSelected = selectedStocks.includes(stock.value);
                        return (
                          <div
                            key={stock.value}
                            onClick={() => handleStockToggle(stock.value)}
                            className={`p-2 rounded-lg flex justify-between items-center shadow-sm transition-all duration-300 cursor-pointer ${isSelected
                              ? "bg-gradient-to-r from-cyan-400 to-teal-300 text-green-900"
                              : "bg-gradient-to-r from-cyan-200 to-teal-100 text-gray-800"
                              }`}
                          >
                            <span className="text-sm font-medium w-full">{stock.label}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-b border-gray-300 animate-fade-in transition-all duration-[4200ms] delay-[300ms] pb-8">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-medium text-sm py-2 px-4 rounded-full shadow transition-all"
                >
                  Discover More Stocks
                </button>
              </div>
            </div>
          </div>

          <div className="flex-grow h-full overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                <img src="/empty-state.svg" alt="No stocks" className="w-48 h-48 mb-6 opacity-80" />
                <h2 className="text-xl font-semibold mb-2">No stocks selected</h2>
                <p className="mb-6">Use the panel to add stocks you want to track.</p>
                <button
                  onClick={() => setFavoritesExpanded(true)}
                  className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-6 rounded-full shadow"
                >
                  Start Adding Stocks
                </button>
              </div>
            ) : error || (selectedStocks.length === 0) ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                <img src="/empty-state.svg" alt="No stocks" className="w-48 h-48 mb-6 opacity-80" />
                <h2 className="text-xl font-semibold mb-2">No stocks selected</h2>
                <p className="mb-6">Use the panel to add stocks you want to track.</p>
                <button
                  onClick={() => setFavoritesExpanded(true)}
                  className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-6 rounded-full shadow"
                >
                  Start Adding Stocks
                </button>
              </div>
            ) : (
              <GridLayout
                gridCount={gridCount}
                data={data.filter((_, i) => i < selectedStocks.length)}
              />
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full space-y-4 overflow-y-auto max-h-[80vh] relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Explore More Stocks</h2>
            <div className="space-y-2">
              {allStocks.map((stock) => {
                const isSelected = selectedStocks.includes(stock.value);
                return (
                  <div
                    key={stock.value}
                    className={` p-2 rounded-lg flex justify-between items-center shadow-sm transition-all duration-300 cursor-pointer ${isSelected
                      ? "bg-gradient-to-r from-cyan-200 to-teal-200"
                      : "bg-gray-100"
                      }`}
                    onClick={() => handleStockToggle(stock.value)}
                  >
                    <span className={`text-sm ${isSelected ? "text-green-800" : "text-gray-800"}`}>{stock.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;