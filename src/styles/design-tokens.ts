/**
 * Sri Amman Supermarket — Design System Tokens
 * RULE 1 PALETTE LOCK: All colors strictly mirror PROGRESS-ADMIN.md.
 * Derived shades use alpha transparencies or existing palette neutrals.
 */

export const TOKENS = {
  colors: {
    // Brand Apple Green (Primary Accent)
    apple: {
      DEFAULT: '#76CA3E',
      hover: '#60B328',
      tint10: 'rgba(118, 202, 62, 0.10)',
      tint20: 'rgba(118, 202, 62, 0.20)',
    },
    // Brand Greens
    brand: {
      primary: '#4CB01E',
      highlight: '#3D9415',
      deep: '#1E4D12',
      forest: '#143B0D',
      mint: '#F1F9EC',
      mintBorder: 'rgba(118, 202, 62, 0.35)',
    },
    // Neutrals & Surfaces
    surface: {
      white: '#FFFFFF',
      cream: '#F8FAF7',
      creamDark: '#EAEFE7',
      creamHover: '#F5EFE6',
      card: '#FFFFFF',
    },
    // Typography Slate
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
      inverted: '#FFFFFF',
    },
    // Borders & Dividers
    border: {
      subtle: '#E2E8F0',
      strong: '#CBD5E1',
      dark: '#EAEFE7',
    },
    // Status Accents
    status: {
      amber: {
        text: '#2F1500',
        bg: '#FFDCC3',
        solid: '#FE932C',
      },
      blue: {
        text: '#00174B',
        bg: '#DBE1FF',
        solid: '#0047BF',
      },
      emerald: {
        text: '#002115',
        bg: '#97F5CC',
        solid: '#047857',
      },
      rose: {
        text: '#410002',
        bg: '#FFDAD6',
        solid: '#BA1A1A',
      },
    },
  },

  // 4px & 8px strict spacing scale
  spacing: {
    0: '0px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Typography definitions
  typography: {
    pageTitle: 'text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900',
    sectionTitle: 'text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900',
    cardTitle: 'text-sm sm:text-base font-bold text-slate-900',
    label: 'text-xs font-bold uppercase tracking-wider text-slate-600',
    body: 'text-sm font-normal text-slate-700 leading-relaxed',
    bodyMedium: 'text-sm font-medium text-slate-800 leading-relaxed',
    caption: 'text-xs font-medium text-slate-500',
    tabular: 'font-mono tabular-nums',
  },

  // Radii
  radii: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    '2xs': '0 1px 1px 0 rgb(15 23 42 / 0.05)',
    xs: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
    sm: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.08)',
    md: '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
    lg: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.08)',
    xl: '0 20px 25px -5px rgb(15 23 42 / 0.1), 0 8px 10px -6px rgb(15 23 42 / 0.1)',
  },

  // Z-Index Layers
  zIndex: {
    dropdown: 100,
    sticky: 200,
    drawer: 300,
    modal: 400,
    toast: 500,
  },

  // Animations & Transitions (150ms to 250ms)
  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    base: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Breakpoints
  breakpoints: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;

export default TOKENS;
