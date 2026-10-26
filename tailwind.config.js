/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

// Brand colors live only in design-tokens.json. colors.apple.DEFAULT is the frozen
// apple green primary — never change its value.
const { colors: palette } = require('./src/styles/design-tokens.json');

const toKebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const cssVariables = {
  '--color-primary': palette.apple.DEFAULT,
  '--color-primary-hover': palette.apple.hover,
  '--color-on-primary': palette.brand.forest,
  ...Object.fromEntries(
    Object.entries(palette.brand).map(([key, value]) => [`--brand-${toKebab(key)}`, value])
  ),
  '--radius-sm': '0.5rem',
  '--radius-md': '0.75rem',
  '--radius-lg': '1rem',
  '--radius-xl': '1.5rem',
  '--duration-fast': '150ms',
  '--duration-base': '200ms',
  '--duration-slow': '300ms',
  '--ease-standard': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--focus-ring': '#143B0D',
};

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '480px',
      ...defaultTheme.screens,
    },
    extend: {
      colors: palette,
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-tamil)', ...defaultTheme.fontFamily.sans],
        tamil: ['var(--font-noto-tamil)', 'var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgb(15 23 42 / 0.05)',
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
      },
      dropShadow: {
        '2xs': '0 1px 0 rgb(0 0 0 / 0.1)',
        xs: '0 1px 1px rgb(0 0 0 / 0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
      scale: {
        98: '0.98',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'smooth-fade': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.6)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-up': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-badge': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'smooth-fade': 'smooth-fade 0.4s ease-out both',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up': 'scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-badge': 'pulse-badge 0.3s ease-in-out',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVariables });
    }),
  ],
};
