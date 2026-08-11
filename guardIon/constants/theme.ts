/**
 * Guardian design tokens + light/dark app colors.
 */

import { Platform } from 'react-native';

/** Brand & semantic palette */
export const GuardianColors = {
  primary: '#072B59',
  primaryDark: '#0B2D5B',
  /** Main app shell (tabs, main stacks) — neutral */
  background: '#F9FAFB',
  surface: '#FFFFFF',
  /** Soft brand wash: onboarding & auth only */
  atmosphereBlue: '#EAF4FF',
  splashBackdrop: '#E6F4FE',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  safe: '#16A34A',
  safeMuted: '#DCFCE7',
  warning: '#CA8A04',
  warningMuted: '#FEF9C3',
  danger: '#DC2626',
  dangerMuted: '#FEE2E2',
  offline: '#6B7280',
  offlineMuted: '#F3F4F6',
  tabInactive: '#687076',
  overlaySheet: '#F8FAFC',
  navyMuted: '#D3E3F4',
} as const;

const tintColorLight = GuardianColors.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: GuardianColors.text,
    background: GuardianColors.background,
    tint: tintColorLight,
    icon: GuardianColors.tabInactive,
    tabIconDefault: GuardianColors.tabInactive,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/** Typography scale (use with default/system font) */
export const Typography = {
  hero: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const },
  section: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodySemi: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0.6 },
};

export const Layout = {
  screenPadding: 20,
  cardRadius: 16,
  buttonRadius: 24,
  minTapSize: 44,
};

/** Fallback map center when live GPS is unavailable (Kumasi test area). */
export const DEFAULT_MAP_LOCATION = {
  latitude: 6.672644,
  longitude: -1.56637,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
