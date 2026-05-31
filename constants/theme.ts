// VaultOS Design System Tokens

export const Colors = {
  // Base surfaces
  background: '#09090b',
  surface: '#18181b',
  card: '#1c1c1f',
  cardElevated: '#27272a',
  border: '#2e2e33',
  borderSubtle: '#1f1f23',

  // Primary (Indigo)
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryMuted: '#6366f120',
  primarySurface: '#6366f115',

  // Semantic
  success: '#22c55e',
  successMuted: '#22c55e20',
  successSurface: '#22c55e15',
  danger: '#ef4444',
  dangerMuted: '#ef444420',
  dangerSurface: '#ef444415',
  warning: '#f59e0b',
  warningMuted: '#f59e0b20',
  warningSurface: '#f59e0b15',
  info: '#3b82f6',
  infoMuted: '#3b82f620',

  // Text
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textDisabled: '#52525b',

  // Income / Expense
  income: '#22c55e',
  expense: '#ef4444',
  transfer: '#3b82f6',

  // Accents
  gold: '#f59e0b',
  purple: '#a855f7',
  cyan: '#06b6d4',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',

  // Chart colors
  chart: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#ec4899'],

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

export const Typography = {
  // Sizes
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 36,
  display: 48,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.6,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  primary: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const BankColors: Record<string, string> = {
  bca: '#0066AE',
  bni: '#F77F00',
  bri: '#003D82',
  mandiri: '#003D82',
  cimb: '#7B0000',
  permata: '#C41E3A',
  jago: '#00B86E',
  seabank: '#2C5BE5',
  blu: '#004B93',
  ocbc: '#C7002B',
  neo: '#0BC4B6',
  gopay: '#00AED6',
  ovo: '#4C3494',
  dana: '#118EEA',
  shopeepay: '#EE4D2D',
  linkaja: '#ED1C24',
  paypal: '#003087',
  cash: '#22c55e',
};
