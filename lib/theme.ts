/**
 * Design tokens shared across the app (colors, spacing, radii, typography).
 * Extracted from the "Modernist" design system used for the Home Familiar screen.
 */

export const colors = {
  // Neutral ramp — dark theme surfaces and text.
  neutral100: '#f8f4f4',
  neutral200: '#eae7e7',
  neutral300: '#d7d3d3',
  neutral400: '#bab6b6',
  neutral500: '#9b9797',
  neutral600: '#7d7979',
  neutral700: '#605d5d',
  neutral800: '#444141',
  neutral900: '#2d2b2b',

  // Accent ramp (warm orange/red).
  accent100: '#fff2ef',
  accent200: '#ffe0d9',
  accent300: '#ffc4b8',
  accent400: '#ff9783',
  accent500: '#ff563c',
  accent600: '#dd2b0f',
  accent700: '#ae1800',
  accent800: '#7c1405',
  accent900: '#4d170e',

  // Screen-level roles for the Home dashboard (dark theme).
  background: '#2d2b2b', // neutral900
  surface: '#444141', // neutral800
  surfaceHover: '#605d5d', // neutral700
  textPrimary: '#f8f4f4', // neutral100
  textMuted: '#9b9797', // neutral500
  divider: 'rgba(248,244,244,0.12)',
  divider2: 'rgba(248,244,244,0.08)',
  accentSoftBg: 'rgba(255,86,60,0.16)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  icon: 13,
  card: 20,
  pill: 999,
} as const;

export const typography = {
  fontFamily: 'Archivo, system-ui, sans-serif',
  headingWeight: '800' as const,
  kicker: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
    textTransform: 'uppercase' as const,
  },
  h1: {
    fontSize: 29,
    fontWeight: '800' as const,
    lineHeight: 33,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cardSubtitle: {
    fontSize: 12.5,
  },
  dateLabel: {
    fontSize: 13,
  },
} as const;
