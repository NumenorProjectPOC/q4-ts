import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/LoginPage";
import Preferences from "./pages/PreferencesPage";
import MainPage from "./pages/MainPage";
import Playground from "./pages/Playground";
import Contact from "./pages/Contact";
import React from "react";
import PreferancesPage2 from "./pages/PreferancesPage2";

const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  return <>{element}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/preferences" element={<ProtectedRoute element={<Preferences />} />} />
        <Route path="/main" element={<ProtectedRoute element={<MainPage />} />} />
        <Route path="/playground" element={<ProtectedRoute element={<Playground />} />} />
        <Route path="/contact" element={<ProtectedRoute element={<Contact />} />} />
        <Route path="/preferancePage2" element={<PreferancesPage2/>} />
      </Routes>
    </Router>
  );
};

export default App;
