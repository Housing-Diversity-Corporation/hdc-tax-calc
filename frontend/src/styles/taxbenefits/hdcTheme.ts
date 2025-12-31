/**
 * HDC Calculator Theme - Based on provided color palette
 */

export const hdcColors = {
  // Main Colors
  primary: {
    fadedJade: '#407F7F',
    sushi: '#7FBD45',
    gulfStream: '#92C3C2',
    mercury: '#E5E5E5',
    cabbagePont: '#474A44',
    white: '#FFFFFF',
    black: '#000000',
  },
  
  // Supplemental Colors
  secondary: {
    fountainBlue: '#54BFBF',
    sanJuan: '#3E5D80',
    bismark: '#43778A',
    spectra: '#1C3333',
    romanCoffee: '#73513E',
    husk: '#BFB05E',
    strikemaster: '#734968',
    brownRust: '#BF7041',
  },
  
  // Semantic Colors
  success: '#7FBD45', // Sushi green
  warning: '#BF7041', // Brown Rust
  error: '#734968', // Strikemaster
  info: '#54BFBF', // Fountain Blue
  
  // Background Colors
  background: {
    default: '#F5F5F5',
    paper: '#FFFFFF',
    light: '#E5E5E5', // Mercury
    dark: '#474A44', // Cabbage Pont
    section: 'rgba(146, 195, 194, 0.08)', // Gulf Stream with low opacity
    highlight: 'rgba(127, 189, 69, 0.1)', // Sushi with low opacity
  },
  
  // Text Colors
  text: {
    primary: '#1C3333', // Spectra
    secondary: '#474A44', // Cabbage Pont
    light: '#73513E', // Roman Coffee
    disabled: 'rgba(71, 74, 68, 0.5)',
    white: '#FFFFFF',
  },
  
  // Chart Colors (ordered for best visual distinction)
  charts: [
    '#407F7F', // Faded Jade
    '#7FBD45', // Sushi
    '#3E5D80', // San Juan
    '#BF7041', // Brown Rust
    '#734968', // Strikemaster
    '#54BFBF', // Fountain Blue
    '#BFB05E', // Husk
    '#43778A', // Bismark
  ],
};

// Typography Configuration
export const hdcTypography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
  },
  
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing System
export const hdcSpacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};

// Border Radius
export const hdcBorderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  default: '0.5rem', // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',
};

// Shadows
export const hdcShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(71, 74, 68, 0.05)',
  default: '0 1px 3px 0 rgba(71, 74, 68, 0.1), 0 1px 2px 0 rgba(71, 74, 68, 0.06)',
  md: '0 4px 6px -1px rgba(71, 74, 68, 0.1), 0 2px 4px -1px rgba(71, 74, 68, 0.06)',
  lg: '0 10px 15px -3px rgba(71, 74, 68, 0.1), 0 4px 6px -2px rgba(71, 74, 68, 0.05)',
  xl: '0 20px 25px -5px rgba(71, 74, 68, 0.1), 0 10px 10px -5px rgba(71, 74, 68, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(71, 74, 68, 0.06)',
};

// Transitions
export const hdcTransitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
};

// Breakpoints
export const hdcBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// CSS Helper Functions
export const getColorWithOpacity = (hex: string, opacity: number): string => {
  return `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export const getFinancialColor = (value: number): string => {
  if (value > 0) return hdcColors.success;
  if (value < 0) return hdcColors.error;
  return hdcColors.text.secondary;
};

export const getReturnColor = (irr: number): string => {
  if (irr >= 20) return hdcColors.primary.sushi;
  if (irr >= 15) return hdcColors.secondary.fountainBlue;
  if (irr >= 10) return hdcColors.secondary.husk;
  if (irr >= 5) return hdcColors.warning;
  return hdcColors.error;
};

// Export default theme object
const hdcTheme = {
  colors: hdcColors,
  typography: hdcTypography,
  spacing: hdcSpacing,
  borderRadius: hdcBorderRadius,
  shadows: hdcShadows,
  transitions: hdcTransitions,
  breakpoints: hdcBreakpoints,
};

export default hdcTheme;