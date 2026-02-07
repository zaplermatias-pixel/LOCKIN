/** @type {import('tailwindcss').Config} */
export default {
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
      },
    },
  },
  plugins: [],
}
