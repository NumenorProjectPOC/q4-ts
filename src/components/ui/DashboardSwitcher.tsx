import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Activity, Map, AlertTriangle, TrendingUp, Shield, Bell } from 'lucide-react';

const DashboardSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeDashboard, setActiveDashboard] = useState('visualization');
  const [isExpanded, setIsExpanded] = useState(false);

  const dashboards = [
    { id: 'signal', name: 'Signal Tracker', icon: Map, color: 'from-blue-500 to-cyan-500', description: 'Real-time signal monitoring', stats: '95 Active', path: '/signal' },
    { id: 'monitoring', name: 'Monitoring', icon: Activity, color: 'from-green-500 to-emerald-500', description: 'System health & performance', stats: '12 Services', path: '/monitoring' },
    { id: 'visualization', name: 'Visualization', icon: BarChart3, color: 'from-purple-500 to-pink-500', description: 'Data analytics & insights', stats: '8 Charts', path: '/visualization' },
    { id: 'alert', name: 'Alerts', icon: AlertTriangle, color: 'from-red-500 to-orange-500', description: 'Critical notifications', stats: '3 Active', path: '/alert' }
  ];

  const activeDashboardData = dashboards.find(d => d.id === activeDashboard);

  interface Dashboard {
    id: string;
    name: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    description: string;
    stats: string;
    path: string;
  }

  const handleDashboardChange = (dashboard: Dashboard): void => {
    setActiveDashboard(dashboard.id);
    navigate(dashboard.path);
    setIsExpanded(false); // Close after selection
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const currentDashboard = dashboards.find(d => d.path === location.pathname);
    if (currentDashboard) {
      setActiveDashboard(currentDashboard.id);
    }
  }, [location.pathname, dashboards]);

  return (
    <>
      {/* Backdrop - only show when expanded */}
      {/* {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )} */}

      <div
        ref={containerRef}
        className={`fixed top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${isExpanded ? 'z-50' : 'z-30'
          }`}
        style={{
          pointerEvents: isExpanded ? 'auto' : 'none'
        }}
      >
        {/* Compact Mode - Floating Pill */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            aria-expanded={isExpanded}
            aria-label="Switch dashboard"
            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 px-10 py-3 transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex w-full items-center justify-between gap-4">
              {activeDashboardData && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${activeDashboardData.color} flex items-center justify-center`}>
                    <activeDashboardData.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800">
                    {activeDashboardData.name}
                  </span>
                </div>
              )}
              <div className="text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Expanded Mode - Dashboard Grid */}
        {isExpanded && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 p-6 min-w-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Switch Dashboard</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close dashboard switcher"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => handleDashboardChange(dashboard)}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${activeDashboard === dashboard.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${dashboard.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <dashboard.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-800 group-hover:text-gray-900">{dashboard.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{dashboard.description}</p>
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{dashboard.stats}</span>
                      </div>
                    </div>
                  </div>
                  {activeDashboard === dashboard.id && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Quick Actions</span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><TrendingUp className="w-4 h-4 text-gray-600" /></button>
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><Shield className="w-4 h-4 text-gray-600" /></button>
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><Bell className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardSwitcher;