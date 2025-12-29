import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/ErrorBoundary'; // Move your ErrorBoundary class here or keep it if it's in App.tsx

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Only one real route exists here */}
        <Route path="/" element={<LandingPage />} />
        
        {/* If someone tries to go to /login on the landing domain, send them to the app domain */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        
        {/* Catch-all sends everyone to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

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