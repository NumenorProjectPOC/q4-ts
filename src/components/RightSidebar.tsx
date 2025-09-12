// src/components/RightSidebar.tsx
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShieldCheck, Users, Settings as Cog, LogOut, X } from "lucide-react";
import ConfirmationPopup from "./ui/ConfirmationPopup"; // Add this import

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customContent?: React.ReactNode;
}

const Item = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ x: 6 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="group flex w-full items-center gap-4 rounded-2xl
               border border-brand-red-100 bg-brand-cream-50/80
               px-5 py-4 text-brand-black backdrop-blur-md transition-all shadow
               hover:bg-white hover:shadow-md"
  >
    <span className="text-brand-gray-700">{icon}</span>
    <span className="font-medium tracking-tight">{label}</span>
    <svg
      className="ml-auto h-4 w-4 text-brand-gray-500 transition-transform group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </motion.button>
);

export default function RightSidebar({ isOpen, onClose, customContent }: Props) {
  const nav = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Add this state
  const username = sessionStorage.getItem("username") || "Guest";
  const role = sessionStorage.getItem("role") || "User";
  const initials = username.split(" ").map((w) => w?.toUpperCase()).join("").slice(0, 2);

  // Add this function to handle logout confirmation
  const handleLogout = () => {
    sessionStorage.clear();
    nav("/");
    setShowLogoutConfirm(false);
    onClose(); // Close the sidebar after logout
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.aside
              key="sidebar"
              className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col
                         bg-white/90 backdrop-blur-xl shadow-2xl
                         border-l border-brand-red-100"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <div className="flex items-center justify-between border-b border-brand-red-100 px-6 py-5">
                <h3 className="text-lg font-semibold tracking-tight text-brand-black">Menu</h3>
                <motion.button whileHover={{ rotate: 90 }} className="rounded-full p-2 hover:bg-brand-cream-50" onClick={onClose}>
                  <X className="h-5 w-5 text-brand-gray-700" strokeWidth={2} />
                </motion.button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="rounded-3xl border border-brand-red-100 bg-brand-cream-50 p-6 text-center shadow">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red-700 text-2xl font-semibold text-white shadow-inner">
                    {initials}
                  </div>
                  <p className="mt-3 font-medium text-brand-black">{username}</p>
                  <span className="mt-1 inline-block rounded-full bg-brand-red-50 px-3 py-1 text-xs capitalize text-brand-gray-700 border border-brand-red-100">
                    {role}
                  </span>
                </div>

                <div className="space-y-3">
                  <Item label="Admin Panel" icon={<ShieldCheck size={20} />} onClick={() => nav("/home")} />
                  <Item label="Managers" icon={<Users size={20} />} onClick={() => nav("/settings?tab=managers")} />
                  <Item label="Settings" icon={<Cog size={20} />} onClick={() => nav("/settings")} />
                </div>

                {customContent && customContent}
              </div>

              <div className="border-t border-brand-red-100 bg-white/80 p-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowLogoutConfirm(true)} // Modified this line
                  className="flex w-full items-center justify-center gap-3
                             rounded-2xl bg-gradient-to-r from-brand-red-700 to-brand-red-800
                             px-6 py-3 font-medium text-white shadow-lg hover:shadow-xl"
                >
                  <LogOut size={18} />
                  Logout
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Add the confirmation popup */}
      {showLogoutConfirm && (
        <ConfirmationPopup
          title="Confirm Logout"
          message="Are you sure you want to log out? You will need to sign in again to access your account."
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
