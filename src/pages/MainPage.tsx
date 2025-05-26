import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import GridLayout from "../components/GridComponent";
import Toast from "../components/ui/Toast";
import ConfirmationPopup from "../components/ui/ConfirmationPopup";
import ShareModal from "../components/ui/ShareModal";
import { fetchFavoriteStocks, fetchMonitoredStockData, removeFavoriteStock } from "../services/quantiforeApi";
import { Monitor, Trash2, Share2 } from "lucide-react";
import QuickStockPreviewModal from "../components/ui/QuickStockPreviewModal";
import { formatStockName } from "../utils/utility";


interface StockOption {
  label: string;
  value: string;
  guid: string;
}

const MainPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [gridCount, setGridCount] = useState<number>(0);
  const [data, setData] = useState<(any[] | null)[]>([]);
  const [monitoredStockLoading, setMonitoredStockLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [search, setSearch] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [stockToShare, setStockToShare] = useState<StockOption | null>(null);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState<boolean>(true);
  const [quickPreviewStock, setQuickPreviewStock] = useState<StockOption | null>(null);


  const [toast, setToast] = useState<{ type: "success" | "error" | "warning", message: string } | null>(null);
  const [confirmPopup, setConfirmPopup] = useState<{ stock: StockOption | null }>({ stock: null });

  // const allStocks: StockOption[] = Array.from({ length: 25 }, (_, i) => ({
  //   label: `Company ${i + 1} (CMP${i + 1})`,
  //   value: `CMP${i + 1}`,
  //   guid: `00000000-0000-0000-0000-0000000000${i + 10}`,
  // }));

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleFavorites = () => setFavoritesExpanded((prev) => !prev);

  const handleStockToggle = (value: string, label: string) => {
    if (selectedStocks.includes(value)) {
      const updated = selectedStocks.filter((s) => s !== value);
      setSelectedStocks(updated);
      setGridCount(updated.length);
      setToast({ type: "warning", message: `${label} removed from monitoring.` });
    } else if (selectedStocks.length < 4) {
      setMonitoredStockLoading(prev => ({ ...prev, [value]: true }));
      const updated = [...selectedStocks, value];
      setSelectedStocks(updated);
      setGridCount(updated.length);
      setToast({ type: "success", message: `${label} is now being monitored.` });
    } else {
      setToast({ type: "error", message: "You can only monitor up to 4 stocks." });
    }
  };

  const handleStockRemove = async (stock: StockOption) => {
    try {
      // Remove from backend
      await removeFavoriteStock(stock.guid);

      // Remove from local state
      const updated = stockOptions.filter((s) => s.guid !== stock.guid);
      setStockOptions(updated);

      // Show success toast
      setToast({
        type: "error",
        message: `${stock.label} removed from favorites.`,
      });
    } catch (error) {
      console.error("Failed to remove stock:", error);
      setToast({
        type: "error",
        message: `Failed to remove ${stock.label} from favorites.`,
      });
    }
  };

  // const handleShareToUser = (email: string, stock: StockOption) => {
  //   //api
  //   console.log(`Shared ${stock.label} with ${email}`);
  //   setToast({
  //     type: "success",
  //     message: `Shared ${stock.label} with ${email}`,
  //   });  
  //   setShowShareModal(false);
  // };

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsFavoritesLoading(true);
  
        // Check cache first
        const cached = sessionStorage.getItem("favorite_stocks");
        if (cached) {
          const parsed = JSON.parse(cached);
          setStockOptions(parsed);
          console.log("Loaded favorites from sessionStorage:", parsed);
          return;
        }
  
        // Fetch from API if not cached
        const favorites = await fetchFavoriteStocks();
        const formattedFavorites = favorites.map(stock => ({
          ...stock,
          label: formatStockName(stock.label),
          guid: stock.guid,
        }));
  
        // Store in cache
        sessionStorage.setItem("favorite_stocks", JSON.stringify(formattedFavorites));
        setStockOptions(formattedFavorites);
        console.log("Fetched and cached favorites:", formattedFavorites);
      } catch (error) {
        console.error("Failed to fetch favorite stocks", error);
        setToast({
          type: "error",
          message: "Could not load your favorite stocks. Please try again.",
        });
      } finally {
        setIsFavoritesLoading(false);
      }
    };
  
    loadFavorites();
  }, []);
  

  useEffect(() => {
    if (selectedStocks.length === 0) return;

    // const selectedGuids = stockOptions
    //   .filter((s) => selectedStocks.includes(s.value))
    //   .map((s) => s.guid);

    const fetchData = async () => {
      const guidMap = stockOptions.reduce((acc, stock) => {
        acc[stock.value] = stock.guid;
        return acc;
      }, {} as Record<string, string>);

      const newDataArray: (any[] | null)[] = [];

      for (const stockValue of selectedStocks) {
        const guid = guidMap[stockValue];

        try {
          const stockData = await fetchMonitoredStockData([guid]);
          newDataArray.push(stockData[0] || []);
        } catch (err) {
          newDataArray.push(null);
        } finally {
          setMonitoredStockLoading(prev => ({ ...prev, [stockValue]: false }));
        }
      }
      setData(newDataArray);
    };

    fetchData();

  }, [selectedStocks, stockOptions]);

  return (
    <div className="bg-teal-50 flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        <div className="flex h-full w-full gap-2 md:gap-4">
          <div
            className={`${isCollapsed ? "w-12 md:w-16" : "w-20 sm:w-40 md:w-72"} h-full bg-gradient-to-br from-white/30 via-teal-300/30 to-white/10 backdrop-blur-xl border border-gray-200 rounded-lg p-2 flex flex-col text-gray-700 shadow-xl transition-all duration-300 relative flex-shrink-0 overflow-hidden`}
          >
            <button
              onClick={toggleCollapse}
              className={`${isCollapsed ? "right-3" : "right-1"} absolute top-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1 z-10 shadow-xl transition-transform duration-300`}
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
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-md text-gray-800 font-semibold">Favorite stocks</h3>
                  <button
                    onClick={toggleFavorites}
                    className="text-xs text-gray-500 hover:text-teal-600 underline transition"
                  >
                    {favoritesExpanded ? "Hide" : "Show"}
                  </button>
                </div>
                {/* <button
                  onClick={toggleFavorites}
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-medium text-sm py-2 px-4 rounded-full shadow transition-all"
                >
                  {favoritesExpanded ? "Hide Favorite Stocks" : "Show Favorite Stocks"}
                </button> */}

                {favoritesExpanded && (
                  <div className="mt-2 flex flex-col gap-2 pr-1 pt-2 overflow-y-auto scrollbar-none">
                    {isFavoritesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-md bg-gray-200/60 animate-pulse" />
                      ))
                    ) : stockOptions.length > 0 ? (
                      stockOptions
                        .filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
                        .map((stock) => {
                          const isSelected = selectedStocks.includes(stock.value);
                          return (
                            <div
                              key={stock.value}
                              className={`p-2 pl-3 pr-2 rounded-lg flex justify-between items-center shadow-sm transition-all duration-300 ${isSelected
                                ? "bg-gradient-to-r from-cyan-400 to-teal-300 text-green-900"
                                : "bg-gradient-to-r from-cyan-200 to-teal-100 text-gray-800"
                                }`}
                            >
                              <span
                                onClick={() => setQuickPreviewStock(stock)}
                                className="text-sm font-medium truncate cursor-pointer hover:underline hover:text-teal-600"
                                title="Click to preview"
                              >
                                {stock.label}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStockToggle(stock.value, stock.label)}
                                  className={`p-1 rounded-full hover:bg-teal-600/30 transition ${isSelected ? "text-green-800" : "text-gray-600"
                                    }`}
                                  title="Monitor"
                                >
                                  <Monitor size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setStockToShare(stock);
                                    setShowShareModal(true);
                                  }}
                                  className="p-1 rounded-full hover:bg-blue-600/30 text-gray-600 transition"
                                  title="Share"
                                >
                                  <Share2 size={16} />
                                </button>
                                <button
                                  onClick={() => setConfirmPopup({ stock })}
                                  className="p-1 rounded-full hover:bg-red-600/30 text-gray-600 transition"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-sm text-gray-500">No favorite stocks found.</p>
                    )}
                  </div>
                )}

              </div>

              {/* <div className="space-y-2 pt-2 border-b border-gray-300 animate-fade-in transition-all duration-[4200ms] delay-[300ms] pb-8">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-medium text-sm py-2 px-4 rounded-full shadow transition-all"
                >
                  Discover More Stocks
                </button>
              </div> */}
            </div>
          </div>

          <div className="flex-grow h-full overflow-hidden relative">
            {error || selectedStocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                <img src="/empty-state.svg" alt="No stocks" className="w-48 h-48 mb-6 opacity-80" />
                <h2 className="text-xl font-semibold mb-2">No stocks selected</h2>
                <p className="mb-6">Use the panel to add stocks you want to track.</p>
                <button
                  onClick={() => {
                    setFavoritesExpanded(true);
                    setIsCollapsed(false);
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-6 rounded-full shadow"
                >
                  Start Adding Stocks
                </button>
              </div>
            ) : (
              <GridLayout
                gridCount={gridCount}
                data={data.filter((_, i) => i < selectedStocks.length)}
                selectedStocks={selectedStocks}
                stockOptions={stockOptions}
                loadingMap={selectedStocks.reduce((acc, stock, idx) => {
                  acc[idx] = monitoredStockLoading[stock] || false;
                  return acc;
                }, {} as Record<number, boolean>)}
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
              {stockOptions.map((stock) => {
                const isSelected = selectedStocks.includes(stock.value);
                return (
                  <div
                    key={stock.value}
                    className={`p-2 rounded-lg flex justify-between items-center shadow-sm transition-all duration-300 cursor-pointer ${isSelected ? "bg-gradient-to-r from-cyan-200 to-teal-200" : "bg-gray-100"
                      }`}
                    onClick={() => {
                      handleStockToggle(stock.value, stock.label);
                    }}
                  >
                    <span className={`text-sm ${isSelected ? "text-green-800" : "text-gray-800"}`}>
                      {stock.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Popup */}
      {confirmPopup.stock && (
        <ConfirmationPopup
          title="Remove Favorite Stock"
          message={`Are you sure you want to remove ${confirmPopup.stock.label} from your favorites?`}
          onConfirm={() => {
            handleStockRemove(confirmPopup.stock!);
            setConfirmPopup({ stock: null });
          }}
          onCancel={() => setConfirmPopup({ stock: null })}
        />
      )}
      {showShareModal && stockToShare && (
        <ShareModal
          isStock={true}
          itemLabel={stockToShare.label}
          itemGuid={stockToShare.guid}
          onClose={() => {
            setStockToShare(null);
            setShowShareModal(false);
          }}
        />
      )}
      {quickPreviewStock && (
        <QuickStockPreviewModal
          stock={quickPreviewStock}
          onClose={() => setQuickPreviewStock(null)}
        />
      )}

    </div>
  );
};

export default MainPage;