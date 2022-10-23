/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'west-red': "#612f3c",
        'west-teal': "#9fd0ca",
        'west-cream': "#fff0de",
        'west-brown': "#4c1d27",
      },
    },
  },
  plugins: [
    require('@headlessui/tailwindcss'),
  ],
}
