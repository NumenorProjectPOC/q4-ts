import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LineChart, Radar, Activity, BellRing } from "lucide-react";
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState } from "react";

type DockItem = {
  key: "home" | "monitoring" | "visualization" | "signal" | "alert";
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: DockItem[] = [
  { key: "home",         label: "Home",          path: "/home",         icon: Home },
  { key: "monitoring",   label: "Monitoring",    path: "/monitoring",   icon: LineChart },
  { key: "visualization",label: "Visualization", path: "/visualization",icon: Radar },
  { key: "signal",       label: "Signal",        path: "/signal",       icon: Activity },
  { key: "alert",        label: "Alerts",        path: "/alert",        icon: BellRing },
];

export default function Dock() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-60 flex justify-center">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`
          pointer-events-auto
          ${isMobile 
            ? 'w-full rounded-none' 
            : 'rounded-2xl mx-4 mb-4'
          }
          flex gap-1.5 px-3 py-2.5
          backdrop-blur-sm shadow-lg border
          transition-all duration-300
          ${isDarkMode 
            ? 'bg-brand-primary-900/90 border-neutral-700/50 shadow-2xl' 
            : 'bg-white/90 border-neutral-200/60 shadow-xl'
          }
          ${isMobile 
            ? 'border-t border-l-0 border-r-0 border-b-0' 
            : ''
          }
        `}
      >
        {items.map((it) => {
          const active = loc.pathname === it.path || loc.pathname.startsWith(it.path);
          return (
            <motion.button
              key={it.key}
              onClick={() => navigate(it.path)}
              whileHover={!isMobile ? { scale: 1.05, y: -2 } : {}}
              whileTap={{ scale: 0.95 }}
              className={`
                group relative isolate
                flex flex-col items-center justify-center
                ${isMobile ? 'flex-1 h-16' : 'w-16 h-14'}
                rounded-xl transition-all duration-200
                ${active
                  ? isDarkMode
                    ? "bg-red-500/20 shadow-sm border border-red-500/30"
                    : "bg-red-50/80 shadow-sm border border-red-200/60"
                  : isDarkMode
                    ? "hover:bg-white/10"
                    : "hover:bg-neutral-100/60"
                }
              `}
              aria-current={active ? "page" : undefined}
              title={it.label}
            >
              <motion.div
                whileHover={!isMobile ? { scale: 1.08, y: -2 } : {}}
                whileTap={{ scale: 0.98 }}
                className={`grid place-items-center transition-colors duration-200 ${
                  active 
                    ? isDarkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : isDarkMode
                      ? "text-neutral-400 group-hover:text-neutral-200"
                      : "text-neutral-600 group-hover:text-neutral-800"
                }`}
              >
                <it.icon className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
              </motion.div>

              <span
                className={`mt-1 text-[10px] font-medium transition-colors duration-200 ${
                  active 
                    ? isDarkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : isDarkMode
                      ? "text-neutral-500 group-hover:text-neutral-300"
                      : "text-neutral-500 group-hover:text-neutral-700"
                }`}
              >
                {it.label}
              </span>

              {active && (
                <motion.span
                  layoutId="dock-active-dot"
                  className={`absolute ${isMobile ? '-top-1' : '-bottom-1'} left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${
                    isDarkMode ? 'bg-red-500' : 'bg-red-600'
                  }`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Hover glow effect */}
              {active && (
                <motion.div
                  className={`absolute inset-0 rounded-xl opacity-20 -z-10 ${
                    isDarkMode
                      ? 'bg-gradient-to-t from-red-500/30 to-transparent'
                      : 'bg-gradient-to-t from-red-200/40 to-transparent'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}