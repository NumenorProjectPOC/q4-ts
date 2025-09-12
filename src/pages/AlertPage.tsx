import React, { useState, useEffect } from "react";
import { Search, BellPlus, Trash2, Edit, Pause, Play, Mail, Phone, X, AlertTriangle, Loader, Bell } from "lucide-react";
import RightSidebar from "../components/RightSidebar";
import { AnimatePresence, motion } from "framer-motion";
import Dock from "../components/ui/Dock";
import {
  fetchFavoriteStocks,
  updateAlertStatus,
  deleteAlert,
  createAlert,
  updateAlert,
  type FavoriteStockFull
} from "../services/quantiforeApi";


// --- Type definition (now using the full API response structure) ---
type Alert = FavoriteStockFull;


// --- Main Component ---
export default function AlertPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  // --- Fetch data on component mount ---
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use the full data version of fetchFavoriteStocks
        const data = await fetchFavoriteStocks(true);
        setAlerts(data);
      } catch (err) {
        console.error("Error loading alerts:", err);
        setError(err instanceof Error ? err.message : "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };


    loadAlerts();
  }, []);


  const handleOpenModal = (alert: Alert | null = null) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };


  const handleSaveAlert = async (alertData: Partial<Alert>) => {
    try {
      if (editingAlert) {
        // Update existing alert
        await updateAlert(editingAlert.fav_stocks_guid, alertData);
      } else {
        // Create new alert
        await createAlert(alertData);
      }

      // Refresh the data
      const data = await fetchFavoriteStocks(true);
      setAlerts(data);
    } catch (err) {
      console.error("Error saving alert:", err);
      setError("Failed to save alert");
    }
    setIsModalOpen(false);
  };


  const handleDelete = async (guid: string) => {
    try {
      await deleteAlert(guid);
      setAlerts(alerts.filter(a => a.fav_stocks_guid !== guid));
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Failed to delete alert");
    }
  };


  const handleToggleStatus = async (guid: string) => {
    const alert = alerts.find(a => a.fav_stocks_guid === guid);
    if (!alert) return;


    try {
      const newStatus = !alert.monitored;
      await updateAlertStatus(guid, newStatus);
      setAlerts(alerts.map(a =>
        a.fav_stocks_guid === guid ? { ...a, monitored: newStatus } : a
      ));
    } catch (err) {
      console.error("Error updating alert status:", err);
      setError("Failed to update alert status");
    }
  };


  // Safe filtering with null checks
  const filteredAlerts = alerts.filter(a => {
    if (!a || !a.stock_name) return false;
    return a.stock_name.toLowerCase().includes(searchTerm.toLowerCase());
  });


  // Calculate stats with null checks
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(a => a && a.monitored).length;
  const pausedAlerts = alerts.filter(a => a && !a.monitored).length;

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 text-brand-black">
      {/* Background decoration - Matching other pages */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-red-400 to-orange-400 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-tr from-blue-400 to-purple-400 blur-3xl" />
      </div>

      {/* Header - Matching Monitoring Page Style */}
      <header className="flex items-center justify-between px-8 h-20 bg-white shadow-sm border-b border-gray-200/60 sticky top-0 z-30 flex-shrink-0">
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-red-600" />
            <span className="text-lg font-semibold text-gray-900">Alert Management</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <motion.button
            className="rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200/50"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open menu"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
                  d: isPanelOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16",
                }}
              />
            </motion.svg>
          </motion.button>
        </div>
      </header>


      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 p-4 mx-8 mt-4 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle size={20} className="flex-shrink-0" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}


      {/* Main Content with Fixed Height */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-10">
        <div className="max-w-7xl mx-auto p-8 flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <motion.div
            className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="w-full md:w-96">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search for a stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200/60 rounded-xl shadow-sm focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all bg-white"
                />
              </div>
            </div>

            <motion.button
              onClick={() => handleOpenModal()}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <BellPlus size={20} />
              Add New Alert
            </motion.button>
          </motion.div>


          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <BellPlus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-green-600">{activeAlerts}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paused Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">{pausedAlerts}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                  <Pause className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </motion.div>


          {/* Alerts Table with Fixed Height and Internal Scrolling */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden flex-1 flex flex-col min-h-0 mb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Table Header - Fixed */}
            <div className="border-b border-gray-200/60 bg-gray-50/50 flex-shrink-0">
              <div className="grid grid-cols-12 gap-4 p-6">
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Stock</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Status</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Thresholds</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Last Alert</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Notifications</h3>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide text-right">Actions</h3>
                </div>
              </div>
            </div>

            {/* Table Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full p-6">
                  <Loader className="w-8 h-8 animate-spin text-brand-red-600" />
                  <p className="text-brand-gray-600">Loading alerts...</p>
                </div>
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.fav_stocks_guid}
                    className="grid grid-cols-12 gap-4 p-6 border-b border-gray-200/60 last:border-b-0 hover:bg-gray-50/50 transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    {/* Stock Name */}
                    <div className="col-span-2">
                      <div className="font-bold text-lg text-gray-900 capitalize">
                        {alert.stock_name ? alert.stock_name.replace(/-/g, ' ') : 'Unknown Stock'}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <motion.span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${alert.monitored
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300'
                          : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300'
                          }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-full ${alert.monitored ? 'bg-green-500' : 'bg-yellow-500'}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        {alert.monitored ? 'Active' : 'Paused'}
                      </motion.span>
                    </div>

                    {/* Thresholds */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        {alert.upper_threshold !== null && alert.upper_threshold > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-600 font-bold">↑</span>
                            <span className="text-gray-700">Upper: <span className="font-semibold">{alert.upper_threshold}</span></span>
                          </div>
                        )}
                        {alert.lower_threshold !== null && alert.lower_threshold > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-bold">↓</span>
                            <span className="text-gray-700">Lower: <span className="font-semibold">{alert.lower_threshold}</span></span>
                          </div>
                        )}
                        {(!alert.upper_threshold || alert.upper_threshold === 0) && (!alert.lower_threshold || alert.lower_threshold === 0) && (
                          <span className="text-gray-400 text-sm">No thresholds set</span>
                        )}
                      </div>
                    </div>

                    {/* Last Alert */}
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-gray-700">
                        {alert.last_alert ? new Date(alert.last_alert).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Never'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {alert.last_alert_frequency || 'daily'}
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="col-span-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {alert.email_alert && alert.email_alert.length > 0 && alert.email_alert[0] !== "string" && (
                          <motion.div
                            className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full"
                            title={alert.email_alert.join(', ')}
                            whileHover={{ scale: 1.05 }}
                          >
                            <Mail size={16} className="text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">
                              {alert.email_alert.length} Email{alert.email_alert.length > 1 ? 's' : ''}
                            </span>
                          </motion.div>
                        )}
                        {alert.sms_alert && alert.sms_alert.length > 0 && alert.sms_alert[0] !== "string" && (
                          <motion.div
                            className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full"
                            title={alert.sms_alert.join(', ')}
                            whileHover={{ scale: 1.05 }}
                          >
                            <Phone size={16} className="text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">
                              {alert.sms_alert.length} SMS
                            </span>
                          </motion.div>
                        )}
                        {(!alert.email_alert || alert.email_alert.length === 0 || alert.email_alert[0] === "string") &&
                          (!alert.sms_alert || alert.sms_alert.length === 0 || alert.sms_alert[0] === "string") && (
                            <span className="text-gray-400 text-sm">No notifications</span>
                          )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          onClick={() => handleToggleStatus(alert.fav_stocks_guid)}
                          className="p-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm border border-gray-200/60"
                          title={alert.monitored ? 'Pause Alert' : 'Resume Alert'}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {alert.monitored ?
                            <Pause size={18} className="text-yellow-600" /> :
                            <Play size={18} className="text-green-600" />
                          }
                        </motion.button>
                        <motion.button
                          onClick={() => handleOpenModal(alert)}
                          className="p-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm border border-blue-200"
                          title="Edit Alert"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit size={18} className="text-blue-600" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(alert.fav_stocks_guid)}
                          className="p-3 rounded-xl hover:bg-red-50 transition-colors shadow-sm border border-red-200"
                          title="Delete Alert"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BellPlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-gray-500 text-center">
                    <p className="text-lg font-medium mb-2">No alerts found</p>
                    <p className="text-sm">
                      {searchTerm ?
                        `No alerts matching "${searchTerm}" found.` :
                        'Add your first alert to get started with monitoring!'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>


      {/* Backdrop and Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
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
      <Dock />
    </div>
  );
}


// --- Enhanced Modal Component ---
function AlertModal({
  alert,
  onClose,
  onSave
}: {
  alert: Alert | null;
  onClose: () => void;
  onSave: (data: Partial<Alert>) => void;
}) {
  const [formData, setFormData] = useState({
    stock_name: alert?.stock_name || '',
    upper_threshold: alert?.upper_threshold?.toString() || '',
    lower_threshold: alert?.lower_threshold?.toString() || '',
    email_alert: alert?.email_alert?.filter(email => email !== "string").join(', ') || '',
    sms_alert: alert?.sms_alert?.filter(sms => sms !== "string").join(', ') || '',
    last_alert_frequency: alert?.last_alert_frequency || 'daily',
  });
  const [error, setError] = useState('');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { stock_name, upper_threshold, lower_threshold, email_alert, sms_alert } = formData;


    // Validation
    if (!stock_name) {
      setError('Stock Name is required.');
      return;
    }
    if (!upper_threshold && !lower_threshold) {
      setError('At least one threshold (upper or lower) is required.');
      return;
    }
    if (!email_alert && !sms_alert) {
      setError('At least one notification method (Email or SMS) is required.');
      return;
    }


    setError('');


    const alertData: Partial<Alert> = {
      stock_name: stock_name.toLowerCase().replace(/\s+/g, '-'),
      upper_threshold: upper_threshold ? parseFloat(upper_threshold) : null,
      lower_threshold: lower_threshold ? parseFloat(lower_threshold) : null,
      email_alert: email_alert ? email_alert.split(',').map(e => e.trim()).filter(e => e) : [],
      sms_alert: sms_alert ? sms_alert.split(',').map(s => s.trim()).filter(s => s) : [],
      last_alert_frequency: formData.last_alert_frequency,
      monitored: true,
    };


    onSave(alertData);
  };


  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };


  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200/60 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Enhanced Header */}
            <div className="p-6 border-b border-gray-200/60 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                    <BellPlus className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{alert ? 'Edit Alert' : 'Create New Alert'}</h3>
                    <p className="text-sm text-gray-600">Configure your stock monitoring preferences</p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-gray-500" />
                </motion.button>
              </div>
            </div>


            {/* Enhanced Form Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Stock Name */}
              <div>
                <label htmlFor="stock_name" className="block text-sm font-semibold text-gray-700 mb-2">Stock Name</label>
                <input
                  type="text"
                  name="stock_name"
                  value={formData.stock_name}
                  onChange={handleChange}
                  placeholder="e.g., india-birthrate, china-population"
                  className="w-full px-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all bg-white"
                  required
                />
              </div>


              {/* Thresholds */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="upper_threshold" className="block text-sm font-medium text-gray-600 mb-2">Upper Threshold (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 font-bold">↑</span>
                      <input
                        type="number"
                        name="upper_threshold"
                        value={formData.upper_threshold}
                        onChange={handleChange}
                        placeholder="1000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all bg-white"
                        step="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lower_threshold" className="block text-sm font-medium text-gray-600 mb-2">Lower Threshold (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">↓</span>
                      <input
                        type="number"
                        name="lower_threshold"
                        value={formData.lower_threshold}
                        onChange={handleChange}
                        placeholder="500"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all bg-white"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* Alert Frequency */}
              <div>
                <label htmlFor="last_alert_frequency" className="block text-sm font-semibold text-gray-700 mb-2">Alert Frequency</label>
                <select
                  name="last_alert_frequency"
                  value={formData.last_alert_frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all bg-white"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>


              {/* Notifications */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Notification Methods</h4>
                <p className="text-xs text-gray-500 mb-4">Configure at least one notification method to receive alerts. Use comma to separate multiple entries.</p>
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
                    <input
                      type="text"
                      name="email_alert"
                      value={formData.email_alert}
                      onChange={handleChange}
                      placeholder="email1@example.com, email2@example.com"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all bg-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</div>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" size={20} />
                    <input
                      type="text"
                      name="sms_alert"
                      value={formData.sms_alert}
                      onChange={handleChange}
                      placeholder="1234567890, 0987654321"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all bg-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">Separate multiple phone numbers with commas</div>
                  </div>
                </div>
              </div>


              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3"
                  >
                    <AlertTriangle size={20} className="flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Enhanced Footer */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-200/60 flex justify-end gap-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {alert ? 'Update Alert' : 'Create Alert'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}