/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf9',
          100: '#ccfbf0',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#0d5c58',
          800: '#0a4d49',
          900: '#073a37',
          950: '#032321',
        },
        surface: {
          light: '#f8fafc',
          card: '#ffffff',
          dark: '#0f172a',
          darkcard: '#1e293b',
          darkborder: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
