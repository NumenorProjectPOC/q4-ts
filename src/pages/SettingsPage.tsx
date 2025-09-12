import React, { useEffect, useState } from "react";
import { fetchOrgUsers, addOrgUser, removeOrgUser } from "../services/quantiforeApi";
import { formatStockName } from "../utils/utility";
import RightSidebar from "../components/RightSidebar";
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
  Building
} from "lucide-react";

interface OrgUser {
  user_id: string;
  name: string;
  email: string;
}

const SettingsPage: React.FC = () => {
  const userRole = sessionStorage.getItem("role");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 pb-20 antialiased relative overflow-hidden">
      {/* Background decoration - Matching other pages */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-red-400 to-orange-400 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-tr from-blue-400 to-purple-400 blur-3xl" />
      </div>

      {/* Header - Consistent with other pages */}
      <header className="flex items-center justify-between px-8 h-20 bg-white shadow-sm border-b border-gray-200/60 sticky top-0 z-30">
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-red-600" />
            <span className="text-lg font-semibold text-gray-900">Settings</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
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
      {userRole === "admin" ? <AdminSettings /> : <UserSettings />}

      {/* Overlay Sidebar */}
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

      <Dock />
    </div>
  );
};

const LicenseSection: React.FC = () => (
  <motion.div 
    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 p-8 hover:shadow-xl transition-all duration-300"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    whileHover={{ scale: 1.01, y: -2 }}
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">License Info</h2>
        <p className="text-gray-600">Your current subscription details</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/60">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Type</span>
        </div>
        <p className="text-lg font-bold text-green-900">Professional</p>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 rounded-xl border border-blue-200/60">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Expires On</span>
        </div>
        <p className="text-lg font-bold text-blue-900">December 31, 2025</p>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/60">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Status</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-lg font-bold text-green-900">Active</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const UserSettings: React.FC = () => (
  <main className="max-w-6xl mx-auto p-8 mt-8 space-y-8 relative z-10">
    <LicenseSection />
    
    <motion.div 
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 p-8 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shared Favorite Stocks</h2>
          <p className="text-gray-600">Stocks you've shared with team members</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {[
          { name: "Apple (AAPL)", sharedWith: "john@org.com", icon: "🍎" },
          { name: "Google (GOOGL)", sharedWith: "lisa@org.com", icon: "🔍" },
          { name: "Amazon (AMZN)", sharedWith: "david@org.com", icon: "📦" }
        ].map((stock, index) => (
          <motion.div 
            key={stock.name}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/60 hover:shadow-md transition-all duration-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                {stock.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900">{stock.name}</p>
                <p className="text-sm text-blue-600">Shared with: {stock.sharedWith}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-blue-200/60 rounded-full">
              <span className="text-xs font-medium text-blue-800">Active</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
    
    <motion.div 
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 p-8 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shared Models</h2>
          <p className="text-gray-600">Analysis models shared with your team</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {[
          { name: "Apple (AAPL)", sharedWith: "john@org.com", icon: "📊" },
          { name: "Google (GOOGL)", sharedWith: "lisa@org.com", icon: "📈" },
          { name: "Amazon (AMZN)", sharedWith: "david@org.com", icon: "📉" }
        ].map((model, index) => (
          <motion.div 
            key={model.name}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200/60 hover:shadow-md transition-all duration-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                {model.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900">{model.name}</p>
                <p className="text-sm text-purple-600">Shared with: {model.sharedWith}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-purple-200/60 rounded-full">
              <span className="text-xs font-medium text-purple-800">Active</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </main>
);

const AdminSettings: React.FC = () => {
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
    <main className="max-w-6xl mx-auto p-8 mt-8 space-y-8 relative z-10">
      {/* Organization Title */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent">
              {formatStockName(organizationName)}
            </h1>
            <p className="text-gray-600 mt-1">Organization Administration</p>
          </div>
        </div>
      </motion.div>

      <LicenseSection />

      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 p-8 hover:shadow-xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ scale: 1.01, y: -2 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization Users</h2>
            <p className="text-gray-600">Manage team members and their access</p>
          </div>
        </div>

        {/* Add New User Section */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-2xl border border-red-200/60 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Add New User</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-red-700">Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white/90 focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all font-medium"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-red-700">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white/90 focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all font-medium"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <motion.button
                onClick={handleAddUser}
                disabled={adding || !newUserName || !newUserEmail}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl"
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
            <h3 className="text-lg font-bold text-gray-900">Current Users</h3>
            <div className="px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-sm font-medium text-gray-600">{orgUsers.length} users</span>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 font-medium">Loading users...</p>
              </div>
            </div>
          ) : orgUsers.length > 0 ? (
            <div className="space-y-3">
              {orgUsers.map((user, index) => (
                <motion.div 
                  key={user.user_id}
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/60 hover:shadow-lg transition-all duration-300 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{user.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span>✉</span>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleRemoveUser(user.user_id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all font-medium opacity-70 group-hover:opacity-100 flex items-center gap-2 shadow-sm hover:shadow-md"
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No users found</p>
              <p className="text-sm text-gray-400">Add your first team member above</p>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default SettingsPage;