import React, { useEffect, useState } from "react";
import { fetchOrgUsers, shareStockWithUser, shareSavedModel } from "../../services/quantiforeApi";
import Toast from "../ui/Toast";

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
        const currentUserName = sessionStorage.getItem("username");

        // Filter out the current user
        const formatted = fetched
            .filter(user => user.name !== currentUserName)
            .map(user => ({ name: user.name, userId: user.user_id, email: user.email }));
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
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-4 overflow-y-auto max-h-[80vh] relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Modal Header */}
          <h2 className="text-xl font-semibold text-gray-800">
            {title} <span className="text-teal-600">{itemLabel}</span> with:
          </h2>

          {/* User List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center space-x-2 py-4">
                <div className="w-6 h-6 border-4 border-dashed border-teal-500 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No users found in your organization.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.userId}
                  className={`p-3 rounded-lg flex justify-between items-center bg-gray-50 border border-gray-200 hover:bg-teal-50 transition ${
                    sharedEmails.includes(user.userId) ? "bg-teal-100 border-teal-200" : ""
                  }`}
                >
                  <div>
                    <span className="text-gray-800 font-medium">{user.name}</span>
                    <br />
                    <span className="text-gray-500 text-xs">{user.email}</span>
                  </div>
                  {sharedEmails.includes(user.userId) ? (
                    <span className="text-xs text-green-600 font-semibold">Shared</span>
                  ) : (
                    <button
                      onClick={() => handleShare(user.userId, user.name)}
                      disabled={sharingEmail === user.userId}
                      className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sharingEmail === user.userId ? "Sharing..." : "Share"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </>
  );
};

export default ShareModal;
