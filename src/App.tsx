import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/LoginPage";
import RegionSelectionPage from "./pages/RegionSelectionPage";
import MainPage from "./pages/MainPage";
import Playground from "./pages/Playground";
import Contact from "./pages/Contact";
import React from "react";
import FrameworkSelectionPage from "./pages/FrameworkSelectionPage";
import DomainSelectionPage from "./pages/DomainSelectionPage";
import StockSelectionPage from "./pages/StockSelectionPage";

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
        <Route path="/regions" element={<ProtectedRoute element={<RegionSelectionPage />} />} />
        <Route path="/monitoring" element={<ProtectedRoute element={<MainPage />} />} />
        <Route path="/playground" element={<ProtectedRoute element={<Playground />} />} />
        <Route path="/contact" element={<ProtectedRoute element={<Contact />} />} />
        <Route path="/frameworks" element={<ProtectedRoute element={<FrameworkSelectionPage />} />} />
        <Route path="/domains" element={<ProtectedRoute element={<DomainSelectionPage />} />} />
        <Route path="/stocks" element={<ProtectedRoute element={<StockSelectionPage />} />} />
      </Routes>
    </Router>
  );
};

export default App;
