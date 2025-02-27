import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-text-primary">
      <h1 className="text-6xl font-bold tracking-widest" style={{ fontFamily: 'Saira Stencil One, sans-serif' }}>QUANTIFORE</h1>
      <p className="text-lg mt-2">Unlock the power of data-driven insights</p>
      <button
        className="mt-6 px-6 py-3 bg-button-primary hover:bg-dark-button text-white rounded-lg text-lg"
        onClick={() => navigate("/preferences")}
      >
        Login
      </button>
    </div>
  );
};

export default LoginPage;