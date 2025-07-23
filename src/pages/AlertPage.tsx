import React, { useState } from "react";
import { Search, BellPlus, Trash2, Edit, Pause, Play, Mail, Phone, X, AlertTriangle } from "lucide-react";
import DashboardSwitcher from "../components/ui/DashboardSwitcher";
import RightSidebar from "../components/RightSidebar";
import { AnimatePresence, motion } from "framer-motion";

// --- Data Structure and Mock Data ---
interface Alert {
  id: string;
  stockName: string;
  upperThreshold: number | null;
  lowerThreshold: number | null;
  endDate: string; // ISO date string
  email: string | null;
  sms: string | null;
  status: 'active' | 'paused';
}

const initialAlerts: Alert[] = [
  { id: crypto.randomUUID(), stockName: "AAPL", upperThreshold: 190, lowerThreshold: 170, endDate: "2024-12-31", email: "user@example.com", sms: null, status: 'active' },
  { id: crypto.randomUUID(), stockName: "TSLA", upperThreshold: 300, lowerThreshold: null, endDate: "2024-10-15", email: null, sms: "+15551234567", status: 'active' },
  { id: crypto.randomUUID(), stockName: "NVDA", upperThreshold: 950, lowerThreshold: 850, endDate: "2025-01-20", email: "user@example.com", sms: "+15551234567", status: 'paused' },
  { id: crypto.randomUUID(), stockName: "AMZN", upperThreshold: null, lowerThreshold: 175, endDate: "2024-11-01", email: "user@example.com", sms: null, status: 'active' },
];

// --- Main Component ---
export default function AlertPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenModal = (alert: Alert | null = null) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const handleSaveAlert = (alertData: Omit<Alert, 'id' | 'status'>) => {
    if (editingAlert) {
      // Editing existing alert
      setAlerts(alerts.map(a => a.id === editingAlert.id ? { ...editingAlert, ...alertData } : a));
    } else {
      // Adding new alert
      const newAlert: Alert = {
        ...alertData,
        id: crypto.randomUUID(),
        status: 'active',
      };
      setAlerts([newAlert, ...alerts]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
  };

  const filteredAlerts = alerts.filter(a =>
    a.stockName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 overflow-x-hidden">
      <DashboardSwitcher />
      <div className="flex flex-col h-screen">
        {/* Header with Dashboard Switcher */}
        <header className="shadow-sm border-b border-gray-200/80 px-6 py-4 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <img src="/qf-logo0.1.svg" alt="Quantifore Logo" className="h-8 w-auto mt-3" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Toolbar: Search and Add Button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for a stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <BellPlus size={18} />
                Add New Alert
              </button>
            </div>

            {/* Alerts Table */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50/50">
                    <tr>
                      <th className="p-4 text-sm font-semibold text-gray-600">Stock</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">Thresholds</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">Time Horizon</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">Notifications</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map((alert) => (
                        <tr key={alert.id} className="border-b border-gray-200/80 last:border-b-0 hover:bg-gray-100/50 transition-colors">
                          <td className="p-4 font-medium text-gray-800">{alert.stockName}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${alert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              <div className={`w-2 h-2 rounded-full ${alert.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                              {alert.status === 'active' ? 'Active' : 'Paused'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {alert.upperThreshold && <div>↑ Upper: {alert.upperThreshold}</div>}
                            {alert.lowerThreshold && <div>↓ Lower: {alert.lowerThreshold}</div>}
                          </td>
                          <td className="p-4 text-sm text-gray-600">{new Date(alert.endDate).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {alert.email && (
                                <span title={alert.email}>
                                  <Mail size={18} className="text-gray-500" />
                                </span>
                              )}
                              {alert.sms && (
                                <span title={alert.sms}>
                                  <Phone size={18} className="text-gray-500" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleToggleStatus(alert.id)} className="p-2 rounded-full hover:bg-gray-200 transition" title={alert.status === 'active' ? 'Pause Alert' : 'Resume Alert'}>
                                {alert.status === 'active' ? <Pause size={16} className="text-yellow-600" /> : <Play size={16} className="text-green-600" />}
                              </button>
                              <button onClick={() => handleOpenModal(alert)} className="p-2 rounded-full hover:bg-gray-200 transition" title="Edit Alert">
                                <Edit size={16} className="text-blue-600" />
                              </button>
                              <button onClick={() => handleDelete(alert.id)} className="p-2 rounded-full hover:bg-gray-200 transition" title="Delete Alert">
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-gray-500">
                          No alerts found. Add one to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Menu button*/}
      <motion.button
        className="fixed top-5 right-8 z-[60] p-2 rounded-full bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white/90 transition-all shadow-lg hover:scale-105"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isPanelOpen ? "Close menu" : "Open menu"}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isPanelOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            animate={{
              d: isPanelOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M4 6h16M4 12h16M4 18h16"
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.svg>
      </motion.button>

      {/* Backdrop and Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsPanelOpen(false)}
            />
            <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Alert Modal */}
      {isModalOpen && (
        <AlertModal
          alert={editingAlert}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAlert}
        />
      )}
    </div>
  );
}


// --- Modal Component for Adding/Editing Alerts ---
function AlertModal({ alert, onClose, onSave }: { alert: Alert | null, onClose: () => void, onSave: (data: Omit<Alert, 'id' | 'status'>) => void }) {
  const [formData, setFormData] = useState({
    stockName: alert?.stockName || '',
    upperThreshold: alert?.upperThreshold?.toString() || '',
    lowerThreshold: alert?.lowerThreshold?.toString() || '',
    endDate: alert?.endDate || new Date().toISOString().split('T')[0],
    email: alert?.email || '',
    sms: alert?.sms || '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { stockName, upperThreshold, lowerThreshold, endDate, email, sms } = formData;

    // Validation
    if (!stockName) { setError('Stock Name is required.'); return; }
    if (!upperThreshold && !lowerThreshold) { setError('At least one threshold (upper or lower) is required.'); return; }
    if (!email && !sms) { setError('At least one notification method (Email or SMS) is required.'); return; }
    if (!endDate) { setError('Alert End Date is required.'); return; }

    setError('');

    onSave({
      stockName: stockName.toUpperCase(),
      upperThreshold: upperThreshold ? parseFloat(upperThreshold) : null,
      lowerThreshold: lowerThreshold ? parseFloat(lowerThreshold) : null,
      endDate,
      email: email || null,
      sms: sms || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">{alert ? 'Edit Alert' : 'Create New Alert'}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={20} onClick={onClose} className="text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="stockName" className="block text-sm font-medium text-gray-700 mb-1">Stock Name</label>
              <input type="text" name="stockName" value={formData.stockName} onChange={handleChange} placeholder="e.g., GOOGL" className="w-full form-input" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="upperThreshold" className="block text-sm font-medium text-gray-700 mb-1">Upper Threshold (Optional)</label>
                <input type="number" name="upperThreshold" value={formData.upperThreshold} onChange={handleChange} placeholder="e.g., 200" className="w-full form-input" />
              </div>
              <div>
                <label htmlFor="lowerThreshold" className="block text-sm font-medium text-gray-700 mb-1">Lower Threshold (Optional)</label>
                <input type="number" name="lowerThreshold" value={formData.lowerThreshold} onChange={handleChange} placeholder="e.g., 150" className="w-full form-input" />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Alert End Date (Time Horizon)</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full form-input" required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Methods</h4>
              <p className="text-xs text-gray-500 mb-2">At least one method is required.</p>
              <div className="space-y-3">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" className="w-full form-input" />
                <input type="tel" name="sms" value={formData.sms} onChange={handleChange} placeholder="Enter phone number for SMS" className="w-full form-input" />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
          </div>
          <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700">Save Alert</button>
          </div>
        </form>
      </div>
    </div>
  );
}