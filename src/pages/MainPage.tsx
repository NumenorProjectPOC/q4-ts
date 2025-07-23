import React, { useState, useEffect, useRef } from "react";
import GridLayout from "../components/GridComponent";
import Toast from "../components/ui/Toast";
import ConfirmationPopup from "../components/ui/ConfirmationPopup";
import ShareModal from "../components/ui/ShareModal";
import RightSidebar from "../components/RightSidebar";
import DashboardSwitcher from "../components/ui/DashboardSwitcher";
import { fetchFavoriteStocks, fetchMonitoredStockData, removeFavoriteStock, setStockAlert, toggleStockMonitoring } from "../services/quantiforeApi";
import { Monitor, Trash2, Share2, Bell, Search, Sparkles } from "lucide-react";
import QuickStockPreviewModal from "../components/ui/QuickStockPreviewModal";
import { formatStockName } from "../utils/utility";
import { AnimatePresence, motion } from "framer-motion";
import AISearchComponent from '../components/AISearchComponent';

interface StockOption {
  label: string;
  value: string;
  guid: string;
}

type StockAPIResponse = {
  stock_data: any[];
  upper_threshold: number;
  lower_threshold: number;
};

const MainPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [gridCount, setGridCount] = useState<number>(0);
  const [data, setData] = useState<(StockAPIResponse | null)[]>([]);
  const [monitoredStockLoading, setMonitoredStockLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [initialMonitoredStocks, setInitialMonitoredStocks] = useState<string[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [search, setSearch] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [stockToShare, setStockToShare] = useState<StockOption | null>(null);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState<boolean>(true);
  const [quickPreviewStock, setQuickPreviewStock] = useState<StockOption | null>(null);
  const [alertModalStock, setAlertModalStock] = useState<StockOption | null>(null);
  const [upperThreshold, setUpperThreshold] = useState("");
  const [lowerThreshold, setLowerThreshold] = useState("");
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning", message: string } | null>(null);
  const [confirmPopup, setConfirmPopup] = useState<{ stock: StockOption | null }>({ stock: null });

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleFavorites = () => setFavoritesExpanded((prev) => !prev);

  const handleStockToggle = async (value: string, label: string) => {
    const stock = stockOptions.find(s => s.value === value);
    if (!stock) return;

    if (!selectedStocks.includes(value) && selectedStocks.length >= 4) {
      setToast({
        type: "warning",
        message: "You can monitor a maximum of 4 stocks at a time."
      });
      return;
    }

    const isMonitored = selectedStocks.includes(value);
    const newMonitorState = !isMonitored;
    try {
      // Show loader immediately
      setMonitoredStockLoading(prev => ({ ...prev, [value]: true }));

      if (!isMonitored) {
        // We're trying to monitor a new stock: show a placeholder graph by incrementing grid
        setGridCount(prev => prev + 1);
      } else {
        // Optimistically remove from UI immediately
        setSelectedStocks(prev => prev.filter(v => v !== value));
        setData(prev => prev.filter((_, idx) => selectedStocks[idx] !== value));
        setGridCount(prev => Math.max(0, prev - 1));
      }

      // Backend update
      await toggleStockMonitoring(stock.guid, newMonitorState);

      // Fetch monitored data if newly monitored
      if (newMonitorState) {
        const result = await fetchMonitoredStockData([stock.guid]);
        if (result && result.length > 0) {
          const formatted: StockAPIResponse = {
            stock_data: result[0],
            upper_threshold: (result[0] as { upper_threshold?: number }).upper_threshold || 0,
            lower_threshold: (result[0] as { lower_threshold?: number }).lower_threshold || 0,
          };
          setSelectedStocks(prev => [...prev, value]);
          setData(prev => [...prev, formatted]);
        }
        setToast({ type: "success", message: `${label} is now being monitored.` });
      } else {
        setToast({ type: "warning", message: `${label} removed from monitoring.` });
      }

      // Refresh favorites + session cache
      const favorites = await fetchFavoriteStocks();
      const formattedFavorites = favorites.map(fav => ({
        ...fav,
        label: formatStockName(fav.label),
        guid: fav.guid,
      }));
      sessionStorage.setItem("favorite_stocks", JSON.stringify(formattedFavorites));
      setStockOptions(formattedFavorites);
    } catch (err) {
      console.error("Failed to toggle stock monitoring:", err);

      // Revert optimistic UI changes
      if (!isMonitored) {
        // Revert graph add
        setGridCount(prev => Math.max(0, prev - 1));
      } else {
        // Re-add graph
        setSelectedStocks(prev => [...prev, value]);
        const result = await fetchMonitoredStockData([stock!.guid]);
        if (result && result.length > 0) {
          const formatted: StockAPIResponse = {
            stock_data: result[0],
            upper_threshold: (result[0] as { upper_threshold?: number }).upper_threshold || 0,
            lower_threshold: (result[0] as { lower_threshold?: number }).lower_threshold || 0,
          };
          setData(prev => [...prev, formatted]);
          setGridCount(prev => prev + 1);
        }
      }

      setToast({
        type: "error",
        message: `Could not ${newMonitorState ? "monitor" : "unmonitor"} ${label}`,
      });
    } finally {
      setMonitoredStockLoading(prev => ({ ...prev, [value]: false }));
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

  const handleSetAlert = async () => {
    if (!alertModalStock) return;

    const hasUpper = upperThreshold.trim() !== "";
    const hasLower = lowerThreshold.trim() !== "";

    const upper = hasUpper ? parseFloat(upperThreshold) : null;
    const lower = hasLower ? parseFloat(lowerThreshold) : null;

    if ((hasUpper && isNaN(upper!)) || (hasLower && isNaN(lower!))) {
      setToast({ type: "error", message: "Please enter valid threshold values." });
      return;
    }

    if (!hasUpper && !hasLower) {
      setToast({ type: "error", message: "Please enter at least one threshold." });
      return;
    }

    try {
      await setStockAlert(alertModalStock.guid, upper ?? 0, lower ?? 0); // backend expects numbers
      setToast({ type: "success", message: `Alert set for ${alertModalStock.label}.` });
    } catch (error) {
      console.error("Error setting alert:", error);
      setToast({ type: "error", message: `Failed to set alert for ${alertModalStock.label}.` });
    } finally {
      setAlertModalStock(null);
      setUpperThreshold("");
      setLowerThreshold("");
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

          // Fetch monitoring data if any cached favorites are monitored
          const monitoredGuids = parsed.filter((s: any) => s.monitored).map((s: any) => s.guid);
          const monitoredvalues = parsed.filter((s: any) => s.monitored).map((s: any) => s.value);
          if (monitoredGuids.length > 0) {
            await fetchInitialMonitoredStocks(monitoredGuids, monitoredvalues);
            setHasFetchedInitialData(true);
          }

          return;
        }

        // Fetch from API
        const favorites = await fetchFavoriteStocks();
        const formattedFavorites = favorites.map(stock => ({
          ...stock,
          label: formatStockName(stock.label),
          guid: stock.guid,
        }));

        sessionStorage.setItem("favorite_stocks", JSON.stringify(formattedFavorites));
        setStockOptions(formattedFavorites);
        console.log("Fetched and cached favorites:", formattedFavorites);

        // Efficiently extract monitored guids and fetch monitoring data
        const monitoredGuids = formattedFavorites
          .filter((s: any) => s.monitored)
          .map((s: any) => s.guid);
        const monitoredvalues = formattedFavorites
          .filter((s: any) => s.monitored)
          .map((s: any) => s.value);
        if (monitoredGuids.length > 0) {
          await fetchInitialMonitoredStocks(monitoredGuids, monitoredvalues);
          setHasFetchedInitialData(true);
        }
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

  const fetchInitialMonitoredStocks = async (guids: string[], values: string[]) => {
    try {
      const stockDataList = await fetchMonitoredStockData(guids);
      console.log("Fetched monitored stock data:", stockDataList);

      const resultData = guids.map(guid => {
        const match = stockDataList.find((d: any) => d.guid === guid);
        if (!match) return null;
        return {
          stock_data: match,
          upper_threshold: (match as { upper_threshold?: number }).upper_threshold || 0,
          lower_threshold: (match as { lower_threshold?: number }).lower_threshold || 0,
        } as StockAPIResponse;
      });

      setSelectedStocks(values);
      setGridCount(guids.length);
      setData(resultData);

      const loadingMap = Object.fromEntries(guids.map(g => [g, false]));
      setMonitoredStockLoading(loadingMap);

      console.log("Fetched monitored data for initial stocks:", resultData);
    } catch (error) {
      console.error("Failed to load monitored stock data:", error);
      setToast({
        type: "error",
        message: "Failed to load monitored stocks.",
      });
    }
  };

  // useEffect(() => {
  //   if (selectedStocks.length === 0 || hasFetchedInitialData) return;
  //   // const selectedGuids = stockOptions
  //   //   .filter((s) => selectedStocks.includes(s.value))
  //   //   .map((s) => s.guid);

  //   const fetchData = async () => {
  //     // setMonitoredStockLoading(prev => ({ ...prev, globalLoading: true }))
  //     const guidMap = stockOptions.reduce((acc, stock) => {
  //       acc[stock.value] = stock.guid;
  //       return acc;
  //     }, {} as Record<string, string>);

  //     const newDataArray: (StockAPIResponse | null)[] = [];

  //     for (const stockValue of selectedStocks) {
  //       const guid = guidMap[stockValue];

  //       try {
  //         const stockData = await fetchMonitoredStockData([guid]);
  //         if (stockData && stockData.length > 0) {
  //           newDataArray.push({
  //             stock_data: stockData[0],
  //             upper_threshold: (stockData[0] as { upper_threshold?: number })?.upper_threshold || 0,
  //             lower_threshold: (stockData[0] as { lower_threshold?: number })?.lower_threshold || 0,
  //           } as StockAPIResponse); // ensure type compatibility
  //         } else {
  //           newDataArray.push(null);
  //         }
  //       } catch (err) {
  //         newDataArray.push(null);
  //       } finally {
  //         setMonitoredStockLoading(prev => ({ ...prev, [stockValue]: false }));
  //       }
  //     }
  //     setData(prev => [...prev, ...newDataArray]);
  //   };

  //   fetchData();

  // }, [selectedStocks, stockOptions]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 overflow-x-hidden">
      {/* Dashboard Switching Section */}
      <DashboardSwitcher />
      <div className="bg-teal-50 flex flex-col h-screen w-screen overflow-hidden">
        <div className="shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-5">
            <img src="/qf-logo0.1.svg" alt="Quantifore Logo" className="h-8 w-auto mt-3" />
          </div>
        </div>
        <div className="flex-1 p-2 md:p-4 overflow-hidden">
          <div className="flex h-full w-full gap-2 md:gap-4">
            <div
              className={`${isCollapsed ? "w-12 md:w-16" : "w-20 sm:w-40 md:w-80"} h-full bg-gradient-to-br from-white/40 via-teal-200/30 to-white/20 border border-gray-200 rounded-lg flex flex-col shadow-lg transition-all duration-300 relative flex-shrink-0 overflow-hidden`}
            >
              <button
                onClick={toggleCollapse}
                className={`${isCollapsed ? "right-2" : "right-2"} absolute top-3 bg-white hover:bg-gray-50 rounded-full p-2 z-10 shadow-lg border border-gray-200 transition-all duration-300`}
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
                className={`mt-10 px-2 flex flex-col gap-4 w-full transition-all duration-500 ease-in-out rounded-lg ${isCollapsed ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}
              >
                <div className="space-y-3 pb-4">
                  <div className="mt-4">
                    <button
                      onClick={() => setIsAiSearchOpen(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-teal-200/50 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-teal-500" />
                          <span className="text-sm font-medium text-teal-700">Search for Stocks</span>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium text-gray-500 tracking-wide">Selected Stocks</h3>
                    <button
                      onClick={toggleFavorites}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition"
                    >
                      {favoritesExpanded ? "Hide" : "Show"}
                    </button>
                  </div>

                  {favoritesExpanded && (
                    <div className="mt-2 flex flex-col gap-2 pr-1 pt-2 overflow-y-auto scrollbar-none">
                      {isFavoritesLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-20 rounded-lg bg-gray-200/60 animate-pulse" />
                        ))
                      ) : stockOptions.length > 0 ? (
                        stockOptions
                          .filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
                          .map((stock) => {
                            const isSelected = selectedStocks.includes(stock.value);
                            return (
                              <div
                                key={stock.value}
                                className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer text-gray-800 ${isSelected
                                  ? "bg-gradient-to-r from-blue-200 to-cyan-200 shadow-md border-2 border-blue-300"
                                  : "bg-gradient-to-r from-cyan-100 to-teal-100 border-2 border-transparent hover:shadow-lg"
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      {/* Changed text color for better contrast on gradients */}
                                      <span className="text-sm font-medium text-gray-900 truncate">
                                        {stock.label}
                                      </span>
                                      {isSelected && (
                                        <div className="flex items-center space-x-1">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span className="text-xs text-green-700 font-medium">Active</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-xs text-gray-600">Latest Value</span>
                                      <span className="text-xs font-medium text-gray-700">--</span>
                                    </div>
                                  </div>

                                  {/* --- Adjusted Action Icons for better visibility/interaction --- */}
                                  <div className={`flex items-center space-x-1 transition-opacity ${
                                    // Make actions visible if selected, or on hover
                                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}>
                                    <button
                                      onClick={() => handleStockToggle(stock.value, stock.label)}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-green-600 hover:bg-green-100/50 transition-colors"
                                      title="Monitor"
                                    >
                                      <Monitor size={15} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setStockToShare(stock);
                                        setShowShareModal(true);
                                      }}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-100/50 transition-colors"
                                      title="Share"
                                    >
                                      <Share2 size={15} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAlertModalStock(stock);
                                        const matched = data.find((d, idx) => selectedStocks[idx] === stock.value);
                                        if (matched) {
                                          setUpperThreshold(matched.upper_threshold.toString());
                                          setLowerThreshold(matched.lower_threshold.toString());
                                        } else {
                                          setUpperThreshold("");
                                          setLowerThreshold("");
                                        }
                                      }}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-yellow-600 hover:bg-yellow-100/70 transition-colors"
                                      title="Set Alert"
                                    >
                                      <Bell size={15} />
                                    </button>
                                    <button
                                      onClick={() => setConfirmPopup({ stock })}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100/70 transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
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
                  gridCount={selectedStocks.length}
                  data={data.filter((_, i) => i < selectedStocks.length).map(item => item ? item.stock_data : null)}
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
          {/* Status Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Active Stocks: <span className="font-medium">{selectedStocks.length}</span></span>
                <span className="text-gray-600">Favorites: <span className="font-medium">{stockOptions.length}</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Live Data Connected</span>
              </div>
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

        {alertModalStock && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4 relative">
              <button
                onClick={() => setAlertModalStock(null)}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition"
              >
                ✕
              </button>
              <h2 className="text-lg font-semibold text-gray-800">
                Set Alert for <span className="text-teal-700">{alertModalStock.label}</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Upper Threshold</label>
                  <input
                    type="number"
                    value={upperThreshold}
                    onChange={(e) => setUpperThreshold(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-teal-400 outline-none"
                    placeholder="e.g., 120"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Lower Threshold</label>
                  <input
                    type="number"
                    value={lowerThreshold}
                    onChange={(e) => setLowerThreshold(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-teal-400 outline-none"
                    placeholder="e.g., 80"
                  />
                </div>
                <button
                  className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md font-medium shadow"
                  onClick={handleSetAlert}
                >
                  Save Alert
                </button>
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
            title="Remove Favorite Stock?"
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

        <AISearchComponent
          isOpen={isAiSearchOpen}
          onClose={() => setIsAiSearchOpen(false)}
          onStockFound={(stockData) => {
            console.log("Stock found:", stockData);
            // You can add logic here, e.g., close modal after a stock is added
          }}
          onAddToFavorites={(stockData) => {
            // Handle adding stock to favorites
            // This is where you would call your API to add the favorite
            // and then refresh your favorites list.
            console.log("Adding to favorites:", stockData);
          }}
          onShowToast={(type, message) => {
            setToast({ type, message });
          }}
        />

        {/* Menu button*/}
        <motion.button
          className="fixed top-5 right-8 z-[60] p-2 rounded-full bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white/90 transition-all shadow-lg hover:scale-105"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPanelOpen ? "Close menu" : "Open menu"}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: isPanelOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              animate={{
                d: isPanelOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.svg>
        </motion.button>

        {/* Backdrop and Sidebar */}
        <AnimatePresence>
          {isPanelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={() => setIsPanelOpen(false)}
              />
              <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
            </>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default MainPage;