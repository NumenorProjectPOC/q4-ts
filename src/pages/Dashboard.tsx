// src/pages/Dashboard.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Activity, BellRing, Menu, ArrowRight, Sparkles, ChevronRight, Home, Waypoints } from "lucide-react";
import Dock from "../components/ui/Dock";
import RightSidebar from "../components/RightSidebar";

const cards = [
  {
    key: "monitoring",
    title: "Monitoring",
    desc: "Real‑time tracking with thresholds and predictions.",
    path: "/monitoring",
    chips: ["Live", "Thresholds", "Bands"],
    icon: LineChart,
    color: "from-red-600 to-red-700",
    lightColor: "from-red-50 to-red-100",
    accent: "red"
  },
  {
    key: "visualization",
    title: "Visualization",
    desc: "What‑if simulations on a causal graph.",
    path: "/visualization",
    chips: ["Graph", "What‑if", "Simulate"],
    icon: Waypoints,
    color: "from-blue-600 to-blue-700",
    lightColor: "from-blue-50 to-blue-100",
    accent: "blue"
  },
  {
    key: "signal",
    title: "Signal",
    desc: "Global events and regional drivers.",
    path: "/signal",
    chips: ["Events", "Geo", "Drivers"],
    icon: Activity,
    color: "from-green-600 to-green-700",
    lightColor: "from-green-50 to-green-100",
    accent: "green"
  },
  {
    key: "alerts",  
    title: "Alerts",
    desc: "Get notified via email/SMS on thresholds.",
    path: "/alert",
    chips: ["Email", "SMS", "Rules"],
    icon: BellRing,
    color: "from-orange-600 to-orange-700",
    lightColor: "from-orange-50 to-orange-100",
    accent: "orange"
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 pb-20 antialiased relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-red-400 to-orange-400 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 bg-gradient-to-tr from-blue-400 to-purple-400 blur-3xl"></div>
      </div>

      {/* Consistent Header - Matching Monitoring Dashboard */}
      <header className="flex items-center justify-between px-8 h-20 bg-white shadow-sm border-b border-brand-red-100 sticky top-0 z-30">
        <motion.div
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/qf-logo0.1.svg" alt="Quantifore logo" className="h-8 select-none" />
          <div className="flex items-center space-x-2">
            <Home className="w-5 h-5 text-brand-red-700" />
            <span className="text-lg font-semibold text-brand-black">Dashboard</span>
          </div>
        </motion.div>

        <motion.button
          onClick={() => setOpenSidebar(true)}
          className="rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200/50"
          aria-label="Open menu"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="h-5 w-5" />
        </motion.button>
      </header>

      <main className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* More Compact Hero Section */}
        <motion.section
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-red-600" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-red-700 to-gray-900 bg-clip-text text-transparent">
                Quantitative Forecasting Platform
              </h1>
              <Sparkles className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Monitor time‑series, explore relationships, track signals, and set proactive alerts with our comprehensive analytics suite.
            </p>
          </div>
        </motion.section>

        {/* Enhanced Cards Grid */}
        <section>
          <div className="mx-auto max-w-7xl">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {cards.map((card, i) => (
                <motion.button
                  key={card.key}
                  onClick={() => navigate(card.path)}
                  onMouseEnter={() => setHoveredCard(card.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative text-left rounded-3xl border border-gray-200/60 bg-white/90 backdrop-blur-sm p-8 shadow-lg hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-200 overflow-hidden"
                >
                  {/* Background gradient on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${card.lightColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredCard === card.key ? 1 : 0 }}
                  />

                  {/* Decorative corner gradient */}
                  <div className={`absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>

                  <div className="relative z-10">
                    {/* Enhanced Icon Container */}
                    <motion.div
                      className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-xl group-hover:shadow-2xl transition-shadow duration-300`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      <card.icon className="h-8 w-8" />
                    </motion.div>

                    {/* Enhanced Typography */}
                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors flex items-center gap-2">
                        {card.title}
                        <motion.div
                          initial={{ x: -5, opacity: 0 }}
                          animate={{ x: hoveredCard === card.key ? 0 : -5, opacity: hoveredCard === card.key ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </h3>
                      <p className="mt-3 text-gray-600 group-hover:text-gray-700 transition-colors leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    {/* Enhanced Chips */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {card.chips.map((chip, chipIndex) => (
                        <motion.span
                          key={chip}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                            card.accent === 'red' ? 'bg-red-100 text-red-700 group-hover:bg-red-200' :
                            card.accent === 'blue' ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200' :
                            card.accent === 'green' ? 'bg-green-100 text-green-700 group-hover:bg-green-200' :
                            'bg-orange-100 text-orange-700 group-hover:bg-orange-200'
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 * i + 0.1 * chipIndex }}
                        >
                          {chip}
                        </motion.span>
                      ))}
                    </div>

                    {/* Call to Action */}
                    <motion.div
                      className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredCard === card.key ? 1 : 0 }}
                    >
                      <span>Explore Dashboard</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <motion.section
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mx-auto max-w-4xl p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-red-600 mb-1">Real-time</div>
                <div className="text-gray-600 text-sm">Data Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">Advanced</div>
                <div className="text-gray-600 text-sm">Analytics Engine</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">Intelligent</div>
                <div className="text-gray-600 text-sm">Forecasting</div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Show Dock on all screen sizes */}
      <Dock />

      <RightSidebar isOpen={openSidebar} onClose={() => setOpenSidebar(false)} />

      {/* Enhanced Footer */}
      <motion.footer
        className="relative px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500 border-t border-gray-200/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2">
          <span>© {new Date().getFullYear()} QuantiFore Pvt. Ltd.</span>
          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
          <span>Empowering Data-Driven Decisions</span>
        </div>
      </motion.footer>
    </div>
  );
}