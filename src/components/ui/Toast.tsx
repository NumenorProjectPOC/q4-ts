import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

interface ToastProps {
  type?: "success" | "error" | "warning";
  message: string;
  onClose?: () => void;
  duration?: number;
}

const iconMap = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
};

const bgMap = {
  success: "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200",
  error: "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200",
  warning: "bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200",
};

const Toast: React.FC<ToastProps> = ({ type = "success", message, onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration]);

  // Cleanup after fade-out finishes
  useEffect(() => {
    if (!visible) {
      const cleanup = setTimeout(() => onClose?.(), 300); // match transition
      return () => clearTimeout(cleanup);
    }
  }, [visible, onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    }`}>
      <div className="flex items-center w-full max-w-xs p-4 mb-4 text-sm text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${bgMap[type]}`}>
          {iconMap[type]}
        </div>
        <div className="ms-3 text-sm font-medium">{message}</div>
        {onClose && (
          <button
            onClick={() => setVisible(false)}
            className="ms-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-gray-900 dark:text-gray-500 hover:dark:text-white rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center justify-center h-8 w-8"
          >
            <X className="w-3 h-3" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
