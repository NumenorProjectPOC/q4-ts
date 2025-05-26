import React from "react";
import { XCircle, CheckCircle } from "lucide-react";

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
    <div style={{ zIndex: 9999 }} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900/80 text-white rounded-xl shadow-lg p-6 w-[90%] max-w-sm space-y-4 animate-fade-in-up">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-300">{message}</p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-800 transition"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg transition"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
