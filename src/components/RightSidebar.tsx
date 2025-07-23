import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customContent?: React.ReactNode;
}

const RightSidebar = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username") || "Guest";
  const role = sessionStorage.getItem("role") || "User";

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const initials = username
    .split(" ")
    .map((word) => word[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed top-0 right-0 h-full w-[300px] z-50 bg-white/90 backdrop-blur-xl border-l border-white/50 shadow-2xl"
        >
          {/* Header with improved styling */}
          <div className="flex justify-between items-center border-b border-gray-200/50 px-6 py-5 bg-gradient-to-r from-slate-50/80 to-gray-50/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Menu</h3>
            <motion.button
              onClick={onClose}
              className="group relative w-8 h-8 rounded-full hover:bg-gray-100/80 transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <div className="p-6 flex flex-col h-full overflow-y-auto">
            {/* User Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-5 text-center mb-6 shadow-lg"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mx-auto flex items-center justify-center text-white text-xl font-bold shadow-lg ring-4 ring-white/30">
                {initials}
              </div>
              <div className="text-gray-900 font-bold mt-3 text-lg">{username}</div>
              <div className="text-sm text-gray-600 capitalize font-medium bg-gray-100/50 px-3 py-1 rounded-full inline-block mt-1">
                {role}
              </div>
            </motion.div>

            {/* Navigation Menu */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 flex-1"
            >
              <li>
                <motion.button
                  onClick={() => navigate("/home")}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-white/60 hover:backdrop-blur-sm text-gray-700 w-full transition-all duration-200 group border border-transparent hover:border-white/50 hover:shadow-md"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">⚙️</span>
                  <span className="font-medium">Admin Panel</span>
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/settings?tab=managers")}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-white/60 hover:backdrop-blur-sm text-gray-700 w-full transition-all duration-200 group border border-transparent hover:border-white/50 hover:shadow-md"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">👥</span>
                  <span className="font-medium">Managers</span>
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-white/60 hover:backdrop-blur-sm text-gray-700 w-full transition-all duration-200 group border border-transparent hover:border-white/50 hover:shadow-md"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">🔧</span>
                  <span className="font-medium">Settings</span>
                </motion.button>
              </li>
            </motion.ul>

            {/* Logout Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 pb-[60px]"
            >
              <motion.button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">🔓</span>
                <span>Logout</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.aside>
      )}
    </>
  );
};

export default RightSidebar;