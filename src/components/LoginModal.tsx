import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Lock, AlertTriangle, X } from "lucide-react";

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [tagline, setTagline] = useState("Enter the gateway to advanced analytics.");

  useEffect(() => {
    if (isOpen) {
      const lines = [
        "Unlocking insights, one log‑in at a time.",
        "Enter the gateway to advanced analytics.",
        "Your key to QuantiFore awaits.",
        "Accessing the future of data analysis.",
        "Empowering decisions through secure access.",
      ];
      const id = setInterval(() => setTagline(lines[Math.floor(Math.random() * lines.length)]), 3200);
      return () => clearInterval(id);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLoginId("");
      setPassword("");
      setError("");
      setLoading(false);
      setShowPwd(false);
    }
  }, [isOpen]);

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
      
      onSuccess?.();
      onClose();
      navigate("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-2xl overflow-hidden">
              {/* Gradient decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-700 to-red-800"></div>
              
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>

              <div className="p-8">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                  <motion.img
                    src="/qf-logo0.1.svg"
                    alt="QuantiFore"
                    className="h-10 w-auto mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                  {/* <motion.h2
                    className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Welcome Back
                  </motion.h2> */}
                  <motion.p
                    key={tagline}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="text-center text-sm text-gray-600"
                  >
                    {tagline}
                  </motion.p>
                </div>

                {/* Login Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  {/* Username Field */}
                  <div>
                    <label className="block">
                      <span className="sr-only">Username or Email</span>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-700 transition-colors" />
                        <input
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          type="email"
                          placeholder="Username or Email"
                          className="w-full rounded-xl bg-gray-50/80 border-2 border-gray-200 py-4 pl-12 pr-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all"
                          required
                        />
                      </div>
                    </label>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block">
                      <span className="sr-only">Password</span>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-700 transition-colors" />
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPwd ? "text" : "password"}
                          placeholder="Password"
                          className="w-full rounded-xl bg-gray-50/80 border-2 border-gray-200 py-4 pl-12 pr-12 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all"
                          required
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPwd((p) => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-700 transition-colors"
                          aria-label={showPwd ? "Hide password" : "Show password"}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    </label>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-medium text-red-800"
                      >
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-xl py-4 text-lg font-semibold text-white shadow-lg transition-all ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    }`}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Authenticating...
                      </div>
                    ) : (
                      "ACCESS SYSTEM"
                    )}
                  </motion.button>

                  {/* Footer */}
                  <div className="text-center pt-4">
                    <p className="text-xs text-gray-500">
                      © {new Date().getFullYear()} QuantiFore Pvt. Ltd.
                    </p>
                  </div>
                </motion.form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;