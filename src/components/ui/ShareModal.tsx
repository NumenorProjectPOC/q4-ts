import React, { useEffect, useState } from "react";
import { fetchOrgUsers, shareStockWithUser, shareSavedModel } from "../../services/quantiforeApi";
import Toast from "../ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Users, Check, Loader } from "lucide-react";

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

const ShareModal: React.FC<ShareModalProps> = ({ isStock, title = "Share", itemLabel, itemGuid, onClose }) => {
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
        const currentUserName = sessionStorage.getItem("username")?.trim();
        const currentUserEmail = sessionStorage.getItem("email")?.trim() || sessionStorage.getItem("user_email")?.trim();
        const currentUserId = sessionStorage.getItem("user_id")?.trim() || sessionStorage.getItem("userId")?.trim();

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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl p-0 max-w-md w-full max-h-[80vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section */}
            <div className="relative p-6 pb-4">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/40 to-pink-50/30 rounded-t-2xl" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/60 text-gray-500 hover:text-gray-700 transition-all duration-200 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Content */}
              <div className="relative flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {title} Model
                  </h2>
                  <p className="text-sm text-gray-600">
                    Share <span className="font-semibold text-blue-600">{itemLabel}</span> with your team
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="relative flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{users.length} team members</span>
                </div>
                {sharedEmails.length > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span>{sharedEmails.length} shared</span>
                  </div>
                )}
              </div>
            </div>

            {/* User List Section */}
            <div className="px-6 pb-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-8"
                  >
                    <div className="flex items-center gap-3">
                      <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-gray-600">Loading team members...</span>
                    </div>
                  </motion.div>
                ) : users.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No team members found</p>
                    <p className="text-sm text-gray-400">
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
                      className={`group relative p-4 rounded-xl transition-all duration-200 ${sharedEmails.includes(user.userId)
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60"
                          : "bg-white/80 hover:bg-white border border-gray-200/60 hover:border-blue-200/80 hover:shadow-md"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${sharedEmails.includes(user.userId)
                              ? "bg-green-100 text-green-700"
                              : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                            }`}>
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {sharedEmails.includes(user.userId) ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium"
                            >
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Shared</span>
                            </motion.div>
                          ) : (
                            <motion.button
                              onClick={() => handleShare(user.userId, user.name)}
                              disabled={sharingEmail === user.userId}
                              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${sharingEmail === user.userId
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                                }`}
                              whileHover={sharingEmail !== user.userId ? { scale: 1.05 } : {}}
                              whileTap={sharingEmail !== user.userId ? { scale: 0.95 } : {}}
                            >
                              {sharingEmail === user.userId ? (
                                <div className="flex items-center gap-2">
                                  <Loader className="w-3 h-3 animate-spin" />
                                  <span>Sharing...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Share2 className="w-3 h-3" />
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
    </>
  );
};

export default ShareModal;