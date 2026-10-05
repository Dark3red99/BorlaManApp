// BorlaMan design system — emerald accent on soft neutral surfaces, Plus Jakarta Sans type scale.

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

// Screen palette for the redesigned screens. Was a dark violet/neon-lime
// theme (2026-08-11); reverted to the emerald/white brand colors on
// 2026-10-01 while keeping the new layouts. `neon` is the accent fill and
// `ink` is the text/icon color that sits on top of it.
export const ScreenColors = {
  bgTop: '#F3F8F5',
  bgBottom: '#F3F8F5',
  card: '#FFFFFF',
  cardAlt: '#F4FAF7',
  neon: '#059669',
  neonDim: '#D1FAE5',
  ink: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  border: '#DCE8E1',
  amber: '#F59E0B',
  danger: '#DC2626',
  blue: '#3B82F6',
};

export const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
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

// ─────────────────────────────────────────────────────────────────────────────
// Soft-minimal UI kit (2026-10-01). Neutral grey canvas, white cards with
// feather-light shadows, recessed "well" tiles, one emerald accent used
// sparingly, and a single thin-line icon family (lucide, ICON_STROKE).
// New and redesigned screens build on these via components/ui.
// Components read the active palette from useTheme() (context/ThemeContext),
// never from LightUI/DarkUI directly, so the dark-mode toggle reaches them.
// ─────────────────────────────────────────────────────────────────────────────
export type Palette = {
  dark: boolean;
  bg: string;
  surface: string;
  well: string;
  wellStrong: string;
  hairline: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentDeep: string;
  accentSoft: string;
  onAccent: string;
  amber: string;
  amberSoft: string;
  blue: string;
  blueSoft: string;
  danger: string;
  dangerSoft: string;
};

export const LightUI: Palette = {
  dark: false,
  bg: '#F2F3F2',
  surface: '#FFFFFF',
  well: '#F3F4F3',
  wellStrong: '#E9EBE9',
  hairline: '#ECEEEC',

  text: '#141816',
  textMuted: '#6B716E',
  textFaint: '#A3A8A5',

  accent: '#059669',
  accentDeep: '#047857',
  accentSoft: '#E3F4EC',
  onAccent: '#FFFFFF',

  amber: '#F59E0B',
  amberSoft: '#FEF3E2',
  blue: '#3B82F6',
  blueSoft: '#E8F0FE',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
};

// Dark: near-black green-tinted canvas; cards are lifted by being lighter than
// the canvas (shadows barely read on dark). "Soft" tints become deep, low-
// saturation fills and "deep" accents flip to light mint for legibility.
export const DarkUI: Palette = {
  dark: true,
  bg: '#0D100F',
  surface: '#171B19',
  well: '#202522',
  wellStrong: '#2A302D',
  hairline: '#232926',

  text: '#F1F4F2',
  textMuted: '#9BA29E',
  textFaint: '#646C68',

  accent: '#10B981',
  accentDeep: '#6EE7B7',
  accentSoft: '#11291F',
  onAccent: '#FFFFFF',

  amber: '#FBBF24',
  amberSoft: '#2E2410',
  blue: '#60A5FA',
  blueSoft: '#142236',
  danger: '#F87171',
  dangerSoft: '#341719',
};

export const Radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };

export const ICON_STROKE = 1.75;

export const Elevation = {
  card: {
    shadowColor: '#1B2420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  float: {
    shadowColor: '#1B2420',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  accent: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
};
