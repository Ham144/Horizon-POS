/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    // Di sinilah keajaibannya terjadi
    daisyui: "nord"
  },
};
