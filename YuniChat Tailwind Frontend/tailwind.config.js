/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-transparent': {
          'scrollbar-color': 'transparent transparent',
        },
        '.hover\\:scrollbar-thumb-gray-400:hover': {
          'scrollbar-color': 'rgb(156, 163, 175) transparent',
        },
        '.dark .dark\\:hover\\:scrollbar-thumb-gray-600:hover': {
          'scrollbar-color': 'rgb(75, 85, 99) transparent',
        },
        '.scrollbar-track-transparent': {
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'transparent',
            'border-radius': '3px',
          },
          '&:hover::-webkit-scrollbar-thumb': {
            background: 'rgb(156, 163, 175)',
          },
        },
        '.dark .scrollbar-track-transparent': {
          '&:hover::-webkit-scrollbar-thumb': {
            background: 'rgb(75, 85, 99)',
          },
        },
      });
    },
  ],
}
