import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  ChevronDown,
  Zap,
  Calendar,
  BarChart3,
  Target,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AlertFormData {
  upperThreshold: number | null;
  lowerThreshold: number | null;
  alertFrequency: string;
  emailNotifications: string[];
  phoneNotifications: string[];
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AlertFormData) => Promise<void>;
  stockName: string;
  initialData?: Partial<AlertFormData>;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stockName,
  initialData = {},
}) => {
  const { isDarkMode } = useTheme();
  
  const [upper, setUpper] = React.useState(initialData.upperThreshold?.toString() || '');
  const [lower, setLower] = React.useState(initialData.lowerThreshold?.toString() || '');
  const [freq, setFreq] = React.useState(initialData.alertFrequency || 'daily');
  const [emails, setEmails] = React.useState<string[]>(initialData.emailNotifications || []);
  const [phones, setPhones] = React.useState<string[]>(initialData.phoneNotifications || []);
  const [inputEmail, setInputEmail] = React.useState('');
  const [inputPhone, setInputPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  const frequencyOptions = [
    { value: 'realtime', label: 'Real-Time', icon: Zap },
    { value: 'daily', label: 'Daily', icon: Calendar },
    { value: 'weekly', label: 'Weekly', icon: BarChart3 },
    { value: 'monthly', label: 'Monthly', icon: Target },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInput.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const addEmail = () => {
    const v = inputEmail.trim();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !emails.includes(v)) setEmails([...emails, v]);
    setInputEmail('');
  };

  const addPhone = () => {
    const v = inputPhone.trim();
    if (v && !phones.includes(v)) setPhones([...phones, v]);
    setInputPhone('');
  };

  const save = async () => {
    setError('');
    const hasU = upper.trim() !== '';
    const hasL = lower.trim() !== '';
    
    const u = hasU ? parseFloat(upper) : null;
    const l = hasL ? parseFloat(lower) : null;

    setLoading(true);
    setError('Setting up thresholds...');

    setTimeout(async () => {
      try {
        await onSave({ 
          upperThreshold: u, 
          lowerThreshold: l, 
          alertFrequency: freq, 
          emailNotifications: emails, 
          phoneNotifications: phones 
        });
        
        setLoading(false);
        setError('');
        onClose();
        
      } catch (err) {
        setLoading(false);
        setError('Failed to save alert');
      }
    }, 2000);
  };

  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          initial={{opacity:0}} 
          animate={{opacity:1}} 
          exit={{opacity:0}}
        />
        <motion.div
          ref={modalRef}
          className={`relative rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl border backdrop-blur-xl ${
            isDarkMode
              ? 'bg-slate-900/95 border-neutral-800/50'
              : 'bg-white/95 border-neutral-200/50'
          }`}
          initial={{opacity:0, scale:0.9, y:50}} 
          animate={{opacity:1, scale:1, y:0}} 
          exit={{opacity:0, scale:0.9, y:50}} 
          transition={{type:'spring', stiffness:300, damping:30}}
        >
          {/* Modern Minimal Header */}
          <div className={`relative px-6 py-5 border-b ${
            isDarkMode ? 'border-neutral-800/50' : 'border-neutral-200/50'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
                }`}>
                  <Bell className={`w-5 h-5 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Create New Alert</h2>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>Configure monitoring preferences</p>
                </div>
              </div>
              <motion.button 
                onClick={onClose} 
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-white/60 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5"/>
              </motion.button>
            </div>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Stock Info Card - Clean Design */}
            <motion.div 
              className={`p-4 rounded-2xl border ${
                isDarkMode
                  ? 'bg-slate-800/40 border-neutral-700/50'
                  : 'bg-neutral-50/80 border-neutral-200/60'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>Target Stock</p>
                  <p className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{stockName}</p>
                </div>
              </div>
            </motion.div>

            {/* Status Display - Clean Design */}
            {error && (
              <motion.div
                className={`flex items-center gap-3 p-4 rounded-2xl border ${
                  error === 'Setting up thresholds...' 
                    ? isDarkMode
                      ? 'text-blue-300 bg-blue-500/10 border-blue-500/20' 
                      : 'text-blue-700 bg-blue-50 border-blue-200/60'
                    : isDarkMode
                      ? 'text-red-300 bg-red-500/10 border-red-500/20'
                      : 'text-red-700 bg-red-50 border-red-200/60'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {error === 'Setting up thresholds...' ? (
                  <>
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                        isDarkMode ? 'border-blue-400' : 'border-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{error}</p>
                      <p className={`text-xs mt-0.5 ${
                        isDarkMode ? 'text-blue-400/80' : 'text-blue-600/80'
                      }`}>Please wait while we configure your alert settings</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span className="font-medium text-sm">{error}</span>
                  </>
                )}
              </motion.div>
            )}

            {/* Thresholds Section */}
            <div className="space-y-4">
              <h3 className={`font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Price Thresholds
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className={`text-sm font-medium flex items-center gap-2 ${
                    isDarkMode ? 'text-white/90' : 'text-gray-700'
                  }`}>
                    <TrendingUp className="w-4 h-4 text-green-500"/>
                    Upper Threshold
                  </label>
                  <div className="relative">
                    <input
                      ref={firstInput}
                      type="number"
                      value={upper}
                      onChange={e => setUpper(e.target.value)}
                      placeholder="Enter upper limit"
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 font-medium ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-neutral-700/50 text-white placeholder-white/40 focus:bg-slate-800/80 focus:border-red-500/50'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-red-500/50'
                      } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                      disabled={loading}
                    />
                    {upper && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className={`text-sm font-medium flex items-center gap-2 ${
                    isDarkMode ? 'text-white/90' : 'text-gray-700'
                  }`}>
                    <TrendingDown className="w-4 h-4 text-red-500"/>
                    Lower Threshold
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={lower}
                      onChange={e => setLower(e.target.value)}
                      placeholder="Enter lower limit"
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 font-medium ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-neutral-700/50 text-white placeholder-white/40 focus:bg-slate-800/80 focus:border-red-500/50'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-red-500/50'
                      } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                      disabled={loading}
                    />
                    {lower && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Frequency Section */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className={`font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Alert Frequency
              </h3>
              
              <div className="relative">
                <select
                  value={freq}
                  onChange={e => setFreq(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border appearance-none transition-all duration-200 font-medium cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-neutral-700/50 text-white focus:bg-slate-800/80 focus:border-red-500/50'
                      : 'bg-white border-gray-200 text-gray-900 focus:bg-white focus:border-red-500/50'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                  disabled={loading}
                >
                  {frequencyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  isDarkMode ? 'text-white/60' : 'text-gray-500'
                }`}/>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  isDarkMode ? 'text-white/40' : 'text-gray-400'
                }`}/>
              </div>
            </motion.div>

            {/* Notifications Section */}
            <div className="space-y-4">
              <h3 className={`font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Notification Channels
              </h3>

              {/* Email Notifications */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className={`text-sm font-medium flex items-center gap-2 ${
                  isDarkMode ? 'text-white/90' : 'text-gray-700'
                }`}>
                  <Mail className="w-4 h-4 text-blue-500"/>
                  Email Notifications
                </label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                  onKeyPress={e => (e.key==='Enter' || e.key===',') && (e.preventDefault(), addEmail())}
                  onBlur={addEmail}
                  placeholder="Enter email and press Enter"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-neutral-700/50 text-white placeholder-white/40 focus:bg-slate-800/80 focus:border-red-500/50'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-red-500/50'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                  disabled={loading}
                />
                {emails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {emails.map((em, i) => (
                      <motion.span 
                        key={i} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border ${
                          isDarkMode
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : 'bg-blue-50 text-blue-700 border-blue-200/60'
                        }`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span>{em}</span>
                        <motion.button 
                          onClick={() => setEmails(emails.filter(x=>x!==em))} 
                          className={`rounded-full p-0.5 transition-colors ${
                            isDarkMode ? 'hover:bg-blue-400/20' : 'hover:bg-blue-200/60'
                          }`}
                          disabled={loading}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-3 h-3"/>
                        </motion.button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Phone Notifications */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className={`text-sm font-medium flex items-center gap-2 ${
                  isDarkMode ? 'text-white/90' : 'text-gray-700'
                }`}>
                  <Phone className="w-4 h-4 text-green-500"/>
                  Phone Notifications
                </label>
                <input
                  type="tel"
                  value={inputPhone}
                  onChange={e => setInputPhone(e.target.value)}
                  onKeyPress={e => (e.key==='Enter' || e.key===',') && (e.preventDefault(), addPhone())}
                  onBlur={addPhone}
                  placeholder="Enter phone and press Enter"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-neutral-700/50 text-white placeholder-white/40 focus:bg-slate-800/80 focus:border-red-500/50'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-red-500/50'
                  } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                  disabled={loading}
                />
                {phones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {phones.map((ph, i) => (
                      <motion.span 
                        key={i} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border ${
                          isDarkMode
                            ? 'bg-green-500/10 text-green-300 border-green-500/20'
                            : 'bg-green-50 text-green-700 border-green-200/60'
                        }`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span>{ph}</span>
                        <motion.button 
                          onClick={() => setPhones(phones.filter(x=>x!==ph))} 
                          className={`rounded-full p-0.5 transition-colors ${
                            isDarkMode ? 'hover:bg-green-400/20' : 'hover:bg-green-200/60'
                          }`}
                          disabled={loading}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-3 h-3"/>
                        </motion.button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Clean Footer */}
          <div className={`px-6 py-4 border-t backdrop-blur-sm ${
            isDarkMode
              ? 'border-neutral-800/50'
              : 'border-neutral-200/50'
          }`}>
            <div className="flex justify-end gap-3">
              <motion.button
                onClick={onClose}
                disabled={loading}
                className={`px-6 py-2.5 border-2 rounded-xl font-semibold transition-all duration-200 ${
                  isDarkMode
                    ? 'border-neutral-600/50 text-white/80 hover:border-neutral-500/70 hover:bg-slate-800/50 disabled:opacity-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={save}
                disabled={loading}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    <span>Creating Alert...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Create Alert</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? '#475569 #1e293b' : '#cbd5e1 #f1f5f9'};
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#1e293b' : '#f1f5f9'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#64748b' : '#94a3b8'};
        }
      `}</style>
    </AnimatePresence>
  );
};

export default AlertModal;