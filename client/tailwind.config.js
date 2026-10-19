/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#14232B',
        brand: {
          50: '#EEF7F7', 100: '#D4ECEC', 200: '#A9D8DA', 300: '#76BEC3', 400: '#43A0A9',
          500: '#24828D', 600: '#1A6772', 700: '#17535C', 800: '#15454D', 900: '#12363D',
        },
        saffron: { 400: '#F0B35C', 500: '#E8A33D', 600: '#CF8A22' },
      },
      boxShadow: { card: '0 1px 2px rgba(20,35,43,.06), 0 8px 24px -12px rgba(20,35,43,.18)' },
    },
  },
  plugins: [],
};
