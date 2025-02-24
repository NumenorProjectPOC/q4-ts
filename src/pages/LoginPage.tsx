import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-6xl font-bold quantifore-heading leading-widest">QUANTIFORE</h1>
      <p className="text-lg mt-2">Unlock the power of data-driven insights</p>
      <button
        className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg text-lg"
        onClick={() => navigate("/preferences")}
      >
        Login
      </button>
    </div>
  );
};

export default LoginPage;
