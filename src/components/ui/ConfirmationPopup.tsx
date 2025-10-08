import React from "react";
import { XCircle, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

interface ConfirmationPopupProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  type = "danger",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  const { isDarkMode } = useTheme();

  // Theme-aware configuration based on type
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: isDarkMode ? 'bg-red-900/30' : 'bg-gradient-to-br from-neutral-300 to-neutral-500',
          icon: Trash2,
          iconColor: isDarkMode ? 'text-red-400' : 'text-neutral-900',
          confirmBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
          ringColor: 'ring-red-500/20',
        };
      case "warning":
        return {
          iconBg: isDarkMode ? 'bg-orange-900/30' : 'bg-gradient-to-br from-orange-100 to-orange-200',
          icon: AlertTriangle,
          iconColor: isDarkMode ? 'text-orange-400' : 'text-orange-600',
          confirmBg: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
          ringColor: 'ring-orange-500/20',
        };
      default:
        return {
          iconBg: isDarkMode ? 'bg-blue-900/30' : 'bg-gradient-to-br from-blue-100 to-blue-200',
          icon: CheckCircle,
          iconColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          confirmBg: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
          ringColor: 'ring-blue-500/20',
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        style={{ zIndex: 9999 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className={`relative rounded-3xl shadow-2xl p-8 w-[90%] max-w-md space-y-6 border backdrop-blur-xl ${
            isDarkMode
              ? 'bg-slate-900/95 border-neutral-700/50 text-white'
              : 'bg-white/95 border-neutral-200/50 text-gray-900'
          }`}
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >

          <div className="relative text-center">
            {/* Enhanced Icon with Animation */}
            <motion.div 
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative overflow-hidden ${config.iconBg}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <IconComponent className={`w-8 h-8 ${config.iconColor} relative z-10`} />
              <motion.div
                className={`absolute inset-0 rounded-2xl border-2 ${config.iconColor.replace('text-', 'border-')}/30`}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5] 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            
            {/* Enhanced Typography */}
            <motion.h2 
              className={`text-xl sm:text-2xl font-bold mb-3 leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.h2>
            
            <motion.p 
              className={`leading-relaxed text-sm sm:text-base ${
                isDarkMode ? 'text-white/80' : 'text-gray-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>
          </div>

          {/* Enhanced Action Buttons */}
          <motion.div 
            className="flex justify-center gap-4 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={onCancel}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border-2 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:ring-4 ${
                isDarkMode
                  ? 'text-white/80 border-neutral-600/50 hover:border-neutral-500/70 hover:bg-slate-800/50 focus:ring-neutral-500/20'
                  : 'text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-300/20'
              }`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <XCircle className="w-4 h-4" />
              <span>{cancelText}</span>
            </motion.button>

            <motion.button
              onClick={onConfirm}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl focus:ring-4 ${config.confirmBg} ${config.ringColor}`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent className="w-4 h-4" />
              <span>{confirmText}</span>
            </motion.button>
          </motion.div>

        
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmationPopup;