import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/LoginPage";
import RegionSelectionPage from "./pages/RegionSelectionPage";
import MainPage from "./pages/MainPage";
import Playground from "./pages/Playground";
import AlertPage from "./pages/AlertPage";
import FrameworkSelectionPage from "./pages/FrameworkSelectionPage";
import DomainSelectionPage from "./pages/DomainSelectionPage";
import StockSelectionPage from "./pages/StockSelectionPage";
import StepProgress from "./components/ui/StepProgress";
import SignalTrackerPage from "./pages/SignalTrackerPage";
import SettingsPage from "./pages/SettingsPage";

const stepRoutes = ["/regions", "/frameworks", "/domains", "/stocks"];



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
  const location = useLocation();
  const showStepProgress = stepRoutes.includes(location.pathname);

  return (
    <>
      {showStepProgress && <StepProgress />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/regions" element={<ProtectedRoute element={<RegionSelectionPage />} />} />
        <Route path="/frameworks" element={<ProtectedRoute element={<FrameworkSelectionPage />} />} />
        <Route path="/domains" element={<ProtectedRoute element={<DomainSelectionPage />} />} />
        <Route path="/stocks" element={<ProtectedRoute element={<StockSelectionPage />} />} />
        <Route path="/monitoring" element={<ProtectedRoute element={<MainPage />} />} />
        <Route path="/visualization" element={<ProtectedRoute element={<Playground />} />} />
        <Route path="/alert" element={<ProtectedRoute element={<AlertPage />} />} />
        <Route path="/signal" element={<ProtectedRoute element={<SignalTrackerPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
      </Routes>
    </>
  );
};

export default App;
