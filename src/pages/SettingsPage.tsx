// Enhanced Settings Page with Modern Theme-Responsive Design
import React, { useEffect, useState } from "react";
import { fetchOrgUsers, addOrgUser, removeOrgUser } from "../services/quantiforeApi";
import { formatStockName } from "../utils/utility";
import RightSidebar from "../components/RightSidebar";
import ThemeToggle from "../components/ui/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import Dock from "../components/ui/Dock";
import { 
  BarChart3, 
  Menu, 
  Settings as SettingsIcon, 
  Users, 
  Shield, 
  Share2, 
  Trash2, 
  UserPlus, 
  Crown,
  CheckCircle,
  Clock,
  Building,
  Activity
} from "lucide-react";
import { useTheme } from '../context/ThemeContext';

interface OrgUser {
  user_id: string;
  name: string;
  email: string;
}

const SettingsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const userRole = sessionStorage.getItem("role");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className={`h-screen flex flex-col transition-all duration-500 font-inter antialiased relative overflow-hidden ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
        : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
    }`}>
      
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${
          isDarkMode
            ? 'bg-gradient-to-br from-red-500 to-neutral-600'
            : 'bg-gradient-to-br from-red-400 to-neutral-400'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${
          isDarkMode
            ? 'bg-gradient-to-tr from-neutral-600 to-red-500'
            : 'bg-gradient-to-tr from-neutral-400 to-red-400'
        }`} />
      </div>

      {/* Enhanced Professional Header */}
      <header className={`flex items-center justify-between px-4 sm:px-8 lg:px-12 h-20 sm:h-24 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${
        isDarkMode
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
            <div className={`p-2 sm:p-3 rounded-xl shadow-lg ${
              isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-red-100 to-red-200'
            }`}>
              <SettingsIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                isDarkMode ? 'text-red-400' : 'text-red-700'
              }`} />
            </div>
            <div>
              <div className={`text-lg sm:text-xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
                Settings
              </div>
              <div className={`text-xs sm:text-sm font-medium ${
                isDarkMode ? 'text-white/70' : 'text-neutral-600'
              }`}>System Configuration</div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center space-x-3">
          {/* Live Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            isDarkMode
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
            <span className="hidden sm:inline">System Active</span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings Button */}
          <motion.button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all duration-200 shadow-sm border backdrop-blur-sm ${
              isDarkMode
                ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
            }`}
            aria-label="Open menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {userRole === "admin" ? <AdminSettings /> : <UserSettings />}
      </main>

      {/* Overlay Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        )}
      </AnimatePresence>

      <Dock />
    </div>
  );
};

const LicenseSection: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      className={`rounded-2xl sm:rounded-3xl shadow-lg border backdrop-blur-xl hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 ${
        isDarkMode
          ? 'bg-slate-900/60 border-neutral-700/50 hover:bg-slate-900/80'
          : 'bg-white/95 border-neutral-200/60 hover:bg-white'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl shadow-lg ${
          isDarkMode ? 'bg-green-500/20' : 'bg-gradient-to-r from-green-100 to-emerald-200'
        }`}>
          <Shield className={`w-6 h-6 ${
            isDarkMode ? 'text-green-400' : 'text-green-700'
          }`} />
        </div>
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>License Info</h2>
          <p className={`text-sm sm:text-base ${
            isDarkMode ? 'text-white/60' : 'text-gray-600'
          }`}>Your current subscription details</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className={`p-4 rounded-2xl border ${
          isDarkMode
            ? 'bg-green-900/20 border-green-800/30'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/60'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`w-4 h-4 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-green-300' : 'text-green-800'
            }`}>Type</span>
          </div>
          <p className={`text-lg font-bold ${
            isDarkMode ? 'text-green-200' : 'text-green-900'
          }`}>Professional</p>
        </div>
        
        <div className={`p-4 rounded-2xl border ${
          isDarkMode
            ? 'bg-blue-900/20 border-blue-800/30'
            : 'bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200/60'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-4 h-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>Expires On</span>
          </div>
          <p className={`text-lg font-bold ${
            isDarkMode ? 'text-blue-200' : 'text-blue-900'
          }`}>December 31, 2025</p>
        </div>
        
        <div className={`p-4 rounded-2xl border ${
          isDarkMode
            ? 'bg-green-900/20 border-green-800/30'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/60'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className={`w-4 h-4 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-green-300' : 'text-green-800'
            }`}>Status</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-green-200' : 'text-green-900'
            }`}>Active</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const UserSettings: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
      <LicenseSection />
      
      <motion.div 
        className={`rounded-2xl sm:rounded-3xl shadow-lg border backdrop-blur-xl hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 ${
          isDarkMode
            ? 'bg-slate-900/60 border-neutral-700/50 hover:bg-slate-900/80'
            : 'bg-white/95 border-neutral-200/60 hover:bg-white'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl shadow-lg ${
            isDarkMode ? 'bg-blue-500/20' : 'bg-gradient-to-r from-blue-100 to-blue-200'
          }`}>
            <Share2 className={`w-6 h-6 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-700'
            }`} />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Shared Favorite Stocks</h2>
            <p className={`text-sm sm:text-base ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            }`}>Stocks you've shared with team members</p>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {[
            { name: "Apple (AAPL)", sharedWith: "john@org.com", icon: "🍎" },
            { name: "Google (GOOGL)", sharedWith: "lisa@org.com", icon: "🔍" },
            { name: "Amazon (AMZN)", sharedWith: "david@org.com", icon: "📦" }
          ].map((stock, index) => (
            <motion.div 
              key={stock.name}
              className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/30'
                  : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200/60 hover:shadow-md'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-sm ${
                  isDarkMode ? 'bg-slate-800/50' : 'bg-white'
                }`}>
                  {stock.icon}
                </div>
                <div>
                  <p className={`font-bold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{stock.name}</p>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}>Shared with: {stock.sharedWith}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-200/60'
              }`}>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>Active</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <motion.div 
        className={`rounded-2xl sm:rounded-3xl shadow-lg border backdrop-blur-xl hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 ${
          isDarkMode
            ? 'bg-slate-900/60 border-neutral-700/50 hover:bg-slate-900/80'
            : 'bg-white/95 border-neutral-200/60 hover:bg-white'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl shadow-lg ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-gradient-to-r from-purple-100 to-purple-200'
          }`}>
            <BarChart3 className={`w-6 h-6 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-700'
            }`} />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Shared Models</h2>
            <p className={`text-sm sm:text-base ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            }`}>Analysis models shared with your team</p>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {[
            { name: "Apple (AAPL)", sharedWith: "john@org.com", icon: "📊" },
            { name: "Google (GOOGL)", sharedWith: "lisa@org.com", icon: "📈" },
            { name: "Amazon (AMZN)", sharedWith: "david@org.com", icon: "📉" }
          ].map((model, index) => (
            <motion.div 
              key={model.name}
              className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-purple-900/20 border-purple-800/30 hover:bg-purple-900/30'
                  : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200/60 hover:shadow-md'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-sm ${
                  isDarkMode ? 'bg-slate-800/50' : 'bg-white'
                }`}>
                  {model.icon}
                </div>
                <div>
                  <p className={`font-bold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{model.name}</p>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  }`}>Shared with: {model.sharedWith}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-200/60'
              }`}>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-800'
                }`}>Active</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const AdminSettings: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const organizationName = sessionStorage.getItem("organization_name") || "Organization";

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const users = await fetchOrgUsers(controller.signal);
        setOrgUsers(users);
      } catch (err) {
        console.error("Failed to load organization users:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
    return () => controller.abort();
  }, []);

  const handleRemoveUser = async (userId: string) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this user?");
    if (!confirmRemove) return;

    try {
      await removeOrgUser(userId);
      setOrgUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (err) {
      console.error("Error removing user:", err);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) {
      alert("Both name and email are required.");
      return;
    }

    setAdding(true);
    try {
      const newUser = await addOrgUser(newUserName, newUserEmail);
      setOrgUsers((prev) => [...prev, newUser]);
      setNewUserName("");
      setNewUserEmail("");
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to add user.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Organization Title */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={`p-4 rounded-3xl shadow-lg ${
            isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-red-100 to-red-200'
          }`}>
            <Building className={`w-8 h-8 ${
              isDarkMode ? 'text-red-400' : 'text-red-700'
            }`} />
          </div>
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold ${
              isDarkMode 
                ? 'bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent'
            }`}>
              {formatStockName(organizationName)}
            </h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            }`}>Organization Administration</p>
          </div>
        </div>
      </motion.div>

      <LicenseSection />

      <motion.div 
        className={`rounded-2xl sm:rounded-3xl shadow-lg border backdrop-blur-xl hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 ${
          isDarkMode
            ? 'bg-slate-900/60 border-neutral-700/50 hover:bg-slate-900/80'
            : 'bg-white/95 border-neutral-200/60 hover:bg-white'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className={`p-3 rounded-2xl shadow-lg ${
            isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-red-100 to-red-200'
          }`}>
            <Users className={`w-6 h-6 ${
              isDarkMode ? 'text-red-400' : 'text-red-700'
            }`} />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Organization Users</h2>
            <p className={`text-sm sm:text-base ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            }`}>Manage team members and their access</p>
          </div>
        </div>

        {/* Add New User Section */}
        <div className={`p-6 rounded-2xl border mb-8 ${
          isDarkMode
            ? 'bg-red-900/20 border-red-800/30'
            : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200/60'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className={`w-5 h-5 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <h3 className={`text-lg font-bold ${
              isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>Add New User</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                className={`w-full px-4 py-3 border rounded-xl transition-all font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-red-700/50 text-white placeholder-white/40 focus:bg-slate-800/80 focus:border-red-500/50'
                    : 'bg-white/90 border-red-200 text-gray-900 placeholder-gray-400 focus:border-red-300'
                }`}
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                className={`w-full px-4 py-3 border rounded-xl transition-all font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-red-700/50 text-white placeholder-white/40 focus:bg-slate-800/80 focus:border-red-500/50'
                    : 'bg-white/90 border-red-200 text-gray-900 placeholder-gray-400 focus:border-red-300'
                }`}
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <motion.button
                onClick={handleAddUser}
                disabled={adding || !newUserName || !newUserEmail}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl"
                whileHover={{ scale: adding ? 1 : 1.02 }}
                whileTap={{ scale: adding ? 1 : 0.98 }}
              >
                {adding ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Current Users</h3>
            <div className={`px-3 py-1.5 rounded-full ${
              isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'
            }`}>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>{orgUsers.length} users</span>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className={`font-medium ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Loading users...</p>
              </div>
            </div>
          ) : orgUsers.length > 0 ? (
            <div className="space-y-3">
              {orgUsers.map((user, index) => (
                <motion.div 
                  key={user.user_id}
                  className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl border transition-all duration-300 group ${
                    isDarkMode
                      ? 'bg-slate-800/40 border-neutral-700/50 hover:bg-slate-800/60 hover:shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200/60 hover:shadow-lg'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-bold text-base sm:text-lg ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{user.name}</p>
                      <p className={`text-sm flex items-center gap-1 ${
                        isDarkMode ? 'text-white/60' : 'text-gray-600'
                      }`}>
                        <span>✉</span>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleRemoveUser(user.user_id)}
                    className={`px-4 py-2 rounded-xl transition-all font-medium opacity-70 group-hover:opacity-100 flex items-center gap-2 shadow-sm hover:shadow-md ${
                      isDarkMode
                        ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'
              }`}>
                <Users className={`w-8 h-8 ${
                  isDarkMode ? 'text-white/40' : 'text-gray-400'
                }`} />
              </div>
              <p className={`font-medium ${
                isDarkMode ? 'text-white/70' : 'text-gray-500'
              }`}>No users found</p>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-white/50' : 'text-gray-400'
              }`}>Add your first team member above</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;