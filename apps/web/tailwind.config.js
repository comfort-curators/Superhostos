/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1a1a1a',
        cream: '#f8f6f3',
        stone: '#6b6b6b',
        accent: '#c5a26f',
      },
      fontFamily: {
        bodoni: ['Bodoni Moda', 'serif'],
      },
    },
  },
  plugins: [],
};
