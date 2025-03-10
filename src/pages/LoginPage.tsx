import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const response = await fetch("http://localhost:8000/org/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login_id: loginId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store token & org_id in session storage
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("org_id", data.org_id);

      navigate("/preferences");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-text-primary">
      <h1 className="text-6xl font-bold tracking-widest" style={{ fontFamily: 'Saira Stencil One, sans-serif' }}>QUANTIFORE</h1>
      <p className="text-lg mt-2">Unlock the power of data-driven insights</p>
      
      <div className="mt-6 flex flex-col gap-4 w-80">
        <input
          type="email"
          placeholder="Email"
          className="p-2 border border-gray-300 rounded-lg"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 border border-gray-300 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          className="px-6 py-3 bg-button-primary hover:bg-dark-button text-white rounded-lg text-lg"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
