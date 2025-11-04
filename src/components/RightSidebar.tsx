// components/RightSidebar.tsx
import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Settings as Cog,
  LogOut,
  X,
  Bell,
  HelpCircle,
  Palette,
  Menu,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import ConfirmationPopup from "./ui/ConfirmationPopup";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customContent?: React.ReactNode;
}

const Item = ({
  label,
  description,
  icon,
  onClick,
  variant = "default",
}: {
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}) => {
  const { isDarkMode } = useTheme();

  return (
    <motion.button
      whileHover={{ x: 6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 shadow-sm
        ${variant === "danger"
          ? isDarkMode
            ? "bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400/50"
            : "bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300"
          : isDarkMode
            ? "bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600"
            : "bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
        } hover:shadow-md`}
    >
      <div
        className={`p-2 rounded-lg ${variant === "danger"
          ? isDarkMode
            ? "bg-red-500/20 text-red-400"
            : "bg-red-100 text-red-600"
          : isDarkMode
            ? "bg-neutral-700 text-neutral-300"
            : "bg-neutral-100 text-neutral-600"
          }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <span
          className={`block font-semibold tracking-tight ${variant === "danger"
            ? isDarkMode
              ? "text-red-300"
              : "text-red-700"
            : isDarkMode
              ? "text-white"
              : "text-neutral-900"
            }`}
        >
          {label}
        </span>
        {description && (
          <span
            className={`block text-xs mt-0.5 ${variant === "danger"
              ? isDarkMode
                ? "text-red-400/80"
                : "text-red-600/80"
              : isDarkMode
                ? "text-neutral-400"
                : "text-neutral-600"
              }`}
          >
            {description}
          </span>
        )}
      </div>
      <svg
        className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${variant === "danger"
          ? isDarkMode
            ? "text-red-400"
            : "text-red-600"
          : isDarkMode
            ? "text-neutral-500"
            : "text-neutral-400"
          }`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
};

export default function RightSidebar({ isOpen, onClose, customContent }: Props) {
  const nav = useNavigate();
  const { isDarkMode } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearCache, setShowClearCache] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const username = sessionStorage.getItem("username") || "User";
  const role = sessionStorage.getItem("role") || "Staff";
  const initials = username
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    localStorage.clear();
    nav("/");
    setShowLogoutConfirm(false);
    onClose();
  }, [nav, onClose]);

  const handleItemClick = (path: string) => {
    nav(path);
    onClose();
  };

  const clearAllCaches = () => {
    // LocalStorage keys to clear
    const localStorageKeys = [
      'favorite_stocks',
      'monitoring_data',
      'monitoring_last_updated'
    ];

    // SessionStorage keys to clear - including patterns
    const sessionStorageKeys = [
      // User data
      'favorite_stocks',
      'monitoring_data',
      'monitoring_last_updated',
      'saved_models',
      'selected_monitoring_data',

      // Graph visualization state
      'nodeColors',
      'userPinnedNodes',
      'nodePositions',
      'zoomTransform',

      // Alert and model data
      'visualizing_model_id',
    ];

    // Clear specific keys from localStorage
    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    // Clear specific keys from sessionStorage
    sessionStorageKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove sessionStorage key: ${key}`, error);
      }
    });

    // Clear ALL graph data caches (for all models)
    // Pattern: visualization_graph_data_*
    try {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (
          key.startsWith('visualization_graph_data_') ||
          key.startsWith('visualization_graph_data_timestamp_')
        ) {
          sessionStorage.removeItem(key);
          console.log(`Cleared cache: ${key}`);
        }
      });
    } catch (error) {
      console.error('Failed to clear visualization graph data caches:', error);
    }

    console.log('✅ All caches cleared successfully');

    // Close sidebar
    onClose();

    // Hard refresh to reset all UI state
    window.location.reload();
  };


  // Mobile Menu
  const MobileMenu = () => (
    <motion.div
      key="mobile-menu"
      className={`fixed inset-0 z-50 ${isDarkMode ? "bg-slate-900" : "bg-white"
        }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`flex items-center justify-between border-b px-4 py-4 ${isDarkMode ? "border-neutral-700" : "border-neutral-200"
          }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 flex items-center justify-center rounded-lg text-sm font-bold text-white bg-gradient-to-br from-red-600 to-red-700"
          >
            {initials}
          </div>
          <div>
            <p className={`font-semibold ${isDarkMode ? "text-white" : "text-neutral-900"}`}>
              {username}
            </p>
            <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-neutral-600"}`}>
              {role}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`rounded-full p-2 transition-colors ${isDarkMode
            ? "hover:bg-neutral-800 text-neutral-400 hover:text-white"
            : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
            }`}
          onClick={onClose}
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Item
          label="Settings"
          description="App preferences"
          icon={<Cog size={20} />}
          onClick={() => handleItemClick("/settings")}
        />
        <Item
          label="Appearance"
          description="Theme settings"
          icon={<Palette size={20} />}
          onClick={() => handleItemClick("/settings?tab=appearance")}
        />
        <Item
          label="Help & Support"
          description="Get assistance"
          icon={<HelpCircle size={20} />}
          onClick={() => handleItemClick("/help")}
        />
      </div>

      <div
        className={`border-t p-4 ${isDarkMode ? "border-neutral-700" : "border-neutral-200"
          }`}
      >
        <motion.button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode
            ? "bg-red-800 text-white hover:bg-red-700"
            : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-2 rounded-lg bg-white/20">
            <LogOut size={20} />
          </div>
          <div className="flex-1">
            <span className="block font-semibold">Sign Out</span>
            <span className="block text-sm opacity-80">End your session</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-60" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.aside
      key="desktop-sidebar"
      className={`fixed right-0 top-0 z-[90] flex h-full w-80 flex-col shadow-2xl border-l backdrop-blur-xl ${isDarkMode
        ? "bg-slate-900/95 border-neutral-700"
        : "bg-white/95 border-neutral-200"
        }`}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.4 }}
    >
      <div
        className={`flex items-center justify-between border-b px-6 py-5 ${isDarkMode ? "border-neutral-700 bg-slate-800/50" : "border-neutral-200 bg-neutral-50"
          }`}
      >
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-neutral-900"}`}>
          Account Menu
        </h3>
        <motion.button
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`rounded-full p-2 transition-colors ${isDarkMode
            ? "hover:bg-neutral-800 text-neutral-400 hover:text-white"
            : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
            }`}
          onClick={onClose}
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </motion.button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={`rounded-2xl p-6 text-center border backdrop-blur-xl ${isDarkMode
            ? "bg-gradient-to-br from-red-500/10 to-neutral-500/10 border-red-500/20"
            : "bg-gradient-to-br from-neutral-100 to-neutral-50 border-neutral-200/60"
            }`}
        >
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold shadow-lg ${isDarkMode
              ? "bg-red-800 text-white"
              : "bg-neutral-800 text-white"
              }`}
          >
            {initials}
          </div>
          <p className={`mt-3 font-semibold ${isDarkMode ? "text-white" : "text-neutral-900"}`}>
            {username}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize border ${isDarkMode
              ? "bg-neutral-700/30 text-neutral-300 border-neutral-600/40"
              : "bg-white text-neutral-600 border-neutral-200"
              }`}
          >
            {role}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="space-y-3"
        >
          <Item
            label="Settings"
            description="App preferences"
            icon={<Cog size={18} />}
            onClick={() => handleItemClick("/settings")}
          />
          <Item
            label="Appearance"
            description="Theme settings"
            icon={<Palette size={18} />}
            onClick={() => handleItemClick("/settings?tab=appearance")}
          />
          <Item
            label="Help & Support"
            description="Get assistance"
            icon={<HelpCircle size={18} />}
            onClick={() => handleItemClick("/help")}
          />

          <Item
            label="Clear Cache"
            description="Refresh local data"
            icon={<ShieldCheck size={18} />}
            onClick={() => setShowClearCache(true)}
            variant="danger"
          />
        </motion.div>

        {customContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {customContent}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className={`border-t p-6 ${isDarkMode ? "border-neutral-700 bg-slate-800/30" : "border-neutral-200 bg-neutral-50"
          }`}
      >
        <motion.button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode
            ? "bg-red-800 text-white hover:bg-red-700"
            : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-2 rounded-lg bg-white/20">
            <LogOut size={18} />
          </div>
          <div className="flex-1">
            <span className="block font-semibold">Sign Out</span>
            <span className="block text-xs opacity-80">Sign out of your account</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-60" />
        </motion.button>
      </motion.div>
    </motion.aside>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              className={`fixed inset-0 z-40 ${isDarkMode ? "bg-black/50" : "bg-black/25"
                }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={onClose}
            />

            {isMobile ? <MobileMenu /> : <DesktopSidebar />}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <ConfirmationPopup
            title="Confirm Sign Out"
            message="Are you sure you want to sign out? You will need to sign in again."
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
        {showClearCache && (
          <ConfirmationPopup
            title="Clear cache"
            message="Are you sure you want to clear all your cache?"
            onConfirm={clearAllCaches}
            onCancel={() => setShowClearCache(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
