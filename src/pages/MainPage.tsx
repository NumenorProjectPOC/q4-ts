import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Monitor,
  Trash2,
  Share2,
  Bell,
  Search,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  TrendingUp,
} from "lucide-react";

import Toast from "../components/ui/Toast";
import ConfirmationPopup from "../components/ui/ConfirmationPopup";
import ShareModal from "../components/ui/ShareModal";
import RightSidebar from "../components/RightSidebar";
import AISearchComponent from "../components/AISearchComponent";
import QuickStockPreviewModal from "../components/ui/QuickStockPreviewModal";
import GraphMonitorComponent from "../components/MonitoringGraph";
import Dock from "../components/ui/Dock";

import {
  fetchFavoriteStocks,
  fetchMonitoredStockData,
  removeFavoriteStock,
  setStockAlert,
  toggleStockMonitoring,
} from "../services/quantiforeApi";
import { formatStockName } from "../utils/utility";

// Types
interface DataOption {
  label: string;
  value: string;
  guid: string;
  monitored?: boolean;
}

type DataAPIResponse = {
  stock_data: any;
  upper_threshold: number;
  lower_threshold: number;
};

const COLLAPSED_W = 64;   // 16 (w-16) * 4
const EXPANDED_W = 384;   // 96 (w-96) * 4
const SIDE_GAP = 24;      // left-6 * 4
const RIGHT_GAP = 24;     // mirror right padding for symmetry

const MainPage: React.FC = () => {
  // Data state
  const [dataOptions, setDataOptions] = useState<DataOption[]>([]);
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [data, setData] = useState<(DataAPIResponse | null)[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [monitoredDataLoading, setMonitoredDataLoading] = useState<Record<string, boolean>>({});
  const [activeDataIndex, setActiveDataIndex] = useState<number>(0);

  // UI state
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  // Modals and toasts
  const [showShareModal, setShowShareModal] = useState(false);
  const [dataToShare, setDataToShare] = useState<DataOption | null>(null);
  const [alertModalData, setAlertModalData] = useState<DataOption | null>(null);
  const [upperThreshold, setUpperThreshold] = useState("");
  const [lowerThreshold, setLowerThreshold] = useState("");
  const [confirmPopup, setConfirmPopup] = useState<{ data: DataOption | null }>({ data: null });
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [toastSocket, setToastSocket] = useState<{ type: "completed" | "error" | "warning"; message: string } | null>(null);
  const [quickPreviewData, setQuickPreviewData] = useState<DataOption | null>(null);

  const navigate = useNavigate();

  // Track the effective sidebar width so layout can react without jank
  const sidebarWidth = isLeftSidebarCollapsed ? COLLAPSED_W : EXPANDED_W;
  const contentLeftOffset = sidebarWidth + SIDE_GAP; // left margin for content
  const contentRightOffset = RIGHT_GAP;

  // Bump a key to force GraphMonitorComponent to re-measure when sidebar width changes
  const graphLayoutKey = useMemo(() => (isLeftSidebarCollapsed ? "collapsed" : "expanded"), [isLeftSidebarCollapsed]);

  // Utils
  const handleGoToDashboard = (targetTab?: "monitoring" | "visualization") => {
    if (targetTab) navigate(`/${targetTab}`);
  };

  const refreshFavoritesFromStorage = () => {
    const cached = sessionStorage.getItem("favorite_stocks");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDataOptions(parsed);
      } catch {
        // ignore
      }
    }
  };

  // Load favorites and monitored data
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsFavoritesLoading(true);
        const cached = sessionStorage.getItem("favorite_stocks");
        if (cached) {
          const parsed = JSON.parse(cached);
          setDataOptions(parsed);
          const monitoredGuids = parsed.filter((d: any) => d.monitored).map((d: any) => d.guid);
          const monitoredValues = parsed.filter((d: any) => d.monitored).map((d: any) => d.value);
          if (monitoredGuids.length > 0) {
            await fetchInitialMonitoredData(monitoredGuids, monitoredValues);
          }
          return;
        }

        const favorites = await fetchFavoriteStocks();
        const formatted = favorites.map((stock: any) => ({
          ...stock,
          label: formatStockName(stock.label),
          guid: stock.guid,
        }));
        sessionStorage.setItem("favorite_stocks", JSON.stringify(formatted));
        setDataOptions(formatted);

        const monitoredGuids = formatted.filter((d: any) => d.monitored).map((d: any) => d.guid);
        const monitoredValues = formatted.filter((d: any) => d.monitored).map((d: any) => d.value);
        if (monitoredGuids.length > 0) {
          await fetchInitialMonitoredData(monitoredGuids, monitoredValues);
        }
      } catch {
        setToast({ type: "error", message: "Could not load favorites. Please try again." });
      } finally {
        setIsFavoritesLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const fetchInitialMonitoredData = async (guids: string[], values: string[]) => {
    try {
      const dataList = await fetchMonitoredStockData(guids);
      const resultData = guids.map((guid) => {
        const match = dataList.find((d: any) => d.guid === guid);
        if (!match) return null;
        return {
          stock_data: match,
          upper_threshold: (match as { upper_threshold?: number }).upper_threshold || 0,
          lower_threshold: (match as { lower_threshold?: number }).lower_threshold || 0,
        } as DataAPIResponse;
      });

      setSelectedData(values);
      setData(resultData);
      const loadingMap = Object.fromEntries(guids.map((g) => [g, false]));
      setMonitoredDataLoading(loadingMap);
    } catch {
      setToast({ type: "error", message: "Failed to load monitored data." });
    }
  };

  // Actions
  const handleDataToggle = async (value: string, label: string) => {
    const dataItem = dataOptions.find((d) => d.value === value);
    if (!dataItem) return;

    if (!selectedData.includes(value) && selectedData.length >= 4) {
      setToast({ type: "warning", message: "You can monitor a maximum of 4 data sources at a time." });
      return;
    }

    const isMonitored = selectedData.includes(value);
    const newMonitorState = !isMonitored;

    try {
      setMonitoredDataLoading((prev) => ({ ...prev, [value]: true }));

      if (!isMonitored) {
        const result = await fetchMonitoredStockData([dataItem.guid]);
        if (result && result.length > 0) {
          const formatted: DataAPIResponse = {
            stock_data: result[0],
            upper_threshold: (result[0] as { upper_threshold?: number }).upper_threshold || 0,
            lower_threshold: (result[0] as { lower_threshold?: number }).lower_threshold || 0,
          };
          setSelectedData((prev) => [...prev, value]);
          setData((prev) => [...prev, formatted]);
          setActiveDataIndex(selectedData.length);
        }
      } else {
        const indexToRemove = selectedData.findIndex((d) => d === value);
        setSelectedData((prev) => prev.filter((d) => d !== value));
        setData((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        if (activeDataIndex === indexToRemove) {
          setActiveDataIndex(0);
        } else if (activeDataIndex > indexToRemove) {
          setActiveDataIndex((prev) => prev - 1);
        }
      }

      await toggleStockMonitoring(dataItem.guid, newMonitorState);

      setToast({
        type: newMonitorState ? "success" : "warning",
        message: newMonitorState ? `${label} is now being monitored.` : `${label} removed from monitoring.`,
      });

      const favorites = await fetchFavoriteStocks();
      const formattedFavorites = favorites.map((fav: any) => ({
        ...fav,
        label: formatStockName(fav.label),
        guid: fav.guid,
      }));
      sessionStorage.setItem("favorite_stocks", JSON.stringify(formattedFavorites));
      setDataOptions(formattedFavorites);
    } catch {
      setToast({ type: "error", message: `Could not ${newMonitorState ? "monitor" : "unmonitor"} ${label}` });
    } finally {
      setMonitoredDataLoading((prev) => ({ ...prev, [value]: false }));
    }
  };

  const handleDataRemove = async (dataItem: DataOption) => {
    try {
      await removeFavoriteStock(dataItem.guid);
      const updated = dataOptions.filter((d) => d.guid !== dataItem.guid);
      setDataOptions(updated);
      sessionStorage.setItem("favorite_stocks", JSON.stringify(updated));
      setToast({ type: "error", message: `${dataItem.label} removed from favorites.` });
    } catch {
      setToast({ type: "error", message: `Failed to remove ${dataItem.label} from favorites.` });
    }
  };

  const handleSetAlert = async () => {
    if (!alertModalData) return;

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
      await setStockAlert(alertModalData.guid, upper ?? 0, lower ?? 0);
      setToast({ type: "success", message: `Alert set for ${alertModalData.label}.` });
    } catch {
      setToast({ type: "error", message: `Failed to set alert for ${alertModalData.label}.` });
    } finally {
      setAlertModalData(null);
      setUpperThreshold("");
      setLowerThreshold("");
    }
  };

  // Derived
  const filteredData = dataOptions.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()));

  // A ref that forces reflow of the graph container on layout changes (no heavy listeners)
  const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Defer a resize to allow transition to finish so charts measure the final box
    const t = setTimeout(() => {
      if (!contentRef.current) return;
      // Force a reflow-safe style read; Graph component uses ResizeObserver internally
      void contentRef.current.offsetWidth; // eslint-disable-line @typescript-eslint/no-unused-expressions
      // Trigger a window resize event for any listeners inside chart libs
      window.dispatchEvent(new Event("resize"));
    }, 320); // matches transition duration
    return () => clearTimeout(t);
  }, [graphLayoutKey]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 antialiased relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-red-400 to-orange-400 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-tr from-blue-400 to-purple-400 blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 h-20 bg-white shadow-sm border-b border-gray-200/60 sticky top-0 z-30 flex-shrink-0">
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <span className="text-lg font-semibold text-gray-900">Data Monitor</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Data
          </div>
          <motion.button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200/50"
            aria-label="Open menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 min-h-0">
        {/* Sidebar - absolute like Signal */}
        <motion.aside
          className={`${isLeftSidebarCollapsed ? "w-16" : "w-96"
            } absolute left-6 top-6 bottom-6 z-20 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl flex flex-col transition-all duration-300`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          aria-label="Monitoring sidebar"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-red-50 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              {!isLeftSidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-bold text-gray-900">Stock Monitor</h2>
                </div>
              )}
              <button
                onClick={() => setIsLeftSidebarCollapsed((v) => !v)}
                className="ms-[-10px] p-2 rounded-xl hover:bg-red-50 text-gray-600 transition-colors border border-red-200 shadow-sm"
                aria-label={isLeftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isLeftSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded content with internal scroll */}
          {!isLeftSidebarCollapsed ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* AI Search */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <motion.button
                  onClick={() => setIsAiSearchOpen(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 group shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">AI Data Search</span>
                  <div className="ml-auto">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </div>

              {/* Scrollable favorites */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      Favourite Stocks
                    </h3>
                    <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-semibold">
                      {dataOptions.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {isFavoritesLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                      ))
                    ) : dataOptions.length ? (
                      filteredData.map((dataItem, index) => {
                        const isSelected = selectedData.includes(dataItem.value);
                        const dataIndex = selectedData.findIndex((d) => d === dataItem.value);
                        const isActive = isSelected && dataIndex === activeDataIndex;

                        return (
                          <motion.div
                            key={dataItem.value}
                            layout
                            onClick={() => {
                              if (isSelected) setActiveDataIndex(dataIndex);
                            }}
                            className={`p-4 rounded-2xl border transition-all group cursor-pointer overflow-hidden relative ${isActive
                                ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-lg"
                                : "bg-white/90 border-gray-200/60 hover:border-red-300 hover:shadow-lg"
                              }`}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                          >
                            {isActive && (
                              <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-10" />
                            )}

                            <div className="flex items-start justify-between relative z-10">
                              <div className="flex-1 min-w-0">
                                <div className="text-base font-bold text-gray-900 mb-1 whitespace-normal">
                                  {formatStockName(dataItem.label)}
                                </div>
                                {isSelected ? (
                                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mb-1">
                                    Monitoring
                                  </span>
                                ) : (
                                  <div className="text-sm text-gray-500 font-medium">Available</div>
                                )}
                                {isActive && (
                                  <div className="text-xs text-red-600 flex items-center gap-1 font-medium">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    Currently viewing
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 ml-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDataToggle(dataItem.value, dataItem.label);
                                  }}
                                  className={`p-2 rounded-lg transition-all ${isSelected
                                      ? "text-red-600 hover:bg-red-200 bg-red-100"
                                      : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                  title={isSelected ? "Stop Monitoring" : "Start Monitoring"}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Monitor className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDataToShare(dataItem);
                                    setShowShareModal(true);
                                  }}
                                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                  title="Share"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Share2 className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAlertModalData(dataItem);
                                    const matched = data.find((d, idx) => selectedData[idx] === dataItem.value);
                                    setUpperThreshold(matched ? matched?.upper_threshold?.toString() : "");
                                    setLowerThreshold(matched ? matched?.lower_threshold?.toString() : "");
                                  }}
                                  className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all"
                                  title="Set Alert"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Bell className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmPopup({ data: dataItem });
                                  }}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                  title="Remove"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mb-1 font-medium">No saved sources</p>
                        <p className="text-xs text-gray-400">Use AI search to find data sources</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Collapsed: quick AI button at bottom
            <div className="p-3">
              <button
                onClick={() => setIsAiSearchOpen(true)}
                className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                title="AI Data Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.aside>

        <section
          // Use inline style for precise calc and smooth transitions without Tailwind plugin
          style={{
            marginLeft: contentLeftOffset,
            marginRight: contentRightOffset,
            transition: "margin 0.3s ease, width 0.3s ease",
            width: `calc(100% - ${contentLeftOffset + contentRightOffset}px)`,
          }}
          className="h-full flex flex-col bg-white/50 backdrop-blur-sm relative min-h-0"
          ref={contentRef}
        >
          {selectedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <TrendingUp className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Monitoring</h3>
                  <p className="text-gray-600 max-w-md leading-relaxed">
                    Select data sources from the sidebar to monitor their performance and analyze trends.
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsAiSearchOpen(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-2xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Find Data with AI
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Main Graph */}
              <div className="flex-1 p-6 pb-24 min-h-0">
                <motion.div
                  key={graphLayoutKey}
                  className="h-full bg-white/90 rounded-2xl shadow-2xl relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {data[activeDataIndex] ? (
                    <GraphMonitorComponent
                      data={data[activeDataIndex]?.stock_data || []}
                      upperThreshold={data[activeDataIndex]?.upper_threshold || 0}
                      lowerThreshold={data[activeDataIndex]?.lower_threshold || 0}
                      index={activeDataIndex}
                      availableRanges={["1D", "1M", "6M", "1Y", "Max"]}
                      defaultRange="1M"
                      sidebarCollapsed={isLeftSidebarCollapsed}
                      stockName={dataOptions.find((d) => d.value === selectedData[activeDataIndex])?.label}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">Loading data...</p>
                      </div>
                    </div>
                  )}

                  {/* Other monitored sources mini charts */}
                  {selectedData.length > 1 && (
                    <div className="p-6 border-t border-gray-200/60 bg-gray-50/50 backdrop-blur-sm mb-16">
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          Other Sources
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedData.map((dataValue, index) => {
                          if (index === activeDataIndex) return null;

                          const dataItem = dataOptions.find((d) => d.value === dataValue);
                          const dataSet: any = data[index];
                          const chartPoints = dataSet?.stock_data?.stock_data || [];

                          const parsePointValue = (point: any): number | null => {
                            const valStr = point.value_unit || point.predicted_value_unit_1 || point.predicted_value_unit_2;
                            if (!valStr) return null;
                            const parsed = parseFloat(valStr);
                            return isNaN(parsed) ? null : parsed;
                          };

                          return (
                            <motion.div
                              key={dataValue}
                              layout
                              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-red-300"
                              onClick={() => setActiveDataIndex(index)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {formatStockName(dataItem?.label || "")}
                                </h4>
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              </div>
                              <div className="h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200/50">
                                {chartPoints.length > 0 ? (
                                  <div className="w-full h-full p-2">
                                    <svg className="w-full h-full" viewBox="0 0 200 40">
                                      {(() => {
                                        const values = chartPoints
                                          .map(parsePointValue)
                                          .filter((v: any): v is number => v !== null)
                                          .slice(-30);

                                        if (values.length < 2) return null;

                                        const minValue = Math.min(...values);
                                        const maxValue = Math.max(...values);
                                        const valueRange = maxValue - minValue || 1;

                                        const points = values
                                          .map((value: any, i: any) => {
                                            const x = (i / (values.length - 1)) * 180 + 10;
                                            const y = 35 - ((value - minValue) / valueRange) * 30;
                                            return `${x},${y}`;
                                          })
                                          .join(" ");

                                        return (
                                          <polyline
                                            points={points}
                                            fill="none"
                                            stroke="#dc2626"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        );
                                      })()}
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2 text-center font-medium">Click to expand</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>


            </>
          )}
        </section>
      </main>

      {/* Modals and overlays */}
      {alertModalData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200/60"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Set Alert</h2>
              <button
                onClick={() => setAlertModalData(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Set alerts for <strong>{alertModalData.label}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Upper Threshold</label>
                <input
                  type="number"
                  value={upperThreshold}
                  onChange={(e) => setUpperThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., 120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Lower Threshold</label>
                <input
                  type="number"
                  value={lowerThreshold}
                  onChange={(e) => setLowerThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., 80"
                />
              </div>
              <button
                onClick={handleSetAlert}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors font-medium"
              >
                Save Alert
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {confirmPopup.data && (
        <ConfirmationPopup
          title="Remove Favorite Data Source?"
          message={`Are you sure you want to remove ${confirmPopup.data.label} from your favorites?`}
          onConfirm={() => {
            handleDataRemove(confirmPopup.data!);
            setConfirmPopup({ data: null });
          }}
          onCancel={() => setConfirmPopup({ data: null })}
        />
      )}

      {showShareModal && dataToShare && (
        <ShareModal
          isStock={true}
          itemLabel={dataToShare.label}
          itemGuid={dataToShare.guid}
          onClose={() => {
            setDataToShare(null);
            setShowShareModal(false);
          }}
        />
      )}

      {quickPreviewData && (
        <QuickStockPreviewModal stock={quickPreviewData} onClose={() => setQuickPreviewData(null)} />
      )}

      <AISearchComponent
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
        onStockFound={(stockData) => {
          console.log("Data found:", stockData);
        }}
        onAddToFavorites={() => {
          refreshFavoritesFromStorage();
        }}
        onShowToast={(type, message) => {
          setToastSocket({ type, message });
        }}
        onGoToDashboard={handleGoToDashboard}
        currentTab="monitoring"
      />

      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
            />
            <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>

      <Dock />
    </div>
  );
};

export default MainPage;
