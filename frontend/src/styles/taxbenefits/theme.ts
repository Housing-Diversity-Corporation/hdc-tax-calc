/**
 * HDC Calculator Theme Configuration
 * Modern, professional design system
 */

import { createTheme } from '@mui/material/styles';

// Color Palette
export const colors = {
  // Primary - Professional Blue
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  
  // Secondary - Elegant Green
  secondary: {
    main: '#00897b',
    light: '#4db6ac',
    dark: '#00695c',
    contrastText: '#ffffff',
  },
  
  // Success - Positive Returns
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  
  // Warning - Caution/Attention
  warning: {
    main: '#f57c00',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  
  // Error - Negative/Loss
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  
  // Background colors
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
    dark: '#121212',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  
  // Text colors
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
  },
  
  // Custom colors for financial data
  financial: {
    profit: '#00c853',
    loss: '#ff1744',
    neutral: '#9e9e9e',
    irr: '#3f51b5',
    equity: '#009688',
    debt: '#ff6f00',
    pik: '#7b1fa2',
  },
  
  // Chart colors
  charts: {
    series1: '#1976d2',
    series2: '#00897b',
    series3: '#7b1fa2',
    series4: '#f57c00',
    series5: '#d32f2f',
    series6: '#00acc1',
    grid: 'rgba(0, 0, 0, 0.08)',
  },
};

// Typography
export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase' as const,
  },
};

// Spacing
export const spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// Shadows
export const shadows = {
  sm: '0 2px 4px rgba(0,0,0,0.1)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.1)',
  card: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  cardHover: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
};

// Border Radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: '50%',
  pill: 9999,
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
  verySlow: '500ms ease-in-out',
};

// Z-index layers
export const zIndex = {
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};

// Create MUI Theme
export const hdcTheme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: colors.text,
  },
  typography,
  spacing: spacing.unit,
  shape: {
    borderRadius: borderRadius.md,
  },
  breakpoints: {
    values: breakpoints,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          textTransform: 'none',
          fontWeight: 500,
          padding: `${spacing.sm}px ${spacing.md}px`,
          transition: transitions.normal,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: shadows.md,
          },
        },
        contained: {
          boxShadow: shadows.sm,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.card,
          transition: transitions.normal,
          '&:hover': {
            boxShadow: shadows.cardHover,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.md,
            transition: transitions.fast,
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary.main,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary.main,
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.md,
        },
        elevation3: {
          boxShadow: shadows.lg,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.87)',
          fontSize: '0.75rem',
          borderRadius: borderRadius.sm,
          padding: `${spacing.xs}px ${spacing.sm}px`,
        },
      },
    },
  },
});

// Export utility functions
export const getFinancialColor = (value: number): string => {
  if (value > 0) return colors.financial.profit;
  if (value < 0) return colors.financial.loss;
  return colors.financial.neutral;
};

export const getReturnColor = (irr: number): string => {
  if (irr >= 20) return colors.success.main;
  if (irr >= 15) return colors.financial.profit;
  if (irr >= 10) return colors.warning.main;
  if (irr >= 5) return colors.warning.light;
  return colors.error.main;
};

export default hdcTheme;