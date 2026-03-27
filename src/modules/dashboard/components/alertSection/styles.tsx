import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography } from '../../../../core/theme';

export const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(14),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  alert_critical: {
    backgroundColor: colors.red_100,
    borderColor: colors.error_light,
  },
  alert_warning: {
    backgroundColor: colors.orange_100,
    borderColor: colors.warning_light,
  },
  alert_info: {
    backgroundColor: colors.blue_50,
    borderColor: colors.primary_light,
  },
  alertMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  alertIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bg_critical: {
    backgroundColor: colors.error,
  },
  bg_warning: {
    backgroundColor: colors.warning,
  },
  bg_info: {
    backgroundColor: colors.primary,
  },
  alertText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text_primary,
    flex: 1,
  },
});
