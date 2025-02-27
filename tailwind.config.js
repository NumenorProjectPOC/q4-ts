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
        'genos': ['Genos', 'sans-serif'],
        'keania': ['Keania One', 'cursive'],
      },
    },
  },
  plugins: [],
};