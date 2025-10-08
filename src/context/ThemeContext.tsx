import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  systemPreference: boolean;
  isFollowingSystem: boolean;
  setFollowSystem: (follow: boolean) => void;
  themeTransition: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [systemPreference, setSystemPreference] = useState<boolean>(false);
  const [isFollowingSystem, setIsFollowingSystem] = useState<boolean>(false);
  const [themeTransition, setThemeTransition] = useState<boolean>(false);

  // Detect system preference
  const detectSystemPreference = useCallback(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('quantifore--theme');
    const savedFollowSystem = localStorage.getItem('quantifore--follow-system') === 'true';
    const currentSystemPref = detectSystemPreference();
    
    setSystemPreference(currentSystemPref);
    setIsFollowingSystem(savedFollowSystem);

    if (savedFollowSystem) {
      setIsDarkMode(currentSystemPref);
    } else if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // First time visit - follow system preference
      setIsDarkMode(currentSystemPref);
      setIsFollowingSystem(true);
      localStorage.setItem('quantifore--follow-system', 'true');
    }
  }, [detectSystemPreference]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches);
      
      if (isFollowingSystem) {
        setThemeTransition(true);
        setIsDarkMode(e.matches);
        
        // Reset transition flag after animation
        setTimeout(() => setThemeTransition(false), 500);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [isFollowingSystem]);

  // Apply theme to document with enhanced features
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Add transition class for smooth theme switching
    root.classList.add('theme-transition');
    
    // Apply theme classes with animation
    if (themeTransition) {
      root.classList.add(isDarkMode ? 'switching-to-dark' : 'switching-to-light');
      setTimeout(() => {
        root.classList.remove('switching-to-dark', 'switching-to-light');
      }, 500);
    }
    
    // Apply main theme classes
    if (isDarkMode) {
      root.classList.add('dark');
      root.dataset.colorScheme = 'dark'; // Use data attribute for CSS
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
    } else {
      root.classList.remove('dark');
      root.dataset.colorScheme = 'light'; // Use data attribute for CSS
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
    }
    
    // Save to localStorage (only if not following system)
    if (!isFollowingSystem) {
      localStorage.setItem('quantifore--theme', isDarkMode ? 'dark' : 'light');
    }
    localStorage.setItem('quantifore--follow-system', isFollowingSystem.toString());

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // === MODIFIED: Use new dark theme color ===
      metaThemeColor.setAttribute('content', isDarkMode ? '#0f172a' : '#fcfcf9');
    }

    // Update status bar style for mobile apps
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      metaStatusBar.setAttribute('content', isDarkMode ? 'black-translucent' : 'default');
    }

    // === REMOVED: Inline style injections for better CSS control ===
    // The root.style.setProperty lines have been removed to allow index.css to manage the theme.

  }, [isDarkMode, isFollowingSystem, themeTransition]);

  const toggleTheme = useCallback(() => {
    setThemeTransition(true);
    
    if (isFollowingSystem) {
      // First toggle switches to manual mode with opposite of system preference
      setIsFollowingSystem(false);
      setIsDarkMode(!systemPreference);
    } else {
      // Normal toggle
      setIsDarkMode(prev => !prev);
    }
    
    // Reset transition flag after animation
    setTimeout(() => setThemeTransition(false), 500);
  }, [isFollowingSystem, systemPreference]);

  const setDarkMode = useCallback((isDark: boolean) => {
    setThemeTransition(true);
    setIsFollowingSystem(false);
    setIsDarkMode(isDark);
    
    setTimeout(() => setThemeTransition(false), 500);
  }, []);

  const setFollowSystem = useCallback((follow: boolean) => {
    setIsFollowingSystem(follow);
    
    if (follow) {
      setThemeTransition(true);
      setIsDarkMode(systemPreference);
      localStorage.removeItem('quantifore--theme');
      setTimeout(() => setThemeTransition(false), 500);
    }
  }, [systemPreference]);

  // Performance optimization: prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    isDarkMode,
    toggleTheme,
    setDarkMode,
    systemPreference,
    isFollowingSystem,
    setFollowSystem: setFollowSystem,
    themeTransition
  }), [
    isDarkMode,
    toggleTheme,
    setDarkMode,
    systemPreference,
    isFollowingSystem,
    setFollowSystem,
    themeTransition
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Additional utility hooks
export const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState<boolean>(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return systemTheme;
};

export const useThemeClass = (lightClass: string, darkClass: string) => {
  const { isDarkMode } = useTheme();
  return isDarkMode ? darkClass : lightClass;
};

export const useThemeValue = <T,>(lightValue: T, darkValue: T): T => {
  const { isDarkMode } = useTheme();
  return isDarkMode ? darkValue : lightValue;
};