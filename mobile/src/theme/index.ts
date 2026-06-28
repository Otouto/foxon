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

  // Amber accent (chronicle / story card)
  amberBg: '#FFFBEB', // amber-50
  amberSoft: '#FEF3C7', // amber-100
  amberIcon: '#D97706', // amber-600
  amberSubtext: '#B45309', // amber-700
  amberText: '#92400E', // amber-900

  separator: '#E5E7EB', // gray-200
  fill: '#E5E7EB',
  fillMuted: '#F3F4F6', // gray-100

  // Dark ink that reads on top of the bright gradient CTAs
  onLime: '#1A2E05', // lime-950
  onCyan: '#063040', // cyan-950

  // Editorial serif accent (greeting / insight italic — the "soul" voice)
  serifAccent: '#8B7CD6', // soft lavender-purple
} as const;

/**
 * Gradient stop pairs for LinearGradient (top-left → bottom-right unless noted).
 * Mirror the "Foxon Soul" redesign: lime = energy/live, cyan = strength/primary,
 * journey = the cyan→purple arc used by score rings and milestone surfaces.
 */
export const gradients = {
  lime: ['#A3E635', '#84CC16'] as const, // lime-400 → lime-500
  limeSoft: ['#BEF264', '#84CC16'] as const, // lime-300 → lime-500 (progress bars)
  cyan: ['#22D3EE', '#06B6D4'] as const, // cyan-400 → cyan-500
  journey: ['#22D3EE', '#A855F7'] as const, // cyan-400 → purple-500
  /** Soft aurora wash (milestone cards / reveal background). */
  aurora: ['#F8F4FF', '#FDFAFF'] as const,
  auroraBorder: '#EFE6FB',
  /** Home screen background wash (lavender → soft → near-white). */
  homeWash: ['#EDEEFB', '#F2EDFB', '#F7F5FC'] as const,
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
    /** Newsreader italic — the editorial "soul" voice (loaded in _layout.tsx). */
    serif: 'Newsreader_500Medium_Italic',
    serifSemibold: 'Newsreader_600SemiBold',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
    serif: 'serif',
    serifSemibold: 'serif',
  },
})!;

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 22, fontWeight: '600' as const, color: colors.text },
  headline: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 17, fontWeight: '400' as const, color: colors.text },
  subhead: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary },
  footnote: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textTertiary },
} as const;
