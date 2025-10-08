import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3,
  Activity, 
  Signal, 
  Bell, 
  Globe,
  Menu,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import RightSidebar from '../components/RightSidebar';
import Dock from '../components/ui/Dock';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // Mobile responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dashboard sections with shortened descriptions
  const dashboardSections = [
    {
      id: 'monitoring',
      title: 'Monitoring',
      subtitle: 'Real-time tracking with intelligent thresholds',
      icon: Activity,
      color: 'red',
      path: '/monitoring',
      stats: { value: '4', label: 'Active Stocks' },
      features: ['Live Data', 'Thresholds', 'Predictions'],
      description: 'Real-time tracking with intelligent thresholds and predictive analytics for proactive insights.'
    },
    {
      id: 'visualization',
      title: 'Visualization',
      subtitle: 'Interactive what-if simulations on dynamic causal graphs',
      icon: BarChart3,
      color: 'blue',
      path: '/visualization',
      stats: { value: '2', label: 'Active Graphs' },
      features: ['Graph Analysis', 'What-If', 'Simulations'],
      description: 'Interactive what-if simulations on dynamic causal graphs with advanced modeling capabilities.'
    },
    {
      id: 'signal',
      title: 'Signal',
      subtitle: 'Location Analytics',
      icon: Signal,
      color: 'green',
      path: '/signal',
      stats: { value: '2', label: 'Tracking Signals' },
      features: ['Location View', 'Contributing', 'Simulations'],
      description: 'Geospatial signal analysis with location-based insights and contributing factor mapping.'
    },
    {
      id: 'alerts',
      title: 'Alerts',
      subtitle: 'Smart Notifications',
      icon: Bell,
      color: 'orange',
      path: '/alerts',
      stats: { value: '0', label: 'Active Alerts' },
      features: ['Email Alerts', 'SMS', 'Real-time'],
      description: 'Configure intelligent alerts for stock price changes, market signals, and threshold breaches.'
    }
  ];

  const handleSectionClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`h-screen flex flex-col transition-all duration-500 font-inter antialiased relative overflow-hidden ${isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white'
        : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-900 text-gray-900'
      }`}>

      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode
            ? 'bg-gradient-to-br from-red-500 to-neutral-600'
            : 'bg-gradient-to-br from-red-400 to-neutral-400'
          }`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl ${isDarkMode
            ? 'bg-gradient-to-tr from-neutral-600 to-red-500'
            : 'bg-gradient-to-tr from-neutral-400 to-red-400'
          }`} />
      </div>

      {/* MOBILE MINIMAL HEADER */}
      {isMobile ? (
        <header className={`flex items-center justify-between px-4 h-16 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
            ? 'bg-slate-900/90 border-neutral-700/30'
            : 'bg-white/90 border-neutral-200/60'
          }`}>
          {/* Q Logo */}
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/Q-logo.svg"
              alt="Quantifore logo"
              className="h-8 select-none drop-shadow-sm"
            />
          </motion.div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Menu Button */}
            <motion.button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-lg p-2.5 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                  ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </div>
        </header>
      ) : (
        /* DESKTOP HEADER */
        <header className={`flex items-center justify-between px-4 sm:px-8 lg:px-12 h-20 sm:h-24 backdrop-blur-xl shadow-sm border-b flex-shrink-0 z-30 transition-all duration-500 ${isDarkMode
            ? 'bg-slate-900/90 border-neutral-700/30'
            : 'bg-white/90 border-neutral-200/60'
          }`}>
          <motion.div
            className="flex items-center space-x-3 sm:space-x-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
              alt="Quantifore logo"
              className="h-8 sm:h-10 select-none drop-shadow-sm"
            />
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-2 sm:p-3 rounded-xl shadow-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-gradient-to-r from-neutral-300 to-neutral-400'
                }`}>
                <Globe className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-red-400' : 'text-neutral-900'
                  }`} />
              </div>
              <div>
                <div className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  Dashboard
                </div>
                <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                  }`}>Control Center</div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center space-x-3">
            {/* Live Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isDarkMode
                ? 'bg-white/5 text-emerald-400 border border-white/20'
                : 'bg-white/60 text-emerald-700 border border-neutral-200/60'
              }`}>
              <motion.div
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                animate={{
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="hidden sm:inline">Live Data</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Button */}
            <motion.button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all duration-200 shadow-sm border backdrop-blur-sm ${isDarkMode
                  ? 'text-white/80 hover:text-white hover:bg-white/10 bg-white/5 border-white/20'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 bg-white/60 border-neutral-200/60'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5 sm:h-6" />
            </motion.button>
          </div>
        </header>
      )}

      {/* MAIN CONTENT LAYOUT */}
      <main className={`flex-1 min-h-0 ${isMobile ? 'flex flex-col pb-20' : 'flex flex-col items-center py-6 sm:py-8'}`}>

        {/* MOBILE WELCOME SECTION */}
        {isMobile && (
          <div className={`border-b backdrop-blur-xl flex-shrink-0 ${isDarkMode ? 'border-neutral-700/50 bg-slate-900/60' : 'border-neutral-200/60 bg-white/80'
            }`}>
            <div className="px-4 py-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center space-y-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDarkMode
                      ? 'bg-red-500/20'
                      : 'bg-gradient-to-tr from-red-400/20 to-red-500/20'
                    }`}>
                    <Globe className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'
                      }`}>
                      Welcome to QuantiFore
                    </h1>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                      }`}>
                      Your comprehensive forecasting platform
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* DESKTOP WELCOME SECTION - REDUCED SPACING */}
        {!isMobile && (
          <div className="mb-2">
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto ${isDarkMode
                  ? 'bg-red-500/20'
                  : 'bg-gradient-to-tr from-red-400/20 to-red-500/20'
                }`}>
                <Globe className={`w-10 h-10 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
              </div>
              <div>
                <h1 className={`text-3xl font-bold tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                  Welcome to QuantiFore
                </h1>
                <p className={`text-lg font-medium max-w-2xl mx-auto ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                  }`}>
                  Your comprehensive quantitative forecasting platform for real-time analytics and predictive insights
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* IMPROVED DASHBOARD CARDS SECTION - REDUCED HEIGHT & SPACING */}
        <div className={`${isMobile ? 'flex-1 p-4 overflow-y-auto' : 'mt-[-100px] w-full max-w-5xl px-4 sm:px-8 flex-1 flex items-center'}`}>
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6 w-full'}`}>
            {dashboardSections.map((section, index) => {
              const IconComponent = section.icon;
              
              return (
                <motion.div
                  key={section.id}
                  onClick={() => handleSectionClick(section.path)}
                  className={`group cursor-pointer rounded-2xl sm:rounded-3xl border shadow-lg hover:shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${isDarkMode
                      ? 'border-neutral-700/50 bg-slate-900/60 hover:bg-slate-900/80'
                      : 'border-neutral-200/60 bg-white/95 hover:bg-white hover:shadow-xl'
                    } ${isMobile ? 'h-32' : 'h-full max-w-[500px] mx-auto'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: isMobile ? 1.02 : 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-${section.color}-500/10 to-${section.color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className={`relative ${isMobile ? 'p-4 h-full flex items-center' : 'p-6 h-full flex flex-col justify-between'}`}
                       style={!isMobile ? { minHeight: '220px', maxHeight: '220px' } : {}}>
                    
                    {isMobile ? (
                      /* MOBILE CARD LAYOUT - UNCHANGED */
                      <>
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl shadow-lg flex-shrink-0 ${
                            isDarkMode 
                              ? section.color === 'red' ? 'bg-red-500/20' :
                                section.color === 'blue' ? 'bg-blue-500/20' :
                                section.color === 'green' ? 'bg-green-500/20' :
                                'bg-orange-500/20'
                              : section.color === 'red' ? 'bg-gradient-to-r from-red-400/20 to-red-500/20' :
                                section.color === 'blue' ? 'bg-gradient-to-r from-blue-400/20 to-blue-500/20' :
                                section.color === 'green' ? 'bg-gradient-to-r from-green-400/20 to-green-500/20' :
                                'bg-gradient-to-r from-orange-400/20 to-orange-500/20'
                          }`}>
                            <IconComponent className={`w-6 h-6 ${
                              section.color === 'red' ? 'text-red-500' :
                              section.color === 'blue' ? 'text-blue-500' :
                              section.color === 'green' ? 'text-green-500' :
                              'text-orange-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-bold tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                              }`}>
                              {section.title}
                            </h3>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                              }`}>
                              {section.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          <div className="text-right mr-3">
                            <div className={`text-xl font-bold ${
                              section.color === 'red' ? 'text-red-500' :
                              section.color === 'blue' ? 'text-blue-500' :
                              section.color === 'green' ? 'text-green-500' :
                              'text-orange-500'
                            }`}>
                              {section.stats.value}
                            </div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                              }`}>
                              {section.stats.label}
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-neutral-400'
                            } group-hover:translate-x-1 transition-transform`} />
                        </div>
                      </>
                    ) : (
                      /* DESKTOP CARD LAYOUT - CONDENSED VERSION */
                      <>
                        <div>
                          {/* Header with reduced spacing */}
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl shadow-lg ${
                              isDarkMode 
                                ? section.color === 'red' ? 'bg-red-500/20' :
                                  section.color === 'blue' ? 'bg-blue-500/20' :
                                  section.color === 'green' ? 'bg-green-500/20' :
                                  'bg-orange-500/20'
                                : section.color === 'red' ? 'bg-gradient-to-r from-red-400/20 to-red-500/20' :
                                  section.color === 'blue' ? 'bg-gradient-to-r from-blue-400/20 to-blue-500/20' :
                                  section.color === 'green' ? 'bg-gradient-to-r from-green-400/20 to-green-500/20' :
                                  'bg-gradient-to-r from-orange-400/20 to-orange-500/20'
                            }`}>
                              <IconComponent className={`w-7 h-7 ${
                                section.color === 'red' ? 'text-red-500' :
                                section.color === 'blue' ? 'text-blue-500' :
                                section.color === 'green' ? 'text-green-500' :
                                'text-orange-500'
                              }`} />
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                section.color === 'red' ? 'text-red-500' :
                                section.color === 'blue' ? 'text-blue-500' :
                                section.color === 'green' ? 'text-green-500' :
                                'text-orange-500'
                              }`}>
                                {section.stats.value}
                              </div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                                }`}>
                                {section.stats.label}
                              </div>
                            </div>
                          </div>

                          {/* Title and Description - SHORTENED */}
                          <div className="mb-4">
                            <h3 className={`text-xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-neutral-900'
                              }`}>
                              {section.title}
                            </h3>
                            <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-neutral-600'
                              }`}>
                              {section.description}
                            </p>
                          </div>

                          {/* Features with reduced spacing */}
                          <div className="flex flex-wrap gap-2">
                            {section.features.map((feature, featureIndex) => (
                              <span
                                key={featureIndex}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDarkMode
                                    ? 'bg-white/10 text-white/80'
                                    : 'bg-neutral-100/80 text-neutral-700'
                                  }`}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Footer with reduced spacing */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-200/20 dark:border-neutral-700/30">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-neutral-500'
                            }`}>
                            {section.subtitle}
                          </div>
                          <ArrowRight className={`w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-neutral-400'
                            } group-hover:translate-x-2 transition-transform`} />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
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

      <Dock />

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
    </div>
  );
}