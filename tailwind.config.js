/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3A4D1A', // Forest Olive
          foreground: '#F5EBE0',
        },
        accent: {
          DEFAULT: '#8D3B1A', // Deep Terracotta
          foreground: '#F5EBE0',
        },
        sand: '#E3D5CA',
        'earth-bg': '#F5EBE0',
        // Dark theme specific
        'dark-bg': '#000000',
        'dark-surface': '#121212',
        'dark-card': '#1E1E1E',
        'beige': '#F5F5DC',
      },
    },
  },
  plugins: [],
}
