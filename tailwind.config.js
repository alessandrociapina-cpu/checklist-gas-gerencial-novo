/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f6fd',
          100: '#b3e3f8',
          200: '#80d0f4',
          300: '#4dbcef',
          500: '#00AEEF',
          600: '#009CDA',
          700: '#0082B8',
          900: '#003B5C',
        },
      },
    },
  },
  plugins: [],
}
