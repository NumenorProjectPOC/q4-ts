import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Lock, AlertTriangle, ArrowLeft, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
// Make sure this path is correct for your project structure
import Hyperspeed from "../components/ui/animation/Hyperspeed"; 

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;
const ENABLE_BG = (import.meta.env.VITE_LOGIN_BG ?? "true") === "true";

export default function LoginPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tagline, setTagline] = useState("Enter the gateway to advanced analytics.");
  const [showPwd, setShowPwd] = useState(false);
  
  // CRITICAL FIX: Separate ref to track theme changes for background only
  const backgroundThemeRef = useRef<boolean>(isDarkMode);
  const [backgroundTheme, setBackgroundTheme] = useState<boolean>(isDarkMode);

  // Enhanced taglines for both themes
  useEffect(() => {
    const lines = [
      "Unlocking insights, one log‑in at a time.",
      "Enter the gateway to advanced analytics.",
      "Your key to QuantiFore awaits.",
      "Accessing the future of data analysis.",
      "Empowering decisions through secure access.",
      "Where data meets intelligence.",
      "Transform data into decisions.",
    ];
    const id = setInterval(() => setTagline(lines[Math.floor(Math.random() * lines.length)]), 3500);
    return () => clearInterval(id);
  }, []);

  // CRITICAL FIX: Only update background theme when theme actually changes, not on every input
  useEffect(() => {
    if (backgroundThemeRef.current !== isDarkMode) {
      backgroundThemeRef.current = isDarkMode;
      // Delay background theme change to prevent input-triggered resets
      const timer = setTimeout(() => {
        setBackgroundTheme(isDarkMode);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDarkMode]);

  const handleLogin = async () => {
    if (!loginId.trim() || !password.trim()) {
      setError("Username and password cannot be empty.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: loginId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid email or password. Please check your credentials and try again.");
        throw new Error(data.detail ?? "An unexpected error occurred. Please try again.");
      }
      const now = Date.now();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("org_id", data.org_id);
      localStorage.setItem("username", data.username);
      localStorage.setItem("organization_name", data.organization_name);
      localStorage.setItem("role", data.role);
      localStorage.setItem("login_time", now.toString());
      navigate("/login-success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // PROFESSIONAL & NEUTRAL: Updated background effect configuration
  const backgroundEffectConfig = useMemo(() => ({
    light: {
      background: 0xFFFFFF,         // Pure white background
      roadColor: 0xF8F9FA,          // Very light gray road
      islandColor: 0xF1F3F4,        // Slightly darker gray island
      shoulderLines: 0xE8EAED,      // Light gray shoulder lines  
      brokenLines: 0xDADCE0,        // Medium light gray broken lines
      leftCars: [0xFF0000, 0x000000, 0xFF102A],
      rightCars: [0xD97706, 0xF59E0B, 0x000000],
      sticks: 0x6B7280,             // Gray sticks instead of bright colors
    },
    dark: {
      background: 0x111827,         // Professional dark background
      roadColor: 0x1F2937,          // Dark gray road
      islandColor: 0x374151,        // Medium gray island
      shoulderLines: 0x4B5563,      // Gray shoulder lines
      brokenLines: 0x6B7280,        // Light gray broken lines
      leftCars: [0xFF0000, 0x000000, 0xFF102A],
      rightCars: [0xD97706, 0xF59E0B, 0x000000],
      sticks: 0x9CA3AF,             // Light gray sticks
    }
  }), []);

  // OPTIMIZED: Memoize hyperspeed configuration to prevent recreation on every render
  const hyperspeedConfig = useMemo(() => ({
    onSpeedUp: () => { },
    onSlowDown: () => { },
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 8,
    islandWidth: 2,
    lanesPerRoad: backgroundTheme ? 12 : 14,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: backgroundTheme ? 0.6 : 0.4,
    totalSideLightSticks: backgroundTheme ? 25 : 20,
    lightPairsPerRoadWay: backgroundTheme ? 30 : 20,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.8, 0.3],
    lightStickHeight: [1, 1.7],
    movingAwaySpeed: [20, 40],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.02, 0.14],
    carWidthPercentage: [0.2, 0.2],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: backgroundTheme ? backgroundEffectConfig.dark : backgroundEffectConfig.light
  }), [backgroundTheme, backgroundEffectConfig]);

  return (
    <div className={`relative min-h-screen overflow-hidden transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-bl from-slate-950 via-slate-900 to-slate-950 text-white' 
        : 'bg-gradient-to-br from-brand-secondary-950 via-white to-brand-secondary-950 text-gray-900'
    }`}>
      
      {ENABLE_BG && (
        <Hyperspeed
          key={`hyperspeed-${backgroundTheme ? 'dark' : 'light'}`}
          effectOptions={hyperspeedConfig}
        />
      )}

      <div className="relative z-20 flex items-center justify-between p-8">
        {/* Back Button - Enhanced styling */}
        <motion.button
          onClick={handleBackToHome}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 group font-medium ${
            isDarkMode 
              ? 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/20' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'  
          }`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </motion.button>

        {/* Theme Toggle - Enhanced styling */}
        <motion.button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 group font-medium ${  // Increased padding
            isDarkMode 
              ? 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/20' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
          }`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: isDarkMode ? 180 : 0,
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 0.5 }}
          >
            {isDarkMode ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.div>
          <span className="font-medium text-sm">
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        </motion.button>
      </div>

      {/* Main content container - ADJUSTED MARGIN */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 sm:px-8 lg:px-12 -mt-24">  {/* Increased padding and adjusted margin */}
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center">
            {/* Dynamic Logo - INCREASED SIZE */}
            <motion.img
              key={isDarkMode ? 'dark-logo' : 'light-logo'}
              src={isDarkMode ? "/qf-logo-light.svg" : "/qf-logo-dark.svg"}
              alt="QuantiFore"
              className="h-24 w-auto mb-6"  // Increased from h-20 to h-24
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Dynamic Tagline - ENHANCED STYLING */}
            <motion.p
              key={tagline}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className={`mb-10 text-center text-lg leading-relaxed font-medium ${  // Increased size and margin
                isDarkMode 
                  ? 'text-gray-300' 
                  : 'text-gray-600'
              }`}
              style={{ lineHeight: 1.6 }}
            >
              {tagline}
            </motion.p>
          </div>

          {/* ENHANCED: Form with professional styling */}
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className={`rounded-3xl backdrop-blur-xl p-10 shadow-2xl border transition-all duration-500 ${  // Increased padding
              isDarkMode 
                ? 'bg-gray-900/50 border-gray-700/50 shadow-black/20' 
                : 'bg-white/80 border-gray-200/60 shadow-gray-500/20'  // Better opacity
            }`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Username Input - ENHANCED STYLING */}
            <label className="block mb-8">  {/* Increased margin */}
              <span className={`text-base font-semibold mb-3 block ${  // Increased size
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Username or Email
              </span>
              <div className="relative group">
                <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${  // Adjusted positioning
                  isDarkMode 
                    ? 'text-gray-400 group-focus-within:text-blue-400' 
                    : 'text-gray-400 group-focus-within:text-gray-600'  // Neutral focus color
                }`} />
                <input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  type="email"
                  placeholder="Enter your username or email"
                  className={`w-full rounded-2xl py-4 pl-14 pr-5 transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm text-base ${  // Increased padding and size
                    isDarkMode 
                      ? 'bg-gray-800/60 border border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:bg-gray-800/80' 
                      : 'bg-gray-50/80 border border-gray-300/60 text-gray-800 placeholder-gray-500 focus:ring-gray-500/50 focus:bg-white/90'  // Neutral focus
                  }`}
                />
              </div>
            </label>

            {/* Password Input - ENHANCED STYLING */}
            <label className="block mb-8">  {/* Increased margin */}
              <span className={`text-base font-semibold mb-3 block ${  // Increased size
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Password
              </span>
              <div className="relative group">
                <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${  // Adjusted positioning
                  isDarkMode 
                    ? 'text-gray-400 group-focus-within:text-blue-400' 
                    : 'text-gray-400 group-focus-within:text-gray-600'  // Neutral focus color
                }`} />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`w-full rounded-2xl py-4 pl-14 pr-14 transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm text-base ${  // Increased padding and size
                    isDarkMode 
                      ? 'bg-gray-800/60 border border-gray-600/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:bg-gray-800/80' 
                      : 'bg-gray-50/80 border border-gray-300/60 text-gray-800 placeholder-gray-500 focus:ring-gray-500/50 focus:bg-white/90'  // Neutral focus
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 transition-colors rounded-lg ${  // Increased size
                    isDarkMode 
                      ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'  // Neutral hover
                  }`}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  <motion.div
                    animate={{ scale: showPwd ? [1, 0.8, 1] : [1, 0.8, 1] }}
                    transition={{ duration: 0.2 }}
                  >
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.div>
                </button>
              </div>
            </label>

            {/* Enhanced Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`mb-8 flex items-center gap-3 rounded-xl p-5 text-sm font-medium shadow-sm border ${  // Increased padding and margin
                  isDarkMode 
                    ? 'bg-red-900/40 border-red-700/50 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Enhanced Login Button - MINIMAL RED ACCENT */}
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl py-4 text-lg font-semibold shadow-lg transition-all duration-300 ${ 
                loading
                  ? isDarkMode 
                    ? "bg-gray-600 cursor-not-allowed text-gray-400" 
                    : "bg-gray-400 cursor-not-allowed text-gray-600"
                  : isDarkMode
                  ? "bg-gradient-to-r from-red-600 to-red-900 hover:from-red-700 hover:to-red-800 text-white hover:shadow-xl"
                  : "bg-gradient-to-tr from-neutral-600 to-neutral-900 hover:bg-neutral-800 text-white hover:shadow-xl"
              }`}
              whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
                    isDarkMode 
                      ? 'border-gray-400/30 border-t-gray-400' 
                      : 'border-gray-600/30 border-t-gray-600'
                  }`}></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>ACCESS SYSTEM</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </div>
              )}
            </motion.button>
            
            {/* Enhanced Footer - INCREASED SPACING */}
            <div className="mt-10 text-center space-y-4 pt-8">
              <motion.button
                onClick={handleBackToHome}
                className={`font-semibold hover:underline transition-colors text-base ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                Explore QuantiFore Features
              </motion.button>
              
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                © {new Date().getFullYear()} QuantiFore Pvt. Ltd.
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}