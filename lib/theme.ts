/**
 * Design tokens shared across the app (colors, spacing, radii, typography).
 * Extracted from the "Modernist" design system used for the Home Familiar screen.
 *
 * Colors come in two flavors:
 * - Raw ramps (neutralXXX / accentXXX) and the brand accent (accent500/600,
 *   accentSoftBg): identical in light and dark mode, always safe to import
 *   directly.
 * - `ColorPalette` (background/surface/textPrimary/...): the roles that
 *   actually invert between themes. Screens should read these through
 *   `useColors()` from `ThemeProvider`, not import a static object.
 */

// Neutral ramp — dark theme surfaces and text.
export const neutral100 = '#f8f4f4';
export const neutral200 = '#eae7e7';
export const neutral300 = '#d7d3d3';
export const neutral400 = '#bab6b6';
export const neutral500 = '#9b9797';
export const neutral600 = '#7d7979';
export const neutral700 = '#605d5d';
export const neutral800 = '#444141';
export const neutral900 = '#2d2b2b';

// Accent ramp (warm orange/red) — constant across themes.
export const accent100 = '#fff2ef';
export const accent200 = '#ffe0d9';
export const accent300 = '#ffc4b8';
export const accent400 = '#ff9783';
export const accent500 = '#ff563c';
export const accent600 = '#dd2b0f';
export const accent700 = '#ae1800';
export const accent800 = '#7c1405';
export const accent900 = '#4d170e';

export const accentSoftBg = 'rgba(255,86,60,0.16)';

export type ColorPalette = {
  background: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textMuted: string;
  /** Icon stroke color on a neutral surface (e.g. inside a card's icon box). */
  iconDefault: string;
  divider: string;
  divider2: string;
  accentSoftBg: string;
  accent500: string;
  accent600: string;
};

export const darkColors: ColorPalette = {
  background: neutral900,
  surface: neutral800,
  surfaceHover: neutral700,
  textPrimary: neutral100,
  textMuted: neutral500,
  iconDefault: neutral200,
  divider: 'rgba(248,244,244,0.12)',
  divider2: 'rgba(248,244,244,0.08)',
  accentSoftBg,
  accent500,
  accent600,
};

export const lightColors: ColorPalette = {
  background: neutral100,
  surface: '#ffffff',
  surfaceHover: neutral200,
  textPrimary: neutral900,
  textMuted: neutral700,
  iconDefault: neutral700,
  divider: 'rgba(45,43,43,0.14)',
  divider2: 'rgba(45,43,43,0.08)',
  accentSoftBg,
  accent500,
  accent600,
};

// Convenience default for the handful of places that are always
// accent-colored regardless of theme (e.g. SubmitButton) and don't need to
// react to light/dark mode.
export const colors = darkColors;

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
