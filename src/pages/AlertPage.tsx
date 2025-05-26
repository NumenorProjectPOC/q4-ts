import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Trash2, BellPlus } from "lucide-react";

interface Alert {
  id: string;
  stock: string;
  threshold: number;
}

const initialAlerts: Alert[] = [
  { id: "1", stock: "AAPL", threshold: 150 },
  { id: "2", stock: "TSLA", threshold: 700 },
  { id: "3", stock: "MSFT", threshold: 320 },
];

export default function AlertPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [newStock, setNewStock] = useState("");
  const [newThreshold, setNewThreshold] = useState("");

  const handleRemove = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const handleAdd = () => {
    if (newStock && newThreshold) {
      setAlerts((prev) => [
        ...prev,
        { id: crypto.randomUUID(), stock: newStock, threshold: parseFloat(newThreshold) },
      ]);
      setNewStock("");
      setNewThreshold("");
    }
  };

  return (
    <div className="bg-teal-50 min-h-screen w-screen flex flex-col">
      <Navbar />
      <div className="p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Your Stock Alerts</h2>

          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex justify-between items-center px-4 py-3 rounded-lg bg-gradient-to-r from-teal-100 to-cyan-100 shadow-sm"
              >
                <div className="text-sm font-medium text-teal-900">
                  {alert.stock} → Target: <span className="font-bold">{alert.threshold}</span>
                </div>
                <button
                  onClick={() => handleRemove(alert.id)}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {alerts.length === 0 && (
              <p className="text-gray-500 text-sm text-center">No alerts set yet.</p>
            )}
          </ul>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-gray-700">Set New Alert</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Stock Symbol (e.g., AMZN)"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value.toUpperCase())}
              />
              <input
                type="number"
                placeholder="Threshold"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
              />
              <button
                onClick={handleAdd}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg shadow flex items-center justify-center gap-1 text-sm"
              >
                <BellPlus size={16} />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
