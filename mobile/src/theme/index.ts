import { Platform } from 'react-native';

/**
 * Foxon design tokens for iOS.
 * Accent values mirror the Tailwind palette used by the web app
 * (fox states: gray / lime / cyan / purple); surfaces follow iOS system conventions.
 */
export const colors = {
  // Surfaces
  background: '#F2F2F7', // iOS systemGroupedBackground
  card: '#FFFFFF',
  cardMuted: '#F9FAFB', // gray-50

  // Text
  text: '#111827', // gray-900
  textSecondary: '#6B7280', // gray-500
  textTertiary: '#9CA3AF', // gray-400
  textInverse: '#FFFFFF',

  // Brand / fox states (soft = gradient top stop, deep = gradient bottom / ring)
  foxSlim: '#9CA3AF', // gray-400
  foxSlimSoft: '#D1D5DB', // gray-300
  foxFit: '#A3E635', // lime-400
  foxFitSoft: '#BEF264', // lime-300
  foxFitDeep: '#84CC16', // lime-500
  foxStrong: '#22D3EE', // cyan-400
  foxStrongSoft: '#67E8F9', // cyan-300
  foxStrongDeep: '#06B6D4', // cyan-500
  foxFiery: '#C084FC', // purple-400
  foxFieryDeep: '#A855F7', // purple-500

  // Semantic
  tint: '#111827', // primary actions follow the web's near-black primary
  success: '#10B981', // emerald-500
  warning: '#F59E0B', // amber-500
  destructive: '#EF4444', // red-500
  destructiveSoft: '#FEF2F2', // red-50

  separator: '#E5E7EB', // gray-200
  fill: '#E5E7EB',
  fillMuted: '#F3F4F6', // gray-100
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

export const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 22, fontWeight: '600' as const, color: colors.text },
  headline: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 17, fontWeight: '400' as const, color: colors.text },
  subhead: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary },
  footnote: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textTertiary },
} as const;
