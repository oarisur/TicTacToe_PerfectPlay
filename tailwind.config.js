// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/index.html',
    './src/js/**/*.js', // Crucial for reading classes used by your JavaScript
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}