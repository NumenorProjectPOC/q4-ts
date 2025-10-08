import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Moon, Sun } from 'lucide-react';

interface ThemeSwitcher {
  currentTheme: string;
  isDarkMode: boolean;
  onThemeChange: (theme: string) => void;
  onModeToggle: () => void;
}

// Simplified theme definitions with color previews
const THEME_CONFIGS = {
  'realistic-dark': {
    name: 'Dark Teal',
    primaryColor: '#4DD0E1',
    accentColor: '#FF5722',
    description: 'Cyan & Teal'
  },
  'realistic-light': {
    name: 'Light Cream',
    primaryColor: '#FFCCBC',
    accentColor: '#C62828',
    description: 'Cream & Peach'
  },
  'brand-gradient': {
    name: 'Gradient',
    primaryColor: '#6B7280',
    accentColor: '#EF4444',
    description: 'Smooth Gradients'
  },
  'brand-dark-minimal': {
    name: 'Dark Minimal',
    primaryColor: '#4B5563',
    accentColor: '#EF4444',
    description: 'Clean Dark'
  },
  'brand-light-minimal': {
    name: 'Light Minimal',
    primaryColor: '#C0C0C0',
    accentColor: '#DC2626',
    description: 'Clean Light'
  }
};

const ThemeSwitcher: React.FC<ThemeSwitcher> = ({
  currentTheme,
  isDarkMode,
  onThemeChange,
  onModeToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const resolvedTheme = currentTheme === 'brand-auto' 
    ? (isDarkMode ? 'realistic-dark' : 'realistic-light')
    : currentTheme;

  const activeTheme = THEME_CONFIGS[resolvedTheme as keyof typeof THEME_CONFIGS] || THEME_CONFIGS['realistic-dark'];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded theme circles */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col gap-3 mb-4"
          >
            {/* Auto theme */}
            <motion.button
              onClick={() => onThemeChange('brand-auto')}
              onHoverStart={() => setShowTooltip('auto')}
              onHoverEnd={() => setShowTooltip(null)}
              className={`relative w-12 h-12 rounded-full border-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                currentTheme === 'brand-auto'
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 border-purple-400/50 ring-2 ring-blue-400/30'
                  : 'bg-gradient-to-br from-purple-400/80 to-blue-400/80 border-purple-300/50 hover:border-purple-400/70'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-center w-full h-full">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-white/90" />
                  <div className="w-2 h-2 rounded-full bg-white/60" />
                  <div className="w-2 h-2 rounded-full bg-white/60" />
                  <div className="w-2 h-2 rounded-full bg-white/90" />
                </div>
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {showTooltip === 'auto' && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg border ${
                      isDarkMode
                        ? 'bg-slate-800/95 border-slate-700/50 text-white'
                        : 'bg-white/95 border-neutral-200/60 text-neutral-900'
                    }`}
                  >
                    Auto Theme (Follows System)
                    <div className={`absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent ${
                      isDarkMode ? 'border-l-slate-800/95' : 'border-l-white/95'
                    }`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Theme circles */}
            {Object.entries(THEME_CONFIGS).map(([themeKey, config]) => {
              const isActive = resolvedTheme === themeKey;
              
              return (
                <motion.button
                  key={themeKey}
                  onClick={() => onThemeChange(themeKey)}
                  onHoverStart={() => setShowTooltip(themeKey)}
                  onHoverEnd={() => setShowTooltip(null)}
                  className={`relative w-12 h-12 rounded-full border-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                    isActive 
                      ? 'ring-2 ring-blue-400/50 border-white/60' 
                      : 'border-white/30 hover:border-white/60'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})`
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-2 rounded-full bg-white/30 flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-white/90" />
                    </motion.div>
                  )}

                  {/* Tooltip */}
                  <AnimatePresence>
                    {showTooltip === themeKey && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg border ${
                          isDarkMode
                            ? 'bg-slate-800/95 border-slate-700/50 text-white'
                            : 'bg-white/95 border-neutral-200/60 text-neutral-900'
                        }`}
                      >
                        <div className="font-bold">{config.name}</div>
                        <div className="text-xs opacity-80">{config.description}</div>
                        <div className={`absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent ${
                          isDarkMode ? 'border-l-slate-800/95' : 'border-l-white/95'
                        }`} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toggle button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 rounded-full border-2 shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
          isExpanded
            ? isDarkMode
              ? 'bg-slate-800/90 border-slate-600/50 text-white'
              : 'bg-white/90 border-neutral-300/60 text-neutral-700'
            : 'border-white/40 hover:border-white/70'
        }`}
        style={{
          background: isExpanded ? undefined : `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.accentColor})`
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center w-full h-full"
        >
          {isExpanded ? (
            <div className="text-2xl">×</div>
          ) : (
            <Palette className="w-6 h-6 text-white drop-shadow-sm" />
          )}
        </motion.div>
      </motion.button>

      {/* Responsive adjustments for mobile */}
      <style>{`
        @media (max-width: 640px) {
          .fixed.bottom-6.right-6 {
            bottom: 1rem;
            right: 1rem;
          }
        }
        @media (max-width: 480px) {
          .fixed.bottom-6.right-6 {
            bottom: 0.75rem;
            right: 0.75rem;
          }
          .w-14.h-14 {
            width: 3rem;
            height: 3rem;
          }
          .w-12.h-12 {
            width: 2.75rem;
            height: 2.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ThemeSwitcher;
