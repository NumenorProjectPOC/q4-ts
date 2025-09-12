/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Your existing brand colors
        brand: {
          red: {
            50:  "#fff1f1",
            100: "#ffe0e0", 
            200: "#ffc2c2",
            300: "#f59b9b",
            400: "#ef6b6b",
            500: "#e94a4a",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d",
          },
          cream: {
            50:  "#fefcfb",
            100: "#fcf7f3",
            200: "#f7efe7",
          },
          black: "#0b0b0b",
          white: "#ffffff",
          gray: {
            50:  "#f8f9fb",
            100: "#eef1f5", 
            200: "#dfe4ea",
            300: "#c7ced6",
            400: "#9aa3ad",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
          },
        },
        
        // IMPORTANT: Add these extended color palettes for the enhanced UI
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3', 
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa', 
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      
      // Add backdrop blur support
      backdropBlur: {
        'none': '0',
        'blur': 'blur(8px)',
        'sm': 'blur(4px)',
        'md': 'blur(8px)', 
        'lg': 'blur(16px)',
        'xl': 'blur(24px)',
        '2xl': 'blur(40px)',
        '3xl': 'blur(64px)',
      },
      
      // Add animation keyframes (your existing ones)
      keyframes: {
        fadeIn: { '0%': { opacity: 0, transform: 'scale(0.95)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        typing: { '0%': { width: '0%' }, '100%': { width: '100%' } },
        movingGradient: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        blob: { '0%': { transform: 'translate(0,0) scale(1)' }, '33%': { transform: 'translate(30px,-50px) scale(1.1)' }, '66%': { transform: 'translate(-20px,20px) scale(0.9)' }, '100%': { transform: 'translate(0,0) scale(1)' } },
        shimmer: { '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' }, '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' } },
        // Add new enhanced animations
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .8 }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.2s ease-in-out',
        fadeIn: 'fadeIn 0.5s ease-out', 
        typing: 'typing 2s steps(30, end) infinite alternate',
        movingGradient: 'movingGradient 6s infinite alternate ease-in-out',
        blob: 'blob 7s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        // Enhanced animations
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
    },
  },
  plugins: [],
};