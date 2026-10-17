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
          primary: '#4CB01E',
          highlight: '#3D9415',
          deep: '#1E4D12',
          forest: '#143B0D',
          cream: '#F8FAF7',
          creamCard: '#FFFFFF',
          creamDark: '#EAEFE7',
          creamHover: '#F5EFE6',
          mint: '#F1F9EC',
          slate: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
