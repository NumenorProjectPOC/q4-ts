import React, { useEffect, useState } from "react";
import { fetchOrgUsers, shareStockWithUser, shareSavedModel } from "../../services/quantiforeApi";
import Toast from "../ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Users, Check, Loader, Mail, UserPlus, Send } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface User {
  name: string;
  userId: string;
  email: string;
}

interface ShareModalProps {
  isStock: boolean;
  title?: string;
  itemLabel: string;
  itemGuid: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isStock, 
  title = "Share", 
  itemLabel, 
  itemGuid, 
  onClose 
}) => {
  const { isDarkMode } = useTheme();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingEmail, setSharingEmail] = useState<string | null>(null);
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetched = await fetchOrgUsers();

        // Get current user info from multiple possible sessionStorage keys
        const currentUserName = localStorage.getItem("username")?.trim();
        const currentUserEmail = localStorage.getItem("email")?.trim() || localStorage.getItem("user_email")?.trim();
        const currentUserId = localStorage.getItem("user_id")?.trim() || localStorage.getItem("userId")?.trim();

        console.log("Current user info from sessionStorage:", {
          username: currentUserName,
          email: currentUserEmail,
          userId: currentUserId
        });

        // Filter out the current user using multiple comparison methods
        const formatted = fetched
          .filter(user => {
            // Normalize strings for comparison (trim and lowercase)
            const userName = user.name?.trim().toLowerCase();
            const userEmail = user.email?.trim().toLowerCase();
            const userId = user.user_id?.toString().trim();

            const sessionUserName = currentUserName?.toLowerCase();
            const sessionUserEmail = currentUserEmail?.toLowerCase();
            const sessionUserId = currentUserId?.toString();

            // Check if this user matches the current logged-in user
            const isCurrentUser = (
              (userName && sessionUserName && userName === sessionUserName) ||
              (userEmail && sessionUserEmail && userEmail === sessionUserEmail) ||
              (userId && sessionUserId && userId === sessionUserId)
            );

            if (isCurrentUser) {
              console.log("Filtering out current user:", user);
            }

            return !isCurrentUser;
          })
          .map(user => ({
            name: user.name,
            userId: user.user_id,
            email: user.email
          }));

        console.log("Filtered users (excluding current user):", formatted);
        setUsers(formatted);
      } catch (err) {
        console.error("Failed to load users for sharing", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleShare = async (userId: string, name: string, email?: string) => {
    try {
      setSharingEmail(userId);

      if (isStock) {
        await shareStockWithUser(userId, itemGuid);
      } else {
        await shareSavedModel(userId, itemGuid);
      }

      setSharedEmails((prev) => [...prev, userId]);
      setToastMessage(
        `${isStock ? "Stock" : "Model"} shared with ${name} successfully!`
      );
    } catch (err) {
      console.error("Failed to share", err);
      setToastMessage(`Failed to share with ${name}`);
    } finally {
      setSharingEmail(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className={`relative rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden border backdrop-blur-xl ${
              isDarkMode
                ? 'bg-slate-900/95 border-neutral-800/50'
                : 'bg-white/95 border-neutral-200/50'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Minimal Header */}
            <div className={`relative px-6 py-5 border-b ${
              isDarkMode ? 'border-neutral-800/50' : 'border-neutral-200/50'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-2xl ${
                    isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                  }`}>
                    <Share2 className={`w-6 h-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {title} {isStock ? 'Stock' : 'Model'}
                    </h2>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`}>
                      Share <span className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`}>{itemLabel}</span> with your team
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-white/60 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Stats Bar - Clean Design */}
              <div className="flex items-center gap-4 text-sm mt-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  isDarkMode 
                    ? 'bg-slate-800/50 text-white/80' 
                    : 'bg-gray-100/80 text-gray-600'
                }`}>
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{users.length} members</span>
                </div>
                {sharedEmails.length > 0 && (
                  <motion.div 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      isDarkMode 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-green-50 text-green-700 border border-green-200/60'
                    }`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-medium">{sharedEmails.length} shared</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* User List Section - Clean Design */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-12"
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                        isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100/80'
                      }`}>
                        <Loader className={`w-6 h-6 animate-spin ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                      </div>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Loading team members...</span>
                    </div>
                  </motion.div>
                ) : users.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
                      isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100/80'
                    }`}>
                      <UserPlus className={`w-8 h-8 ${
                        isDarkMode ? 'text-white/40' : 'text-gray-400'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>No team members found</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`}>
                      Invite colleagues to your organization to start sharing
                    </p>
                  </motion.div>
                ) : (
                  users.map((user, index) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`group relative p-4 rounded-2xl transition-all duration-300 border ${
                        sharedEmails.includes(user.userId)
                          ? isDarkMode
                            ? "bg-green-500/10 border-green-500/20"
                            : "bg-green-50 border-green-200/60"
                          : isDarkMode
                            ? "bg-slate-800/40 hover:bg-slate-800/60 border-neutral-700/50 hover:border-neutral-600/70"
                            : "bg-white/80 hover:bg-white border-neutral-200/60 hover:border-blue-300/60 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Clean Avatar */}
                          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${
                            sharedEmails.includes(user.userId)
                              ? isDarkMode
                                ? "bg-green-500/20 text-green-300"
                                : "bg-green-100 text-green-700"
                              : isDarkMode
                                ? "bg-slate-700/50 text-white/80"
                                : "bg-gray-100 text-gray-700"
                          }`}>
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>

                          {/* User Info - Clean Design */}
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold truncate ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {user.name}
                            </div>
                            <div className={`text-sm truncate flex items-center gap-1 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-500'
                            }`}>
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button - Clean Design */}
                        <div className="flex-shrink-0">
                          {sharedEmails.includes(user.userId) ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
                                isDarkMode
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              <span>Shared</span>
                            </motion.div>
                          ) : (
                            <motion.button
                              onClick={() => handleShare(user.userId, user.name)}
                              disabled={sharingEmail === user.userId}
                              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                sharingEmail === user.userId
                                  ? isDarkMode
                                    ? "bg-slate-700/50 text-white/50 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                              }`}
                              whileHover={sharingEmail !== user.userId ? { scale: 1.05 } : {}}
                              whileTap={sharingEmail !== user.userId ? { scale: 0.95 } : {}}
                            >
                              {sharingEmail === user.userId ? (
                                <div className="flex items-center gap-2">
                                  <Loader className="w-4 h-4 animate-spin" />
                                  <span>Sharing...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Send className="w-4 h-4" />
                                  <span>Share</span>
                                </div>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastMessage.includes("successfully") ? "success" : "error"}
          onClose={() => setToastMessage(null)}
        />
      )}

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
    </>
  );
};

export default ShareModal;