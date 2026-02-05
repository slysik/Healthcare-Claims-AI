/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bcbs: {
          blue: '#0057B8',
          'blue-dark': '#003D82',
          'blue-light': '#E8F0FE',
        },
      },
    },
  },
  plugins: [],
}
