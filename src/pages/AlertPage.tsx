//Mobile Responsive AlertPage.tsx
import React, { useState, useEffect } from "react";
import { Search, BellPlus, Trash2, Edit, Pause, Play, Mail, Phone, X, AlertTriangle, Loader, Bell, Menu } from "lucide-react";
import RightSidebar from "../components/RightSidebar";
import { AnimatePresence, motion } from "framer-motion";
import Dock from "../components/ui/Dock";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useTheme } from '../context/ThemeContext';
import Toast from "../components/ui/Toast";
import {
  fetchFavoriteStocks,
  updateAlertStatus,
  deleteAlert,
  createAlert,
  updateAlert,
  type FavoriteStockFull,
  setStockAlert
} from "../services/quantiforeApi";

type Alert = FavoriteStockFull;

export default function AlertPage() {
  const { isDarkMode } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSaving, setIsSaving] = useState(false); // For button loading
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Mobile responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchFavoriteStocks(true);
        setAlerts(data);

        if (data) {
          const cacheData = data.map(item => ({
            guid: item.fav_stocks_guid,
            label: item.stock_name,
            name: item.stock_name
          }));

          localStorage.setItem('favorite_stocks', JSON.stringify(cacheData));
        }

      } catch (err) {
        console.error("Error loading alerts:", err);
        setError(err instanceof Error ? err.message : "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const handleOpenModal = (alert: Alert | null = null) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const handleSaveAlert = async (alertData: Partial<Alert>) => {
    setIsSaving(true);

    try {
      const guid = editingAlert ? editingAlert.fav_stocks_guid : alertData.fav_stocks_guid;
      if (!guid) {
        setError("Stock GUID is required to create/update alert");
        return;
      }

      await setStockAlert(
        guid,
        alertData.upper_threshold ?? 0,
        alertData.lower_threshold ?? 0,
        alertData.last_alert_frequency ?? "daily",
        alertData.email_alert ?? [],
        alertData.sms_alert ?? []
      );

      const data = await fetchFavoriteStocks(true);
      setAlerts(data);

      if (data) {
        const cacheData = data.map(item => ({
          guid: item.fav_stocks_guid,
          label: item.stock_name,
          name: item.stock_name
        }));
        localStorage.setItem("favorite_stocks", JSON.stringify(cacheData));
      }

      localStorage.removeItem("monitoring_data");
      localStorage.removeItem("monitoring_last_updated");

      setIsModalOpen(false);
      setToast({
        type: "success",
        message: editingAlert ? "Alert updated successfully!" : "Alert created successfully!",
      });
    } catch (err) {
      console.error("Error saving alert:", err);
      setToast({ type: "error", message: "Failed to save alert. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };


  const handleDelete = async (guid: string) => {
    try {
      await deleteAlert(guid);
      setAlerts(alerts.filter(a => a.fav_stocks_guid !== guid));
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Failed to delete alert");
    }
  };

  const handleToggleStatus = async (guid: string) => {
    const alert = alerts.find(a => a.fav_stocks_guid === guid);
    if (!alert) return;

    try {
      const newStatus = !alert.monitored;
      await updateAlertStatus(guid, newStatus);
      setAlerts(alerts.map(a =>
        a.fav_stocks_guid === guid ? { ...a, monitored: newStatus } : a
      ));
    } catch (err) {
      console.error("Error updating alert status:", err);
      setError("Failed to update alert status");
    }
  };

  // Safe filtering with null checks
  const filteredAlerts = alerts.filter(a => {
    if (!a || !a.stock_name) return false;
    return a.stock_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate stats with null checks
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(a => a && a.monitored).length;
  const pausedAlerts = alerts.filter(a => a && !a.monitored).length;

  const renderEmptyState = () => (
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
          <Bell className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-red-500' : 'text-neutral-600'
            }`} />
          <motion.div
            className={`absolute inset-0 rounded-2xl border-2 ${isDarkMode ? 'border-red-500/30' : 'border-neutral-400/30'}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div>
          <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>No Alerts Configured</h3>
          <p className={`max-w-md text-sm sm:text-base font-medium leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
            }`}>
            Create your first alert to get notified about stock price changes and market signals.
          </p>
        </div>
        <motion.button
          onClick={() => handleOpenModal()}
          className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base ${isDarkMode
            ? 'bg-red-800 text-white hover:bg-red-700'
            : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          whileTap={{ scale: 0.97 }}
        >
          Create Alert
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div className={`relative flex flex-col h-screen w-full overflow-hidden transition-all duration-500 font-inter antialiased ${isDarkMode
      ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
      : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
      }`}>
      {/* Enhanced Professional Background - Same as Landing Page */}
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
        /* DESKTOP HEADER */
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
                <Bell className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-red-400' : 'text-neutral-900'
                  }`} />
              </div>
              <div>
                <div className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  Alert
                </div>
                <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                  }`}>Smart Notifications</div>
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
              <Menu className="h-5 w-5 sm:h-6" />
            </motion.button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT LAYOUT */}
      <main className={`flex-1 min-h-0 ${isMobile ? 'flex flex-col pb-20' : 'px-4 sm:px-8 lg:px-12 py-6 sm:py-8'}`}>

        {/* MOBILE HORIZONTAL STATS BAR */}
        {isMobile && (
          <div className={`border-b backdrop-blur-xl flex-shrink-0 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/80'
            }`}>
            <div className="px-4 py-3">
              {/* Stats Cards - Mobile Horizontal Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                <motion.div
                  className={`flex-shrink-0 w-32 p-3 rounded-xl border transition-all duration-300 ${isDarkMode
                    ? 'bg-slate-900/60 border-neutral-700/50'
                    : 'bg-white/80 border-neutral-200/60'
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'
                      }`}>
                      {totalAlerts}
                    </div>
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Total Alerts
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`flex-shrink-0 w-32 p-3 rounded-xl border transition-all duration-300 ${isDarkMode
                    ? 'bg-slate-900/60 border-green-700/50'
                    : 'bg-white/80 border-green-200/60'
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {activeAlerts}
                    </div>
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Active Alerts
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`flex-shrink-0 w-32 p-3 rounded-xl border transition-all duration-300 ${isDarkMode
                    ? 'bg-slate-900/60 border-orange-700/50'
                    : 'bg-white/80 border-orange-200/60'
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {pausedAlerts}
                    </div>
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Paused Alerts
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Mobile Search and Add Alert */}
              <div className="mt-3 flex gap-2">
                <div className="flex-1 relative">
                  <Search className={`w-4 h-4 absolute left-3 top-3 opacity-40 ${isDarkMode ? 'text-white' : 'text-neutral-600'}`} />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all placeholder-opacity-60 ${isDarkMode
                      ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                      : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                      } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                  />
                </div>
                <motion.button
                  onClick={() => handleOpenModal()}
                  className={`px-3 py-2.5 rounded-xl transition-all duration-300 font-bold shadow-md text-sm ${isDarkMode
                    ? 'bg-red-800 text-white hover:bg-red-700'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                    }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <BellPlus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP AND MOBILE CONTENT */}
        <div className={`${isMobile ? 'flex-1 min-h-0' : 'h-full'}`}>
          {!isMobile && (
            /* DESKTOP TOP BAR */
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  Alert Center
                </h1>
                <p className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                  }`}>
                  Manage your stock alerts and notifications
                </p>
              </div>
              <motion.button
                onClick={() => handleOpenModal()}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl text-sm sm:text-base ${isDarkMode
                  ? 'bg-red-800 text-white hover:bg-red-700'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                whileTap={{ scale: 0.97 }}
              >
                <BellPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add New Alert
              </motion.button>
            </div>
          )}

          {!isMobile && (
            /* DESKTOP STATS CARDS */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                className={`p-4 sm:p-6 rounded-2xl border shadow-sm backdrop-blur-xl ${isDarkMode
                  ? 'bg-slate-900/60 border-neutral-700/50'
                  : 'bg-white/90 border-neutral-200/60'
                  }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-neutral-100/80'
                    }`}>
                    <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-neutral-600'
                      }`} />
                  </div>
                  <div>
                    <div className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'
                      }`}>
                      {totalAlerts}
                    </div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Total Alerts
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`p-4 sm:p-6 rounded-2xl border shadow-sm backdrop-blur-xl ${isDarkMode
                  ? 'bg-slate-900/60 border-green-700/50'
                  : 'bg-white/90 border-green-200/60'
                  }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-900/20' : 'bg-green-100/80'
                    }`}>
                    <Play className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      {activeAlerts}
                    </div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Active Alerts
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`p-4 sm:p-6 rounded-2xl border shadow-sm backdrop-blur-xl ${isDarkMode
                  ? 'bg-slate-900/60 border-orange-700/50'
                  : 'bg-white/90 border-orange-200/60'
                  }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-100/80'
                    }`}>
                    <Pause className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                      {pausedAlerts}
                    </div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Paused Alerts
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {!isMobile && (
            /* DESKTOP SEARCH BAR */
            <div className="mb-6 sm:mb-8">
              <div className="relative max-w-md">
                <Search className={`w-5 h-5 absolute left-4 top-4 opacity-40 ${isDarkMode ? 'text-white' : 'text-neutral-600'}`} />
                <input
                  type="text"
                  placeholder="Search for alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border text-sm sm:text-base transition-all placeholder-opacity-60 ${isDarkMode
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                    : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                    } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                />
              </div>
            </div>
          )}

          {/* ALERTS LIST CONTENT */}
          {loading ? (
            <div className={`flex items-center justify-center ${isMobile ? 'flex-1' : 'h-96'} rounded-2xl border backdrop-blur-xl ${isDarkMode
              ? 'border-neutral-700/50 bg-slate-900/60'
              : 'border-neutral-200/60 bg-white/95'
              }`}>
              <div className="text-center">
                <motion.div
                  className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>Loading alerts...</p>
              </div>
            </div>
          ) : error ? (
            <div className={`flex items-center justify-center ${isMobile ? 'flex-1' : 'h-96'} rounded-2xl border backdrop-blur-xl ${isDarkMode
              ? 'border-red-700/50 bg-red-900/20'
              : 'border-red-200/60 bg-red-50/95'
              }`}>
              <div className="text-center">
                <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                <p className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                  Error loading alerts: {error}
                </p>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className={`${isMobile ? 'flex-1 overflow-y-auto p-4' : 'space-y-4'}`}>
              {isMobile ? (
                /* MOBILE CARDS LAYOUT */
                <div className="space-y-3">
                  {filteredAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.fav_stocks_guid}
                      className={`p-4 rounded-xl border transition-all duration-300 ${isDarkMode
                        ? 'bg-slate-900/60 border-neutral-700/50'
                        : 'bg-white/80 border-neutral-200/60'
                        }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                            {alert.stock_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${alert.monitored
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              }`}>
                              {alert.monitored ? (
                                <Play className="w-3 h-3 mr-1" />
                              ) : (
                                <Pause className="w-3 h-3 mr-1" />
                              )}
                              {alert.monitored ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(alert.fav_stocks_guid)}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                              ? 'hover:bg-white/10 text-white/70'
                              : 'hover:bg-neutral-100 text-neutral-500'
                              }`}
                          >
                            {alert.monitored ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenModal(alert)}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                              ? 'hover:bg-white/10 text-white/70'
                              : 'hover:bg-neutral-100 text-neutral-500'
                              }`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(alert.fav_stocks_guid)}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode
                              ? 'hover:bg-red-900/20 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                              }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {alert.upper_threshold && (
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-white/60' : 'text-neutral-600'}>Upper:</span>
                            <span className={isDarkMode ? 'text-white' : 'text-neutral-900'}>{alert.upper_threshold}</span>
                          </div>
                        )}
                        {alert.lower_threshold && (
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-white/60' : 'text-neutral-600'}>Lower:</span>
                            <span className={isDarkMode ? 'text-white' : 'text-neutral-900'}>{alert.lower_threshold}</span>
                          </div>
                        )}
                        {alert.email_alert && alert.email_alert.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className={isDarkMode ? 'text-white/60' : 'text-neutral-600'}>
                              {alert.email_alert.length} email(s)
                            </span>
                          </div>
                        )}
                        {alert.sms_alert && alert.sms_alert.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span className={isDarkMode ? 'text-white/60' : 'text-neutral-600'}>
                              {alert.sms_alert.length} SMS
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* DESKTOP TABLE LAYOUT */
                <div className={`rounded-2xl border shadow-lg backdrop-blur-xl overflow-hidden ${isDarkMode
                  ? 'border-neutral-700/50 bg-slate-900/60'
                  : 'border-neutral-200/60 bg-white/95'
                  }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${isDarkMode ? 'bg-slate-900/80' : 'bg-neutral-50/80'
                        }`}>
                        <tr>
                          <th className={`px-6 py-4 text-left text-sm font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                            Stock Name
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                            Status
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                            Thresholds
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                            Notifications
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-bold tracking-wider ${isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200/50 dark:divide-neutral-700/50">
                        {filteredAlerts.map((alert, index) => (
                          <motion.tr
                            key={alert.fav_stocks_guid}
                            className={`transition-colors hover:bg-neutral-50/50 dark:hover:bg-slate-800/50`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4">
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-neutral-900'
                                }`}>
                                {alert.stock_name}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${alert.monitored
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                }`}>
                                {alert.monitored ? (
                                  <Play className="w-3 h-3 mr-1" />
                                ) : (
                                  <Pause className="w-3 h-3 mr-1" />
                                )}
                                {alert.monitored ? 'Active' : 'Paused'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {alert.upper_threshold && (
                                  <div className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-neutral-700'
                                    }`}>
                                    Upper: {alert.upper_threshold}
                                  </div>
                                )}
                                {alert.lower_threshold && (
                                  <div className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-neutral-700'
                                    }`}>
                                    Lower: {alert.lower_threshold}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {alert.email_alert && alert.email_alert.length > 0 && (
                                  <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-1 text-blue-500" />
                                    <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                      }`}>
                                      {alert.email_alert.length}
                                    </span>
                                  </div>
                                )}
                                {alert.sms_alert && alert.sms_alert.length > 0 && (
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1 text-green-500" />
                                    <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                                      }`}>
                                      {alert.sms_alert.length}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleStatus(alert.fav_stocks_guid)}
                                  className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-white/10 text-white/70'
                                    : 'hover:bg-neutral-100 text-neutral-500'
                                    }`}
                                  title={alert.monitored ? 'Pause Alert' : 'Resume Alert'}
                                >
                                  {alert.monitored ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleOpenModal(alert)}
                                  className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-white/10 text-white/70'
                                    : 'hover:bg-neutral-100 text-neutral-500'
                                    }`}
                                  title="Edit Alert"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(alert.fav_stocks_guid)}
                                  className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-red-900/20 text-red-400'
                                    : 'hover:bg-red-50 text-red-600'
                                    }`}
                                  title="Delete Alert"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Backdrop and Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsPanelOpen(false)}
            />
            <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Alert Modal */}
      {isModalOpen && (
        <AlertModal
          alert={editingAlert}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAlert}
          isSaving={isSaving}
        />
      )}
      <Dock />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Enhanced Custom Scrollbar Styles */}
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
}

// --- Enhanced Modal Component with Landing Page Theme ---
function AlertModal({
  alert,
  onClose,
  onSave,
  isSaving
}: {
  alert: Alert | null;
  onClose: () => void;
  onSave: (data: Partial<Alert>) => void;
  isSaving: boolean;
}) {
  const { isDarkMode } = useTheme();
  const [availableStocks, setAvailableStocks] = useState<{ guid: string, label: string }[]>([]);
  const [formData, setFormData] = useState({
    stock_guid: alert?.fav_stocks_guid || '',
    stock_name: alert?.stock_name || '',
    upper_threshold: alert?.upper_threshold?.toString() || '',
    lower_threshold: alert?.lower_threshold?.toString() || '',
    email_alert: alert?.email_alert?.filter(email => email !== "string").join(', ') || '',
    sms_alert: alert?.sms_alert?.filter(sms => sms !== "string").join(', ') || '',
    last_alert_frequency: alert?.last_alert_frequency || 'daily',
  });
  const [error, setError] = useState('');

  // Load available stocks from session storage
  useEffect(() => {
    try {
      const favoriteStocks = localStorage.getItem("favorite_stocks");
      if (favoriteStocks) {
        const stocks = JSON.parse(favoriteStocks);
        const stockOptions = stocks.map((stock: any) => ({
          guid: stock.guid,
          label: stock.label || stock.name || `Stock ${stock.guid.slice(0, 8)}`
        }));
        setAvailableStocks(stockOptions);
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      setAvailableStocks([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'stock_guid') {
      // When stock is selected, also update stock_name for display
      const selectedStock = availableStocks.find(stock => stock.guid === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        stock_name: selectedStock?.label || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { stock_guid, upper_threshold, lower_threshold, email_alert, sms_alert } = formData;

    if (!stock_guid) {
      setError('Please select a stock');
      return;
    }

    if (!upper_threshold && !lower_threshold) {
      setError('At least one threshold is required');
      return;
    }

    const processedData: Partial<Alert> = {
      fav_stocks_guid: stock_guid,
      stock_name: formData.stock_name,
      upper_threshold: upper_threshold ? parseFloat(upper_threshold) : undefined,
      lower_threshold: lower_threshold ? parseFloat(lower_threshold) : undefined,
      email_alert: email_alert ? email_alert.split(',').map(e => e.trim()).filter(e => e) : [],
      sms_alert: sms_alert ? sms_alert.split(',').map(s => s.trim()).filter(s => s) : [],
      last_alert_frequency: formData.last_alert_frequency as any,
      monitored: true
    };

    onSave(processedData);
  };

  // Helper class for options to ensure they have solid background
  const optionClass = isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-neutral-900';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        className={`w-full max-w-md rounded-2xl border shadow-2xl backdrop-blur-xl ${isDarkMode
          ? 'bg-slate-900/95 border-neutral-700/50'
          : 'bg-white/95 border-neutral-200/60'
          }`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        <div className={`p-6 border-b ${isDarkMode ? 'border-neutral-700/50' : 'border-neutral-200/60'
          }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
              {alert ? 'Edit Alert' : 'Create New Alert'}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDarkMode
                ? 'hover:bg-white/10 text-white/70'
                : 'hover:bg-neutral-100 text-neutral-500'
                }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <motion.div
              className="p-3 rounded-xl bg-red-100 border border-red-200 text-red-800 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Stock Selection Dropdown */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
              Stock Name
            </label>
            <select
              name="stock_guid"
              value={formData.stock_guid}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                ? 'bg-white/5 border-white/20 text-white focus:bg-white/10 focus:border-white/30'
                : 'bg-white/60 border-neutral-200/60 text-neutral-800 focus:bg-white/80 focus:border-neutral-300/80'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              required
            >
              <option value="" disabled className={optionClass}>
                {availableStocks.length > 0 ? 'Select a stock...' : 'No stocks available'}
              </option>
              {availableStocks.map((stock) => (
                <option key={stock.guid} value={stock.guid} className={optionClass}>
                  {stock.label}
                </option>
              ))}
            </select>
            {availableStocks.length === 0 && (
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/60' : 'text-neutral-500'}`}>
                Add stocks to favorites first to create alerts
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}>
                Upper Threshold
              </label>
              <input
                type="number"
                step="0.01"
                name="upper_threshold"
                value={formData.upper_threshold}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                  ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                  : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                }`}>
                Lower Threshold
              </label>
              <input
                type="number"
                step="0.01"
                name="lower_threshold"
                value={formData.lower_threshold}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                  ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                  : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
              Email Alerts (comma-separated)
            </label>
            <input
              type="text"
              name="email_alert"
              value={formData.email_alert}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
              SMS Alerts (comma-separated)
            </label>
            <input
              type="text"
              name="sms_alert"
              value={formData.sms_alert}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-white/30'
                : 'bg-white/60 border-neutral-200/60 text-neutral-800 placeholder-neutral-400 focus:bg-white/80 focus:border-neutral-300/80'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              placeholder="+1234567890, +0987654321"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
              Alert Frequency
            </label>
            <select
              name="last_alert_frequency"
              value={formData.last_alert_frequency}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border transition-all ${isDarkMode
                ? 'bg-white/5 border-white/20 text-white focus:bg-white/10 focus:border-white/30'
                : 'bg-white/60 border-neutral-200/60 text-neutral-800 focus:bg-white/80 focus:border-neutral-300/80'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
            >
              {/* Applied optionClass here as well */}
              <option value="immediate" className={optionClass}>Immediate</option>
              <option value="hourly" className={optionClass}>Hourly</option>
              <option value="daily" className={optionClass}>Daily</option>
              <option value="weekly" className={optionClass}>Weekly</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${isDarkMode
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableStocks.length === 0 || isSaving}
              aria-busy={isSaving}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDarkMode
                  ? "bg-red-800 text-white hover:bg-red-700"
                  : "bg-neutral-800 text-white hover:bg-neutral-700"
                }`}
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{alert ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{alert ? "Update Alert" : "Create Alert"}</span>
              )}
            </button>

          </div>
        </form>
      </motion.div>
    </div>
  );
}
