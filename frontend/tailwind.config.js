/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark navy theme matching reference
        navy: {
          950: '#0f1419',  // Darkest background
          900: '#1a1f2e',  // Main background
          800: '#222939',  // Card background
          700: '#2d3548',  // Lighter card
          600: '#3d4558',  // Borders
        },
      },
    },
  },
  plugins: [],
}
