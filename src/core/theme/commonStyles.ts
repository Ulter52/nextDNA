import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing, borderRadius, shadow } from './values';
import { typography } from './typography';

export const commonStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  // Cards
  card: {
    backgroundColor: colors.card_bg,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadow.light,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  
  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input_bg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    color: colors.text_primary,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  
  // Buttons
  button: {
    height: 56,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadow.medium,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    color: colors.primary_text,
  },
  
  // Status
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    textTransform: 'uppercase',
  },
  
  // Typography helpers
  h1: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.black,
    color: colors.text_primary,
  },
  h2: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.text_primary,
  },
  body: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text_secondary,
  },
  caption: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.text_tertiary,
  },
});
