import React from "react";
import { XCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ConfirmationPopupProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <motion.div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-sm text-gray-900 rounded-2xl shadow-2xl p-8 w-[90%] max-w-md space-y-6 border border-gray-200/50"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <motion.button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </motion.button>

          <motion.button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CheckCircle className="w-4 h-4 text-white" />
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationPopup;
