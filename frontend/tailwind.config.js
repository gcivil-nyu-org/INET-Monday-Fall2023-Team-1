/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  daisyui: {
    themes: ["emerald", "cmyk"],
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography"), require("daisyui")],
};
