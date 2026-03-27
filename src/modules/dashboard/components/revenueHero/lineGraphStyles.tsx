import { StyleSheet, Dimensions } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography, shadow } from '../../../../core/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    minHeight: moderateScale(500),
    ...shadow.medium,
    shadowOffset: { width: 0, height: -10 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
    letterSpacing: -0.5,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    color: colors.text_secondary,
    fontWeight: typography.weights.semibold,
  },
  closeButton: {
    backgroundColor: colors.border_light,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  chartWrapper: {
    height: moderateScale(280),
    marginBottom: spacing.lg,
    paddingRight: spacing.sm,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  yAxis: {
    width: spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
  },
  axisLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text_tertiary,
    fontWeight: typography.weights.bold,
  },
  mainChartArea: {
    flex: 1,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.border,
    paddingBottom: spacing.xs,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.xxl,
    marginTop: spacing.sm,
  },
  xLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text_secondary,
    fontWeight: typography.weights.semibold,
    width: moderateScale(25),
    textAlign: 'center',
  },
  placeholderText: {
    color: colors.text_tertiary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginTop: moderateScale(100),
  },
  statsScroll: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border_light,
    paddingTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: moderateScale(12),
    borderRadius: borderRadius.lg,
    minWidth: moderateScale(80),
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text_secondary,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  prevStatValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text_tertiary,
    marginTop: moderateScale(2),
  },
});
