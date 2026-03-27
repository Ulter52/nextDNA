const palette = {
  // Primary
  blue_50: '#eff6ff', 
  blue_100: '#dbeafe',
  blue_200: '#bfdbfe',
  blue_500: '#3b82f6',
  blue_600: '#2563eb',
  
  // Neutrals
  neutral_100: '#f3f4f6',
  neutral_200: '#e5e7eb',
  neutral_300: '#d1d5db',
  neutral_400: '#9ca3af',
  neutral_500: '#6b7280',
  neutral_600: '#4b5563',
  neutral_700: '#374151',
  neutral_800: '#1f2937',
  neutral_900: '#111827',
  white: '#ffffff',
  black: '#000000',
  
  // Greens
  green_100: '#f0fdf4',
  green_500: '#22c55e',
  green_600: '#16a34a',
  green_700: '#059669',

  // Oranges
  orange_100: '#fff7ed',
  orange_500: '#f97316',
  orange_600: '#ea580c',

  // Reds
  red_100: '#fef2f2',
  red_500: '#ef4444',
  red_600: '#dc2626',

  // Purples
  purple_100: '#faf5ff',
  purple_500: '#a855f7',
  
  // Indigos
  indigo_100: '#eef2ff',
  indigo_500: '#6366f1',

  // Sky Blues
  sky_100: '#f0f9ff',
  sky_500: '#0ea5e9',

  // Rose
  rose_100: '#fff1f2',
  rose_500: '#f43f5e',

  // Teals
  teal_100: '#f0fdfa',
  teal_500: '#14b8a6',
};

export const colors = {
  // Base
  background: palette.neutral_100,
  background_alt: palette.white,
  text_primary: palette.neutral_900,
  text_secondary: palette.neutral_500,
  text_tertiary: palette.neutral_400,
  
  // Primary
  primary: palette.blue_600,
  primary_light: palette.blue_50,
  primary_text: palette.white,

  // Secondary
  secondary: palette.neutral_500,
  
  // Status
  success: palette.green_600,
  success_light: palette.green_100,
  error: palette.red_600,
  error_light: palette.red_100,
  warning: palette.orange_600,
  warning_light: palette.orange_100,

  // Borders & Dividers
  border: palette.neutral_200,
  border_light: palette.neutral_100,

  // Components
  card_bg: palette.white,
  input_bg: palette.neutral_100,
  disabled_bg: palette.neutral_100,
  
  // Palette for direct use
  ...palette,
};
