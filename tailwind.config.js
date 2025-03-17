/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        turquoise: '#38DDCD',
        aquamarine: '#8FECD5',
        champagne: '#FDE7DB',
        pink: '#FFCOCB',
        amaranth: '#F79AC4',
        primary: '#738fbd',
        secondary: '#a8c3d6',
        accent: '#cc6b8e'
      }
    },
  },
  plugins: [],
}
