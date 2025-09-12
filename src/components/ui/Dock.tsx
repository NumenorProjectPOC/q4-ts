import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LineChart, Radar, Activity, BellRing } from "lucide-react";

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

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[90] flex justify-center">
      <div
        className="
          pointer-events-auto
          flex gap-1.5 px-2.5 py-2 rounded-2xl
          border border-brand-red-100
          bg-brand-cream-100/80 backdrop-blur-xl
          supports-[backdrop-filter]:bg-brand-cream-100/60
          shadow-lg
        "
      >
        {items.map((it) => {
          const active = loc.pathname === it.path || loc.pathname.startsWith(it.path);
          return (
            <button
              key={it.key}
              onClick={() => navigate(it.path)}
              className={`
                group relative isolate
                flex flex-col items-center justify-end
                w-16 h-14 rounded-xl transition-all duration-200
                ${active
                  ? "bg-white/90 shadow-sm"
                  : "hover:bg-white/60"}
              `}
              aria-current={active ? "page" : undefined}
              title={it.label}
            >
              <motion.div
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`grid place-items-center ${
                  active ? "text-brand-red-700" : "text-brand-gray-700"
                }`}
              >
                <it.icon className="h-5 w-5" />
              </motion.div>

              <span
                className={`mt-1 text-[10px] font-medium ${
                  active ? "text-brand-red-700" : "text-brand-gray-600"
                }`}
              >
                {it.label}
              </span>

              {active && (
                <motion.span
                  layoutId="dock-active-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-brand-red-700"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
