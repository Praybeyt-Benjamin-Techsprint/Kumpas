/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C49A14',
          light: '#E8B84B',
          dark: '#8A6B0E',
        },
        maroon: {
          DEFAULT: '#5C0A14',
          dark: '#3A0008',
          deep: '#1A0004',
        },
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
