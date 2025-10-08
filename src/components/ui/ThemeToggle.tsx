import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'floating';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-12 h-6',
      padding: 'p-0.5',
      iconContainer: 'w-5 h-5',
      icon: 'w-5 h-5'
    },
    md: {
      container: 'w-14 h-7',
      padding: 'p-0.5',
      iconContainer: 'w-6 h-6',
      icon: 'w-6 h-6'
    },
    lg: {
      container: 'w-16 h-8',
      padding: 'p-1',
      iconContainer: 'w-6 h-6',
      icon: 'w-6 h-6'
    }
  };

  const config = sizeConfig[size];

  // Variant configurations
  const getVariantClasses = () => {
    const baseClasses = `relative rounded-full cursor-pointer transition-all duration-300 border ${config.container} ${config.padding}`;
    
    switch (variant) {
      case 'minimal':
        return `${baseClasses} ${
          isDarkMode 
            ? 'bg-slate-700 border-slate-600' 
            : 'bg-gray-200 border-gray-300'
        }`;
      case 'floating':
        return `${baseClasses} shadow-lg ${
          isDarkMode 
            ? 'bg-slate-800/90 border-slate-600/50 backdrop-blur-md' 
            : 'bg-white/90 border-gray-200/50 backdrop-blur-md'
        }`;
      default:
        return `${baseClasses} shadow-sm backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-slate-800/80 border-slate-600/50' 
            : 'bg-white/80 border-gray-200/60'
        }`;
    }
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={`${getVariantClasses()} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {/* Track/Background */}
      <div className={`absolute inset-0 rounded-full transition-all duration-300 p-2 ${isDarkMode ? 'bg-slate-900/95 border-slate-700/30' : 'bg-brand-secondary-950/9 border-neutral-300/40'
        }`} />

      {/* Sliding Toggle Button */}
      <motion.div
        className={`relative ${config.iconContainer} rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isDarkMode
            ? 'bg-slate-900 text-orange-400'
            : 'bg-white text-blue-600'
          }`}
        animate={{
          x: isDarkMode ? `calc(100% + 2px)` : '0%'
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      >
        {/* Icon with smooth transition */}
        <motion.div
          initial={false}
          animate={{
            rotate: isDarkMode ? 230 : 0,
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
        >
          {isDarkMode ? (
            <Moon className={`${config.icon} drop-shadow-sm`} />
          ) : (
            <Sun className={`${config.icon} drop-shadow-sm`} />
          )}
        </motion.div>
      </motion.div>

      {/* Glow effect for floating variant */}
      {variant === 'floating' && (
        <motion.div
          className={`absolute inset-0 rounded-full blur-md -z-10 ${
            isDarkMode 
              ? 'bg-orange-500/20' 
              : 'bg-blue-400/20'
          }`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.button>
  );
};

// Preset configurations for common use cases
export const HeaderThemeToggle: React.FC<{ className?: string }> = ({ className }) => (
  <ThemeToggle 
    variant="default" 
    size="md" 
    className={className}
  />
);

export const FloatingThemeToggle: React.FC = () => (
  <ThemeToggle 
    variant="floating" 
    size="lg" 
    className="fixed top-6 right-6 z-50"
  />
);

export const MinimalThemeToggle: React.FC<{ className?: string }> = ({ className }) => (
  <ThemeToggle 
    variant="minimal" 
    size="sm" 
    className={className}
  />
);

export default ThemeToggle;