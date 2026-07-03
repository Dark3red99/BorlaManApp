// BorlaMan design system — emerald green, warm amber accent, Poppins type scale.

export const Colors = {
  // Brand green (buttons, links, icons, selected states) — NOT used for body text.
  primary: '#059669', // Emerald 600
  primaryDark: '#047857', // Emerald 700 — gradients, pressed states, shadows
  primaryLight: '#10B981', // Emerald 500 — secondary accents
  primarySoft: '#D1FAE5', // Emerald 100 — selected chips/badges backgrounds
  primarySofter: '#ECFDF5', // Emerald 50 — tinted section backgrounds

  // Warm accent for rewards / highlights / points
  accent: '#F59E0B', // Amber 500
  accentSoft: '#FEF3C7', // Amber 100

  // Neutrals — used for all text so the UI doesn't read as monochrome green
  background: '#FFFFFF',
  backgroundTinted: '#F6FAF8',
  surface: '#FFFFFF',
  text: '#0F172A', // Slate 900 — headings & primary text
  textMuted: '#64748B', // Slate 500 — secondary text
  textFaint: '#94A3B8', // Slate 400 — placeholders, timestamps
  border: '#DCE8E1', // soft green-tinted border for inputs/cards
  borderFocus: '#059669',
  inputBg: '#F4FAF7',

  // Semantic
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
  info: '#3B82F6',

  white: '#FFFFFF',
  black: '#0B0F0D',

  // Glassmorphism specific (used by GlassCard)
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  shadow: 'rgba(5, 150, 105, 0.18)',
};

export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

export const Sizes = {
  radius: 24,
  radiusSm: 12,
  radiusMd: 16,
  radiusPill: 999,
  padding: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Shadows = {
  button: {
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
};
