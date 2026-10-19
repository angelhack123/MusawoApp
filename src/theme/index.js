// Design tokens from Wireframes & UI Spec (Doc 3, Part 1.2–1.3 and 2.x)
import { Platform } from 'react-native';

export const colors = {
  primary: '#0D9488',        // Primary Teal — buttons, active states
  primaryDark: '#0D4F4F',    // App bar, headings
  primaryDeep: '#083838',    // Decorative depth on dark headers
  primaryLight: '#E6F7F5',   // Selected/tinted surfaces
  primaryMuted: '#99D9D1',

  success: '#16A34A',
  successBg: '#DCFCE7',
  successText: '#166534',
  warning: '#EAB308',
  warningBg: '#FEF9C3',
  warningText: '#854D0E',    // Dark text on yellow keeps WCAG AA contrast
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerText: '#B91C1C',
  info: '#2563EB',
  infoBg: '#DBEAFE',
  neutral: '#6B7280',
  neutralBg: '#F3F4F6',
  neutralText: '#374151',
  amber: '#F59E0B',

  bg: '#F0FDFA',             // Screen background (subtle teal tint)
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  placeholder: '#9CA3AF',
  border: '#E5E7EB',
  inputBorder: '#CCCCCC',
  overlay: 'rgba(8, 56, 56, 0.55)',
  white: '#FFFFFF',
  whatsapp: '#25D366',
};

export const type = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },      // Headline Large
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },      // Headline Medium
  h3: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  bodyLg: { fontSize: 18, fontWeight: '400', lineHeight: 26 },  // Body Large
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },    // Body Medium
  label: { fontSize: 14, fontWeight: '500', lineHeight: 20 },   // Label
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 }, // Caption
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
export const touch = { min: 48, large: 56 };

export const shadow = {
  card: Platform.select({
    android: { elevation: 2 },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  }),
  raised: Platform.select({
    android: { elevation: 8 },
    default: { shadowColor: '#0D4F4F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
  }),
};
