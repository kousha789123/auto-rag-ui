/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    // Add other paths if needed
  ],
  theme: {
    extend: {
      // No custom colors needed anymore
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
