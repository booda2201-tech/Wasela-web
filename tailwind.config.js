/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Diodrum Cyrillic"',
          '"Diodrum Arabic"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        'waseela-blue': '#0D11B3',
        'waseela-orange': '#FF6B00',
      }
    },
  },
  plugins: [],
}
