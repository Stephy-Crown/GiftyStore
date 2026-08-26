/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        boutique: {
          gold: "#D4AF37",
          darkGold: "#B8860B",
          nude: "#F5ECE5",
          accentPink: "#E8B4B8",
          charcoal: "#1A1A1A"
        }
      }
    },
  },
  plugins: [],
}
