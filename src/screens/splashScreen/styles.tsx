import { StyleSheet } from 'react-native';
import { colors, commonStyles, spacing, typography } from '@theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.black,
    color: colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default styles;