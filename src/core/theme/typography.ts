import { scaleFont } from './scaling';

export const typography = {
  // Font Families (using system fonts as default, but structured for easy change to custom fonts)
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    black: 'System',
  },

  // Font Sizes
  sizes: {
    xs: scaleFont(10),
    sm: scaleFont(12),
    md: scaleFont(14),
    lg: scaleFont(16),
    xl: scaleFont(18),
    xxl: scaleFont(24),
    xxxl: scaleFont(32),
  },

  // Line Heights
  lineHeights: {
    xs: scaleFont(14),
    sm: scaleFont(16),
    md: scaleFont(20),
    lg: scaleFont(24),
    xl: scaleFont(28),
    xxl: scaleFont(32),
    xxxl: scaleFont(40),
  },

  // Font Weights
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
};
