import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // Add this import
import Login from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import RegionSelectionPage from './pages/RegionSelectionPage';
import MainPage from './pages/MainPage';
import Playground from './pages/Playground';
import AlertPage from './pages/AlertPage';
import FrameworkSelectionPage from './pages/FrameworkSelectionPage';
import DomainSelectionPage from './pages/DomainSelectionPage';
import StockSelectionPage from './pages/StockSelectionPage';
import StepProgress from './components/ui/StepProgress';
import SignalTrackerPage from './pages/SignalTrackerPage';
import SettingsPage from './pages/SettingsPage';
import Toast from './components/ui/Toast';
import DashboardHome from './pages/Dashboard';
import { AIWebSocketProvider } from './context/AIWebSocketContext';
import WebSocketNotifications from './components/ui/WebSocketNotification';
import React, { useEffect, useState } from 'react';
import LoginSuccessAnimation from './components/ui/LoginSuccessAnimation';

const stepRoutes = ['/regions', '/frameworks', '/domains', '/stocks'];

/**
 * Error Boundary Component - Catches and handles component errors gracefully
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <h2 className="text-red-800 dark:text-red-200 font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded transition-colors"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Protected Route Component - Ensures user is authenticated before accessing protected routes
 */
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <ErrorBoundary>
      {element}
    </ErrorBoundary>
  );
};

/**
 * Authenticated App Wrapper - Wraps authenticated routes with WebSocket provider
 */
const AuthenticatedApp: React.FC<{ showStepProgress: boolean }> = ({ showStepProgress }) => {
  const navigate = useNavigate();

  // Monitor session expiration for authenticated users
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('access_token');
      const loginTime = localStorage.getItem('login_time');

      if (token && loginTime) {
        const loginTimestamp = parseInt(loginTime, 10);
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;

        if (now - loginTimestamp > twoHours) {
          console.log('Session expired. Logging out...');
          localStorage.clear();
          navigate('/login');
        }
      } else {
        // No token found, redirect to login
        navigate('/login');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [navigate]);

  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL

  return (
    <AIWebSocketProvider wsUrl={wsUrl}>
      <ErrorBoundary>
        {showStepProgress && <StepProgress />}

        {/* Protected Routes with WebSocket connection available */}
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login-success" element={<ProtectedRoute element={<LoginSuccessAnimation />} />} />
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
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>

        {/* WebSocket Notifications - Only available in authenticated context */}
        <WebSocketNotifications />
      </ErrorBoundary>
    </AIWebSocketProvider>
  );
};

/**
 * Loading Component - Shows while checking authentication status
 */
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
  </div>
);

/**
 * Main App Component - Handles authentication state and routing
 */
const App: React.FC = () => {
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking
  const location = useLocation();
  const navigate = useNavigate();
  const showStepProgress = stepRoutes.includes(location.pathname);

  // Check authentication status on app load and route changes
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('access_token');
      const loginTime = localStorage.getItem('login_time');

      if (token && loginTime) {
        const loginTimestamp = parseInt(loginTime, 10);
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;

        if (now - loginTimestamp > twoHours) {
          // Session expired
          localStorage.clear();
          setIsAuthenticated(false);
          setToast({
            type: 'warning',
            message: 'Session expired. Please log in again.',
          });
          navigate('/landing');
        } else {
          // Valid session
          setIsAuthenticated(true);
        }
      } else {
        // No valid session
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, [location.pathname, navigate]);

 useEffect(() => {
    const syncAuth = (event: StorageEvent) => {
      // Check specifically for access_token changes
      if (event.key === 'access_token') {
        
        // Scenario A: User logged OUT in another tab (newValue is null)
        if (event.newValue === null) {
          setIsAuthenticated(false);
          navigate('/login');
        } 
        
        // Scenario B: User logged IN in another tab (newValue exists)
        // We check !isAuthenticated to prevent unnecessary updates if already logged in
        else if (event.newValue && !isAuthenticated) {
          // Verify we have the login_time to ensure the session is fully set
          const loginTime = localStorage.getItem('login_time');
          
          if (loginTime) {
             console.log("Login detected from another tab. Syncing...");
             setIsAuthenticated(true);
             // The main render logic below will pick up 'isAuthenticated: true' 
             // and the AuthenticatedApp will handle the redirect to /home
          }
        }
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [navigate, isAuthenticated]);

  // Show loading screen while checking authentication
  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  // If user is authenticated and not on public routes, show authenticated app
  if (isAuthenticated) {
    return (
      <>
        <AuthenticatedApp showStepProgress={showStepProgress} />
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Show public routes for unauthenticated users
  return (
    <ErrorBoundary>
      <Routes>
        {/* Landing page as default route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </ErrorBoundary>
  );
};

/**
 * Root App Component with Theme Provider
 */
const RootApp: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="theme-transition">
        <App />
      </div>
    </ThemeProvider>
  );
};

export default RootApp;