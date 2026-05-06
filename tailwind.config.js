/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Diodrum Arabic"',
          '"DiodrumArabicBold"',
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
        'waseela-blue': '#1D1DDB',
        'waseela-orange': '#FF6B00',
      }
    },
  },
  plugins: [],
}
