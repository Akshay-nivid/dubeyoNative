/** @type {import('tailwindcss').Config} */
const { colors } = require("./theme");
module.exports = {
  content: ["./app/**/*.{js,ts,tsx}", "./src/**/*.{js,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: { colors },
  },
  plugins: [],
};
