/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2E7D32',
          highlight: '#388E3C',
          deep: '#1B4D1A',
          cream: '#FBF8F3',
          creamCard: '#FFFFFF',
          creamDark: '#EFE9DF',
          creamHover: '#F5EFE6',
          mint: '#EEF5EB',
          slate: '#1C2A20',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
