import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Lock, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;
const ENABLE_BG = (import.meta.env.VITE_LOGIN_BG ?? "true") === "true";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tagline, setTagline] = useState("Enter the gateway to advanced analytics.");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const lines = [
      "Unlocking insights, one log‑in at a time.",
      "Enter the gateway to advanced analytics.",
      "Your key to QuantiFore awaits.",
      "Accessing the future of data analysis.",
      "Empowering decisions through secure access.",
    ];
    const id = setInterval(() => setTagline(lines[Math.floor(Math.random() * lines.length)]), 3200);
    return () => clearInterval(id);
  }, []);

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
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("org_id", data.org_id);
      sessionStorage.setItem("username", data.username);
      sessionStorage.setItem("organization_name", data.organization_name);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("login_time", now.toString());
      navigate("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-brand-black">
      {ENABLE_BG && (
        <>
          <div className="pointer-events-none absolute -top-32 -left-24 h-[34rem] w-[34rem] rounded-full bg-brand-red-100/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[34rem] w-[34rem] rounded-full bg-brand-cream-200/50 blur-3xl" />
        </>
      )}

      {/* Simple Back Button */}
      <motion.div 
        className="relative z-20 p-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.button
          onClick={handleBackToHome}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300 group"
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </motion.button>
      </motion.div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center">
            {/* Main Logo */}
            <motion.img
              src="/qf-logo0.1.svg"
              alt="QuantiFore"
              className="h-20 w-auto mb-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            />
            
            {/* Welcome Header */}
            <motion.h1
              className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent mb-2 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Welcome Back
            </motion.h1>

            <motion.p
              key={tagline}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-8 text-center text-base text-neutral-600 leading-relaxed"
            >
              {tagline}
            </motion.p>
          </div>

          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="rounded-3xl border border-brand-red-100 bg-brand-cream-50/80 backdrop-blur-sm p-8 shadow-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Username */}
            <label className="block mb-6">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Username or Email</span>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-brand-red-700 transition-colors" />
                <input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  type="email"
                  placeholder="Enter your username or email"
                  className="w-full rounded-2xl bg-white border-2 border-brand-red-100 py-4 pl-12 pr-4 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-red-300 focus:border-brand-red-300 transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block mb-6">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Password</span>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-brand-red-700 transition-colors" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl bg-white border-2 border-brand-red-100 py-4 pl-12 pr-12 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-red-300 focus:border-brand-red-300 transition-all shadow-sm hover:shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-brand-red-700 transition-colors rounded-lg hover:bg-gray-100"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-3 rounded-xl bg-brand-red-50 border border-brand-red-100 p-4 text-sm font-medium text-brand-red-800 shadow-sm"
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 ${
                loading
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-brand-red-700 to-brand-red-800 hover:from-brand-red-800 hover:to-brand-red-700 hover:shadow-xl"
              }`}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>ACCESS SYSTEM</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </div>
              )}
            </motion.button>

            {/* Simplified Footer */}
            <div className="mt-8 text-center space-y-3 border-t border-brand-red-100 pt-6">
              <motion.button
                onClick={handleBackToHome}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors text-sm"
                whileHover={{ scale: 1.02 }}
              >
                Explore Quantifore Features
              </motion.button>
              
              <p className="text-sm text-neutral-500">
                © {new Date().getFullYear()} QuantiFore Pvt. Ltd.
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}