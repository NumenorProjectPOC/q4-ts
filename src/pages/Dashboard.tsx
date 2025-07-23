import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RightSidebar from "../components/RightSidebar";
import { AnimatePresence, motion } from "framer-motion";

const dashboards = [
  {
    icon: "📊",
    title: "Monitoring Dashboard",
    description:
      "Track and visualize your favorite stocks, including forecasts, thresholds, and alerts in real-time.",
    path: "/monitoring",
  },
  {
    icon: "📈",
    title: "Visualization Dashboard",
    description:
      "Simulate stock behavior over time and explore dynamic 'what-if' scenarios with full model control.",
    path: "/visualization",
  },
  {
    icon: "📡",
    title: "Signal Dashboard",
    description: "Discover global events and regional patterns that influence your tracked stocks.",
    path: "/signal",
  },
  {
    icon: "🚨",
    title: "Alert Dashboard",
    description: "Set threshold alerts for stocks and get notified via SMS or email if future values cross your limits.",
    path: "/alert",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white to-teal-50 text-dark-gray font-sans overflow-x-hidden">
      <div
        className={`transition-all duration-300 ${isPanelOpen ? "mr-[300px]" : ""
          }`}
      >
        <header className="text-center py-12">
          <div className="flex flex-col items-center justify-center mb-2">
            <img src="/qf-logo0.1.svg" alt="Quantifore Logo" className="h-14 w-auto mb-2" />
          </div>
          <p className="text-lg text-text-secondary mt-2">Choose your dashboard to get started</p>
        </header>

        <main className="max-w-6xl mx-auto px-4 pb-20 grid gap-8 grid-cols-1 sm:grid-cols-2">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.title}
              onClick={() => navigate(dashboard.path)}
              className="relative p-8 bg-white/40 border border-light-gray rounded-2xl backdrop-blur-lg cursor-pointer hover:bg-white/60 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="text-4xl mb-4">{dashboard.icon}</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">{dashboard.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{dashboard.description}</p>
              <div className="absolute inset-0 pointer-events-none before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] before:rotate-45 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-700 before:animate-shimmer" />
            </div>
          ))}
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

      {/*Sidebar */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <RightSidebar isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
