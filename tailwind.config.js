/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'white': '#FFFFFF',
        'sage-green': '#6A958F',
        'light-blue': '#B8D7D9',
        'soft-pink': '#F5D6D6',
        'light-gray': '#E5E5E5',
        'dark-gray': '#2C3333',
        'secondary-gray': '#5C6B6B',
        'hover-sage': '#587b76',
        'transparent-gray': 'rgba(200, 200, 200, 0.3)',
        'dark-button': '#34495E',

        'background': '#FFFFFF',
        'navbar': 'rgba(200, 200, 200, 0.3)',
        'main-node': '#6A958F',
        'node-color-1': '#B8D7D9',
        'node-color-2': '#F5D6D6',
        'node-color-3': '#E5E5E5',
        'text-primary': '#2C3333',
        'text-secondary': '#5C6B6B',
        'button-primary': '#34495E',

      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        robotoMono: ['Roboto Mono', 'monospace'],
        sairaStencil: ['Saira Stencil One', 'cursive'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        typing: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        movingGradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        typing: 'typing 2s steps(30, end) infinite alternate',
        movingGradient: 'movingGradient 6s infinite alternate ease-in-out',
        blob: "blob 7s infinite ease-in-out",
        'fade-in': 'fadeIn 0.5s ease-in-out'
      },
    },
  },
  plugins: [],
};