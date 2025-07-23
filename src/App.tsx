import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import Toast from "./components/ui/Toast";
import DashboardHome from "./pages/Dashboard";

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
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const showStepProgress = stepRoutes.includes(location.pathname);

  useEffect(() => {
    const interval = setInterval(() => {
      const token = sessionStorage.getItem("access_token");
      const loginTime = sessionStorage.getItem("login_time");

      if (token && loginTime) {
        const loginTimestamp = parseInt(loginTime, 10);
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;

        if (now - loginTimestamp > twoHours) {
          console.log("Session expired. Logging out...");
          sessionStorage.clear();
          setToast({
            type: "warning",
            message: "Session expired. Please log in again.",
          });
          navigate("/");
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <>
      {showStepProgress && <StepProgress />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/regions" element={<ProtectedRoute element={<RegionSelectionPage />} />} />
        <Route path="/frameworks" element={<ProtectedRoute element={<FrameworkSelectionPage />} />} />
        <Route path="/domains" element={<ProtectedRoute element={<DomainSelectionPage />} />} />
        <Route path="/stocks" element={<ProtectedRoute element={<StockSelectionPage />} />} />
        <Route path="/home" element={<ProtectedRoute element={<DashboardHome />} />} />
        <Route path="/monitoring" element={<ProtectedRoute element={<MainPage />} />} />
        <Route path="/visualization" element={<ProtectedRoute element={<Playground />} />} />
        <Route path="/alert" element={<ProtectedRoute element={<AlertPage />} />} />
        <Route path="/signal" element={<ProtectedRoute element={<SignalTrackerPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
      </Routes>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;
