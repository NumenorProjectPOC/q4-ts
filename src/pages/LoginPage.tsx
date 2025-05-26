import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamicTagline, setDynamicTagline] = useState("Access Restricted. Credentials Required.");
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    const taglines = [
      "Unlocking Insights, One Login at a Time.",
      "Enter the Gateway to Advanced Analytics.",
      "Your Key to Quantifore Awaits.",
      "Accessing the Future of Data Analysis.",
      "Empowering Decisions Through Secure Access."
    ];

    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * taglines.length);
      setDynamicTagline(taglines[randomIndex]);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!loginId.trim() || !password.trim()) {
      setError("Username and password cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login_id: loginId, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);      

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

        // Save required values to sessionStorage
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("org_id", data.org_id);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("organization_name", data.organization_name);
        sessionStorage.setItem("role", data.role);
      navigate("/monitoring");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-teal-400 animate-movingGradient"
          style={{ fontFamily: 'Saira Stencil One, sans-serif' }}
        >
          QUANTIFORE
        </h1>
        <p className="text-gray-600 text-lg mt-2">{dynamicTagline}</p>
      </div>

      <form
        className="w-full max-w-md p-8 rounded-lg shadow-2xl border-1 animate-fade-in"
        onSubmit={(e) => {
          e.preventDefault(); // Prevent default form behavior
          handleLogin();      // Call your login handler
        }}
      >
        <h1 className="text-3xl font-lato font-semibold text-center text-teal-800 mb-6">
          Login/SignUp
        </h1>

        <div className="relative mb-4">
          <div className="bg-teal-50 rounded-full flex items-center px-4 py-3 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <input
              type="email"
              placeholder="Username or Email"
              className="bg-transparent outline-none w-full ml-2 text-gray-800 placeholder-gray-400"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>
        </div>

        <div className="relative mb-6">
          <div className="relative mb-6">
            <div className="bg-teal-50 rounded-full flex items-center px-4 py-3 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="bg-transparent outline-none w-full ml-2 text-gray-800 placeholder-gray-400 pr-8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-lg italic mb-4">{error}</p>}

        <div className="flex items-center justify-center relative">
          <button
            className={`w-full font-bold py-3 rounded-full shadow-lg border-2 text-xl flex items-center justify-center transition-colors duration-300 ${loading
              ? "bg-teal-600 text-teal-100 border-teal-600 cursor-not-allowed"
              : "bg-white text-teal-700 hover:text-teal-100 border-teal-600 hover:bg-teal-600"
              }`}
            type="submit"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round"></circle>
                </svg>
                Processing...
              </>
            ) : (
              "ACCESS SYSTEM"
            )}
          </button>
        </div>

        <div className="text-center mt-4">
          <a href="#" className="text-teal-600 text-sm hover:text-teal-800">Forgot Password?</a>
        </div>
      </form>

      <footer className="mt-8 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Numenor Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage; 