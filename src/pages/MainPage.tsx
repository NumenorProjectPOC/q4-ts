import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Monitor,
  Trash2,
  Share2,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  TrendingUp,
  Activity,
  Layers,
  Signal,
  MoreVertical
} from "lucide-react";

import Toast from "../components/ui/Toast";
import ConfirmationPopup from "../components/ui/ConfirmationPopup";
import ShareModal from "../components/ui/ShareModal";
import RightSidebar from "../components/RightSidebar";
import AISearchComponent from "../components/AISearchComponent";
import QuickStockPreviewModal from "../components/ui/QuickStockPreviewModal";
import GraphMonitorComponent from "../components/MonitoringGraph";
import Dock from "../components/ui/Dock";
import AlertModal from "../components/ui/AlertModal";
import ThemeToggle from "../components/ui/ThemeToggle";

import {
  fetchFavoriteStocks,
  fetchMonitoredStockData,
  removeFavoriteStock,
  setStockAlert,
  toggleStockMonitoring,
} from "../services/quantiforeApi";
import { formatStockName } from "../utils/utility";
import { useTheme } from '../context/ThemeContext';

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

interface AlertFormData {
  upperThreshold: number | null;
  lowerThreshold: number | null;
  alertFrequency: string;
  emailNotifications: string[];
  phoneNotifications: string[];
}

const STORAGE_KEYS = {
  FAVORITE_STOCKS: 'favorite_stocks',
  MONITORING_DATA: 'monitoring_data',
  SELECTED_DATA: 'selected_monitoring_data',
  LAST_UPDATED: 'monitoring_last_updated'
} as const;

const MainPage: React.FC = () => {
  // Theme state using context
  const { isDarkMode } = useTheme();

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

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileStocksPanelOpen, setMobileStocksPanelOpen] = useState(false);
  const [activeDropdownStock, setActiveDropdownStock] = useState<DataOption | null>(null);

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

  const saveToStorage = (key: string, data: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      // Also save to localStorage for persistence across sessions
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save to storage:`, error);
    }
  };

  const loadFromStorage = (key: string) => {
    try {
      // Try sessionStorage first, then localStorage as fallback
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      const localData = localStorage.getItem(key);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Copy to sessionStorage for faster access
        sessionStorage.setItem(key, localData);
        return parsed;
      }
    } catch (error) {
      console.warn(`Failed to load from storage:`, error);
    }
    return null;
  };

  const clearOldData = () => {
    const lastUpdated = loadFromStorage(STORAGE_KEYS.LAST_UPDATED);
    const now = Date.now();
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    if (!lastUpdated || (now - lastUpdated) > CACHE_DURATION) {
      // Clear old monitoring data
      sessionStorage.removeItem(STORAGE_KEYS.MONITORING_DATA);
      localStorage.removeItem(STORAGE_KEYS.MONITORING_DATA);
      saveToStorage(STORAGE_KEYS.LAST_UPDATED, now);
    }
  };
  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto-collapse sidebar on mobile
      if (width < 768) {
        setIsLeftSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Utils
  const handleGoToDashboard = (targetTab?: "monitoring" | "visualization") => {
    if (targetTab) navigate(`/${targetTab}`);
  };

  const refreshFavoritesFromStorage = () => {
    const cached = loadFromStorage(STORAGE_KEYS.FAVORITE_STOCKS);
    if (cached) {
      setDataOptions(cached);
    }
  };

  // Load favorites and monitored data
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsFavoritesLoading(true);
        clearOldData();

        // Try to load from storage first
        const cachedFavorites = loadFromStorage(STORAGE_KEYS.FAVORITE_STOCKS);
        const cachedMonitoringData = loadFromStorage(STORAGE_KEYS.MONITORING_DATA);
        const cachedSelectedData = loadFromStorage(STORAGE_KEYS.SELECTED_DATA);

        if (cachedFavorites && cachedMonitoringData && cachedSelectedData) {
          console.log('Loading from cache...');
          setDataOptions(cachedFavorites);
          setData(cachedMonitoringData);
          setSelectedData(cachedSelectedData);

          // Set active index to first monitored item
          const firstMonitoredIndex = cachedSelectedData.findIndex((value: string) =>
            cachedFavorites.find((fav: DataOption) => fav.value === value)?.monitored
          );
          setActiveDataIndex(Math.max(0, firstMonitoredIndex));

          setIsFavoritesLoading(false);
          return;
        }

        // Fallback to API
        console.log('Loading from API...');
        const favorites = await fetchFavoriteStocks();
        const formatted = favorites.map((stock: any) => ({
          ...stock,
          label: formatStockName(stock.label),
          guid: stock.guid,
        }));

        saveToStorage(STORAGE_KEYS.FAVORITE_STOCKS, formatted);
        setDataOptions(formatted);

        const monitoredItems = formatted.filter((d: DataOption) => d.monitored);
        if (monitoredItems.length > 0) {
          const monitoredGuids = monitoredItems.map((d: DataOption) => d.guid);
          const monitoredValues = monitoredItems.map((d: DataOption) => d.value);
          await fetchInitialMonitoredData(monitoredGuids, monitoredValues);
        }

      } catch (error) {
        console.error('Error loading favorites:', error);
        setToast({ type: "error", message: "Could not load favorites. Please try again." });
      } finally {
        setIsFavoritesLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const fetchInitialMonitoredData = async (guids: string[], values: string[]) => {
    try {
      console.log('Fetching monitoring data for:', values);
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

      // Save to storage
      saveToStorage(STORAGE_KEYS.MONITORING_DATA, resultData);
      saveToStorage(STORAGE_KEYS.SELECTED_DATA, values);
      saveToStorage(STORAGE_KEYS.LAST_UPDATED, Date.now());

      const loadingMap = Object.fromEntries(guids.map((g) => [g, false]));
      setMonitoredDataLoading(loadingMap);

      console.log('Monitoring data cached successfully');
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
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
        // Add to monitoring
        const result = await fetchMonitoredStockData([dataItem.guid]);
        if (result && result.length > 0) {
          const formatted: DataAPIResponse = {
            stock_data: result[0],
            upper_threshold: (result[0] as { upper_threshold?: number }).upper_threshold || 0,
            lower_threshold: (result[0] as { lower_threshold?: number }).lower_threshold || 0,
          };

          const newSelectedData = [...selectedData, value];
          const newData = [...data, formatted];

          setSelectedData(newSelectedData);
          setData(newData);
          setActiveDataIndex(selectedData.length);

          // Update storage
          saveToStorage(STORAGE_KEYS.MONITORING_DATA, newData);
          saveToStorage(STORAGE_KEYS.SELECTED_DATA, newSelectedData);
          saveToStorage(STORAGE_KEYS.LAST_UPDATED, Date.now());
        }
      } else {
        // Remove from monitoring
        const indexToRemove = selectedData.findIndex((d) => d === value);
        const newSelectedData = selectedData.filter((d) => d !== value);
        const newData = data.filter((_, idx) => idx !== indexToRemove);

        setSelectedData(newSelectedData);
        setData(newData);

        if (activeDataIndex === indexToRemove) {
          setActiveDataIndex(0);
        } else if (activeDataIndex > indexToRemove) {
          setActiveDataIndex((prev) => prev - 1);
        }

        // Update storage
        saveToStorage(STORAGE_KEYS.MONITORING_DATA, newData);
        saveToStorage(STORAGE_KEYS.SELECTED_DATA, newSelectedData);
        saveToStorage(STORAGE_KEYS.LAST_UPDATED, Date.now());
      }

      await toggleStockMonitoring(dataItem.guid, newMonitorState);

      setToast({
        type: newMonitorState ? "success" : "warning",
        message: newMonitorState ? `${label} is now being monitored.` : `${label} removed from monitoring.`,
      });

      // Refresh favorites and update storage
      const favorites = await fetchFavoriteStocks();
      const formattedFavorites = favorites.map((fav: any) => ({
        ...fav,
        label: formatStockName(fav.label),
        guid: fav.guid,
      }));

      saveToStorage(STORAGE_KEYS.FAVORITE_STOCKS, formattedFavorites);
      setDataOptions(formattedFavorites);

    } catch (error) {
      console.error('Error toggling monitoring:', error);
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

      // Update storage
      saveToStorage(STORAGE_KEYS.FAVORITE_STOCKS, updated);

      // Also remove from monitoring if it was being monitored
      if (selectedData.includes(dataItem.value)) {
        const indexToRemove = selectedData.findIndex((d) => d === dataItem.value);
        const newSelectedData = selectedData.filter((d) => d !== dataItem.value);
        const newData = data.filter((_, idx) => idx !== indexToRemove);

        setSelectedData(newSelectedData);
        setData(newData);

        saveToStorage(STORAGE_KEYS.MONITORING_DATA, newData);
        saveToStorage(STORAGE_KEYS.SELECTED_DATA, newSelectedData);
      }

      setToast({ type: "error", message: `${dataItem.label} removed from favorites.` });
    } catch (error) {
      console.error('Error removing favorite:', error);
      setToast({ type: "error", message: `Failed to remove ${dataItem.label} from favorites.` });
    }
  };

  const handleSetAlert = async (alertData: AlertFormData) => {
    if (!alertModalData) return;

    try {
      // Use setStockAlert API
      await setStockAlert(
        alertModalData.guid,
        alertData.upperThreshold || 0,
        alertData.lowerThreshold || 0,
        alertData.alertFrequency || 'daily',
        alertData.emailNotifications || [],
        alertData.phoneNotifications || []
      );

      // Update the current monitoring data with new thresholds
      const newData = data.map((item, idx) => {
        if (selectedData[idx] === alertModalData.value) {
          // If there's no existing data for this index, keep it as null
          if (!item) return null;
          // Preserve existing stock_data and set the correct threshold keys
          return {
            ...item,
            upper_threshold: alertData.upperThreshold ?? 0,
            lower_threshold: alertData.lowerThreshold ?? 0
          } as DataAPIResponse;
        }
        return item;
      });

      setData(newData);

      // Update storage with new thresholds
      saveToStorage(STORAGE_KEYS.MONITORING_DATA, newData);

      setToast({
        type: 'success',
        message: `Alert thresholds successfully configured for ${alertModalData.label}!`
      });

    } catch (error) {
      console.error("Error setting alert:", error);
      setToast({
        type: 'error',
        message: `Failed to configure alert for ${alertModalData.label}.`
      });
    }
  };


  useEffect(() => {
    if (selectedData.length === 0) return;

    const interval = setInterval(async () => {
      try {
        console.log('Refreshing monitoring data...');
        const monitoredItems = dataOptions.filter((d) => selectedData.includes(d.value));
        const monitoredGuids = monitoredItems.map((d) => d.guid);

        if (monitoredGuids.length > 0) {
          const dataList = await fetchMonitoredStockData(monitoredGuids);
          const resultData = monitoredGuids.map((guid) => {
            const match = dataList.find((d: any) => d.guid === guid);
            if (!match) return null;
            return {
              stock_data: match,
              upper_threshold: (match as { upper_threshold?: number }).upper_threshold || 0,
              lower_threshold: (match as { lower_threshold?: number }).lower_threshold || 0,
            } as DataAPIResponse;
          });

          setData(resultData);
          saveToStorage(STORAGE_KEYS.MONITORING_DATA, resultData);
          saveToStorage(STORAGE_KEYS.LAST_UPDATED, Date.now());
          console.log('Monitoring data refreshed');
        }
      } catch (error) {
        console.error('Failed to refresh monitoring data:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedData, dataOptions]);
  // Mobile Action Menu Component
  const MobileActionMenu: React.FC<{
    stock: DataOption;
    onClose: () => void;
    position: { x: number; y: number };
  }> = ({ stock, onClose, position }) => {
    const isMonitored = selectedData.includes(stock.value);
    const isLoading = monitoredDataLoading[stock.value];

    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40"
          onClick={onClose}
        />

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className={`absolute z-50 min-w-[200px] rounded-xl border shadow-lg backdrop-blur-xl ${isDarkMode
            ? 'bg-slate-900/95 border-neutral-700/50'
            : 'bg-white/95 border-neutral-200/60'
            }`}
          style={{
            left: Math.min(position.x, window.innerWidth - 220),
            top: position.y + 10
          }}
        >
          <div className="p-2">
            <div className={`px-3 py-2 text-xs font-bold ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
              }`}>
              {formatStockName(stock.label)}
            </div>

            <button
              onClick={() => {
                handleDataToggle(stock.value, stock.label);
                onClose();
              }}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isMonitored
                ? isDarkMode
                  ? 'text-red-400 hover:bg-red-900/20'
                  : 'text-red-600 hover:bg-red-50'
                : isDarkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-neutral-700 hover:bg-neutral-100'
                }`}
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
              {isMonitored ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>

            <button
              onClick={() => {
                setDataToShare(stock);
                setShowShareModal(true);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-neutral-700 hover:bg-neutral-100'
                }`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={() => {
                setAlertModalData(stock);
                const matched = data.find((d, idx) => selectedData[idx] === stock.value);
                setUpperThreshold(matched ? matched?.upper_threshold?.toString() : "");
                setLowerThreshold(matched ? matched?.lower_threshold?.toString() : "");
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-neutral-700 hover:bg-neutral-100'
                }`}
            >
              <Bell className="w-4 h-4" />
              Set Alert
            </button>

            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

            <button
              onClick={() => {
                setConfirmPopup({ data: stock });
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                ? 'text-red-400 hover:bg-red-900/20'
                : 'text-red-600 hover:bg-red-50'
                }`}
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </motion.div>
      </>
    );
  };

  const filteredData = dataOptions.filter((d) => d.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`h-screen flex flex-col transition-all duration-500 font-inter antialiased relative overflow-hidden ${isDarkMode
      ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
      : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
      }`}>

      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode
          ? 'bg-gradient-to-br from-red-500 to-neutral-600'
          : 'bg-gradient-to-br from-red-400 to-neutral-400'
          }`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode
          ? 'bg-gradient-to-tr from-neutral-600 to-red-500'
          : 'bg-gradient-to-tr from-neutral-400 to-red-400'
          }`} />
      </div>

      {/* MOBILE MINIMAL HEADER */}
      {isMobile ? (
        <header className={`flex items-center justify-between px-4 h-16 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
          ? 'bg-slate-900/90 border-neutral-700/30'
          : 'bg-white/90 border-neutral-200/60'
          }`}>
          {/* Q Logo */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/Q-logo.svg"
              alt="Quantifore logo"
              className="h-8 select-none drop-shadow-sm"
            />
          </motion.div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Menu Button */}
            <motion.button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-lg p-2.5 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </div>
        </header>
      ) : (
        /* DESKTOP HEADER - Same as original */
        <header className={`flex items-center justify-between px-4 sm:px-8 lg:px-12 h-20 sm:h-24 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
          ? 'bg-slate-900/90 border-neutral-700/30'
          : 'bg-white/90 border-neutral-200/60'
          }`}>
          <motion.div
            className="flex items-center space-x-3 sm:space-x-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
              alt="Quantifore logo"
              className="h-8 sm:h-10 select-none drop-shadow-sm"
            />
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-2 sm:p-3 rounded-xl shadow-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-neutral-300 to-neutral-400'
                }`}>
                <Activity className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-red-400' : 'text-neutral-900'
                  }`} />
              </div>
              <div>
                <div className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  Monitor
                </div>
                <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                  }`}>Real-time Analytics</div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center space-x-3">
            {/* Live Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isDarkMode
              ? 'bg-white/5 text-emerald-400 border border-white/20'
              : 'bg-white/60 text-emerald-700 border border-neutral-200/60'
              }`}>
              <motion.div
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                animate={{
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="hidden sm:inline">Live Data</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Button */}
            <motion.button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT LAYOUT */}
      <main className={`flex-1 min-h-0 ${isMobile ? 'flex flex-col pb-20' : 'flex px-4 sm:px-8 lg:px-12 py-6 sm:py-8 gap-6'}`}>

        {/* MOBILE HORIZONTAL STOCKS BAR */}
        {isMobile && (
          <div className={`border-b backdrop-blur-xl flex-shrink-0 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/80'
            }`}>
            {/* AI Search Button */}
            <div className="px-4 py-3">
              <motion.button
                onClick={() => setIsAiSearchOpen(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 shadow-md ${isDarkMode
                  ? 'bg-red-800 text-white hover:bg-red-700'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                whileTap={{ scale: 0.98 }}
              >
                <Search className="w-4 h-4" />
                <span className="font-bold text-sm">AI Stock Search</span>
              </motion.button>
            </div>

            {/* Horizontal Stocks List */}
            <div className="px-4 pb-3">
              <div className={`flex items-center gap-2 mb-3`}>
                <Signal className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-neutral-900'}`} />
                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                  Stocks ({dataOptions.length})
                </span>
              </div>

              {isFavoritesLoading ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`flex-shrink-0 w-48 h-16 rounded-xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-neutral-100/80'
                      }`} />
                  ))}
                </div>
              ) : dataOptions.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {filteredData.map((dataItem, index) => {
                    const isSelected = selectedData.includes(dataItem.value);
                    const dataIndex = selectedData.findIndex((d) => d === dataItem.value);
                    const isActive = isSelected && dataIndex === activeDataIndex;
                    const isLoading = monitoredDataLoading[dataItem.value];

                    return (
                      <motion.div
                        key={dataItem.value}
                        onClick={() => {
                          if (isSelected) setActiveDataIndex(dataIndex);
                        }}
                        className={`flex-shrink-0 w-48 p-3 rounded-xl border transition-all duration-300 cursor-pointer relative ${isActive
                          ? isDarkMode
                            ? "bg-slate-900/80 border-red-500/50 shadow-lg shadow-red-500/10"
                            : "bg-white border-red-500/50 shadow-lg shadow-red-500/10"
                          : isDarkMode
                            ? "bg-slate-900/60 border-neutral-700/50 hover:border-neutral-600/70"
                            : "bg-white/80 border-neutral-200/60 hover:border-neutral-300/80"
                          }`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none rounded-xl" />
                        )}

                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex-1 min-w-0 mr-2">
                            <div className={`text-sm font-bold mb-1 truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'
                              }`}>
                              {formatStockName(dataItem.label)}
                            </div>
                            {isSelected ? (
                              <span className={`inline-flex items-center text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                <motion.div
                                  className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                                Monitoring
                              </span>
                            ) : (
                              <div className={`text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                }`}>Available</div>
                            )}
                          </div>

                          {/* 3-dot menu button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveDropdownStock(dataItem);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                              ? 'hover:bg-white/10 text-white/70'
                              : 'hover:bg-neutral-100 text-neutral-500'
                              }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 border-2 border-dashed rounded-xl ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/50'
                  }`}>
                  <Layers className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-white/40' : 'text-neutral-400'
                    }`} />
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                    }`}>No saved stocks</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DESKTOP SIDEBAR - Same as original but hidden on mobile */}
        {!isMobile && (
          <motion.aside
            className={`${isLeftSidebarCollapsed ? "w-16" : "w-80 lg:w-96"
              } flex-shrink-0 border rounded-2xl sm:rounded-3xl flex flex-col transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden backdrop-blur-xl ${isDarkMode
                ? 'border-neutral-700/50 bg-slate-900/60'
                : 'border-neutral-200/60 bg-white/95'
              }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: 'calc(100vh - 200px)' }}
          >
            {/* Sidebar Header - Fixed */}
            <div className={`p-4 sm:p-6 border-b flex-shrink-0 flex items-center justify-between ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'
              }`}>
              {!isLeftSidebarCollapsed && (
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  <Signal className="w-5 h-5 sm:w-6 sm:h-6" />
                  Stocks
                </h2>
              )}
              <button
                onClick={() => setIsLeftSidebarCollapsed((v) => !v)}
                className={`ms-[-16px] p-2 sm:p-3 rounded-xl transition-all backdrop-blur-sm shadow-sm border ${isDarkMode
                  ? 'hover:bg-white/10 text-white/80 hover:text-white border-white/20'
                  : 'hover:bg-neutral-100/80 text-neutral-600 hover:text-neutral-900 border-neutral-200/60'
                  }`}
              >
                {isLeftSidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Sidebar Content - Same as original */}
            {!isLeftSidebarCollapsed ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* AI Search - Fixed */}
                <div className="p-4 sm:p-6 flex-shrink-0">
                  <motion.button
                    onClick={() => setIsAiSearchOpen(true)}
                    className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300 group shadow-lg hover:shadow-xl ${isDarkMode
                      ? 'bg-red-800 text-white hover:bg-red-700'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                      }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="font-bold text-sm sm:text-base">AI Stock Search</span>
                    <div className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </motion.button>
                </div>

                {/* Search Input */}
                <div className="px-4 sm:px-6 mb-4 sm:mb-6 flex-shrink-0">
                  <div className={`relative ${isDarkMode ? 'text-white/80' : 'text-neutral-600'}`}>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 sm:left-4 top-3 sm:top-4 opacity-40" />
                    <input
                      type="text"
                      placeholder="Filter sources..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl border text-sm sm:text-base transition-all placeholder-opacity-60 ${isDarkMode
                        ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                        : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                        } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                    />
                  </div>
                </div>

                {/* Desktop Scrollable Favorites List - Same as original */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDarkMode ? 'text-white/80' : 'text-neutral-600'
                        }`}>
                        Favorites
                      </h3>
                      <span className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-bold ${isDarkMode
                        ? 'bg-white/10 text-white/70 border border-white/20'
                        : 'bg-neutral-100/80 text-neutral-600 border border-neutral-200/60'
                        }`}>
                        {dataOptions.length}
                      </span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {isFavoritesLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={`h-20 sm:h-24 rounded-2xl animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-neutral-100/80'
                            }`} />
                        ))
                      ) : dataOptions.length ? (
                        filteredData.map((dataItem, index) => {
                          const isSelected = selectedData.includes(dataItem.value);
                          const dataIndex = selectedData.findIndex((d) => d === dataItem.value);
                          const isActive = isSelected && dataIndex === activeDataIndex;
                          const isLoading = monitoredDataLoading[dataItem.value];

                          return (
                            <motion.div
                              key={dataItem.value}
                              layout
                              onClick={() => {
                                if (isSelected) setActiveDataIndex(dataIndex);
                              }}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 group cursor-pointer relative overflow-hidden ${isActive
                                ? isDarkMode
                                  ? "bg-slate-900/80 border-red-500/50 shadow-lg shadow-red-500/10"
                                  : "bg-white border-red-500/50 shadow-lg shadow-red-500/10"
                                : isDarkMode
                                  ? "bg-slate-900/60 border-neutral-700/50 hover:border-neutral-600/70 hover:bg-slate-900/80"
                                  : "bg-white/80 border-neutral-200/60 hover:border-neutral-300/80 hover:bg-white hover:shadow-md"
                                }`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.04 }}
                              whileHover={{ y: -2 }}
                            >
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                              )}

                              <div className="flex items-start justify-between relative z-10">
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm sm:text-base font-bold mb-2 truncate leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                    }`}>
                                    {formatStockName(dataItem.label)}
                                  </div>
                                  {isSelected ? (
                                    <span className={`inline-flex items-center text-xs sm:text-sm font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                      }`}>
                                      <motion.div
                                        className="w-2 h-2 bg-red-500 rounded-full mr-2"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      />
                                      Monitoring
                                    </span>
                                  ) : (
                                    <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                      }`}>Available</div>
                                  )}
                                </div>

                                {/* Desktop action buttons */}
                                <div className={`flex items-center gap-1.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}>
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDataToggle(dataItem.value, dataItem.label);
                                    }}
                                    disabled={isLoading}
                                    className={`p-2 sm:p-3 rounded-xl transition-all ${isSelected
                                      ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      : isDarkMode
                                        ? "text-white/60 hover:text-white hover:bg-white/10"
                                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
                                      }`}
                                    title={isSelected ? "Stop Monitoring" : "Start Monitoring"}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {isLoading ? (
                                      <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full" />
                                    ) : (
                                      <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                  </motion.button>

                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAlertModalData(dataItem);
                                      const matched = data.find((d, idx) => selectedData[idx] === dataItem.value);
                                      setUpperThreshold(matched ? matched?.upper_threshold?.toString() : "");
                                      setLowerThreshold(matched ? matched?.lower_threshold?.toString() : "");
                                    }}
                                    className={`p-2 sm:p-3 rounded-xl transition-all ${isDarkMode
                                      ? "text-white/60 hover:text-white hover:bg-white/10"
                                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
                                      }`}
                                    title="Set Alert"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </motion.button>

                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmPopup({ data: dataItem });
                                    }}
                                    className={`p-2 sm:p-3 rounded-xl transition-all ${isDarkMode
                                      ? "text-white/60 hover:text-red-400 hover:bg-white/10"
                                      : "text-neutral-500 hover:text-red-600 hover:bg-neutral-100/80"
                                      }`}
                                    title="Remove"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 sm:py-16 border-2 border-dashed rounded-2xl border-neutral-200/50 dark:border-neutral-700/50">
                          <Layers className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4 ${isDarkMode ? 'text-white/40' : 'text-neutral-400'
                            }`} />
                          <p className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                            }`}>No saved sources</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Collapsed: enhanced quick AI button
              <div className="p-4 flex flex-col items-center gap-4 flex-1">
                <motion.button
                  onClick={() => setIsAiSearchOpen(true)}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${isDarkMode
                    ? 'bg-red-800 text-white hover:bg-red-700'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                    }`}
                  title="AI Stock Search"
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              </div>
            )}
          </motion.aside>
        )}

        {/* MAIN CONTENT SECTION - RESPONSIVE GRAPH HEIGHT */}
        <section
          className={`${isMobile
            ? 'flex-1 p-4 min-h-0'
            : 'flex-1 min-h-0'
            }`}
          style={!isMobile ? { height: 'calc(100vh - 200px)' } : undefined}
        >
          {selectedData.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full rounded-2xl sm:rounded-3xl border shadow-lg backdrop-blur-xl ${isDarkMode
              ? 'border-neutral-700/50 bg-slate-900/60'
              : 'border-neutral-200/60 bg-white/95'
              }`}>
              <motion.div
                className="text-center space-y-6 sm:space-y-8 p-8 sm:p-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mx-auto relative ${isDarkMode
                  ? 'bg-white/5'
                  : 'bg-gradient-to-tr from-neutral-200/80 to-neutral-300/80'
                  }`}>
                  <TrendingUp className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-red-500' : 'text-neutral-600'
                    }`} />
                  <motion.div
                    className={`absolute inset-0 rounded-2xl border-2 ${isDarkMode ? 'border-red-500/30' : 'border-neutral-400/30'}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                    }`}>Select Data to Monitor</h3>
                  <p className={`max-w-md text-sm sm:text-base font-medium leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                    }`}>
                    {isMobile
                      ? "Choose stocks from the list above or use AI search to find new metrics."
                      : "Choose data sources from the sidebar or use AI search to find new metrics to analyze."
                    }
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsAiSearchOpen(true)}
                  className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base ${isDarkMode
                    ? 'bg-red-800 text-white hover:bg-red-700'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                    }`}
                  whileTap={{ scale: 0.97 }}
                >
                  Find Data with AI
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Main Graph - RESPONSIVE HEIGHT FOR MOBILE */}
              <div className={`${isMobile ? 'flex-1' : 'flex-1 mb-6 sm:mb-8'}`}>
                <motion.div
                  className="h-full relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
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
                      isDarkMode={isDarkMode}
                    />
                  ) : (
                    <div className={`h-full rounded-2xl border flex items-center justify-center backdrop-blur-xl ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/95'
                      }`}>
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 sm:border-4 border-red-600 border-t-transparent mx-auto mb-3 sm:mb-4" />
                        <p className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                          }`}>Loading data...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Mini Charts - HIDE ON MOBILE */}
              {!isMobile && selectedData.length > 1 && (
                <div className="flex-shrink-0">
                  <div className="mb-4 sm:mb-6">
                    <h3 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-white/80' : 'text-neutral-600'
                      }`}>
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                      Also Monitoring
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {selectedData.map((dataValue, index) => {
                      if (index === activeDataIndex) return null;

                      const dataItem = dataOptions.find((d) => d.value === dataValue);
                      const dataSet = data[index];

                      // Safe extraction of chart points
                      let chartPoints: any[] = [];
                      if (dataSet?.stock_data) {
                        if (Array.isArray(dataSet.stock_data)) {
                          chartPoints = dataSet.stock_data;
                        } else if (dataSet.stock_data.stock_data && Array.isArray(dataSet.stock_data.stock_data)) {
                          chartPoints = dataSet.stock_data.stock_data;
                        } else if (dataSet.stock_data.data && Array.isArray(dataSet.stock_data.data)) {
                          chartPoints = dataSet.stock_data.data;
                        }
                      }

                      const parsePointValue = (point: any): number | null => {
                        if (!point) return null;
                        const valStr = point.value_unit || point.predicted_value_unit_1 || point.predicted_value_unit_2 || point.value || point.y;
                        if (!valStr) return null;
                        const parsed = parseFloat(valStr);
                        return isNaN(parsed) ? null : parsed;
                      };

                      return (
                        <motion.div
                          key={dataValue}
                          layout
                          className={`rounded-2xl border p-4 sm:p-6 cursor-pointer transition-all duration-300 backdrop-blur-xl hover:shadow-lg ${isDarkMode
                            ? 'border-neutral-700/50 bg-slate-900/60 hover:border-neutral-600/70 hover:bg-slate-900/80'
                            : 'border-neutral-200/60 bg-white/80 hover:border-neutral-300/80 hover:bg-white hover:shadow-md'
                            }`}
                          onClick={() => setActiveDataIndex(index)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h4 className={`text-sm sm:text-base font-bold truncate leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                              }`}>
                              {formatStockName(dataItem?.label || "")}
                            </h4>
                            <motion.div
                              className="w-2 h-2 bg-red-500 rounded-full"
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                          <div className={`h-16 sm:h-20 rounded-xl flex items-center justify-center relative overflow-hidden ${isDarkMode
                            ? 'bg-white/5'
                            : 'bg-neutral-100/70'
                            }`}>
                            {chartPoints && chartPoints.length > 0 ? (
                              <div className="w-full h-full p-2 opacity-80">
                                <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                                  {(() => {
                                    const values = chartPoints
                                      .map(parsePointValue)
                                      .filter((v: any): v is number => v !== null && v !== undefined && !isNaN(v))
                                      .slice(-30);

                                    if (values.length < 2) {
                                      return (
                                        <text x="100" y="20" textAnchor="middle" fill={isDarkMode ? "#64748b" : "#94a3b8"} fontSize="8">
                                          Insufficient data
                                        </text>
                                      );
                                    }

                                    const minValue = Math.min(...values);
                                    const maxValue = Math.max(...values);
                                    const valueRange = maxValue - minValue || 1;

                                    const points = values
                                      .map((value: any, i: any) => {
                                        const x = (i / (values.length - 1)) * 200;
                                        const y = 40 - ((value - minValue) / valueRange) * 35;
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
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    );
                                  })()}
                                </svg>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mb-1" />
                                <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-neutral-500'}`}>Loading...</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 pointer-events-none" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Mobile Action Dropdown */}
      <AnimatePresence>
        {activeDropdownStock && (
          <MobileActionMenu
            stock={activeDropdownStock}
            onClose={() => setActiveDropdownStock(null)}
            position={{
              x: window.innerWidth - 220,
              y: 200
            }}
          />
        )}
      </AnimatePresence>

      {/* Modals and overlays - Same as original */}
      <AlertModal
        isOpen={!!alertModalData}
        onClose={() => {
          setAlertModalData(null);
          setUpperThreshold("");
          setLowerThreshold("");
        }}
        onSave={handleSetAlert}
        stockName={alertModalData?.label || ""}
        initialData={{
          upperThreshold: upperThreshold ? parseFloat(upperThreshold) : undefined,
          lowerThreshold: lowerThreshold ? parseFloat(lowerThreshold) : undefined,
          alertFrequency: "daily",
          emailNotifications: [],
          phoneNotifications: []
        }}
      />

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
          <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        )}
      </AnimatePresence>

      <Dock />

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? '#475569 #1e293b' : '#cbd5e1 #f1f5f9'};
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#1e293b' : '#f1f5f9'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#64748b' : '#94a3b8'};
        }
      `}</style>
    </div>
  );
};

export default MainPage;