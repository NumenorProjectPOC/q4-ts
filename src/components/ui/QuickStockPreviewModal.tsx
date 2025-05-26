import React from "react";

interface QuickStockPreviewModalProps {
  stock: { label: string; value: string };
  onClose: () => void;
}

const QuickStockPreviewModal: React.FC<QuickStockPreviewModalProps> = ({ stock, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-teal-700 mb-4">Preview: {stock.label}</h2>
        <p className="text-gray-700 text-sm mb-2"><strong>Stock name:</strong> {stock.value}</p>
        <p className="text-gray-500 text-sm italic">More metrics coming soon...</p>
      </div>
    </div>
  );
};

export default QuickStockPreviewModal;
