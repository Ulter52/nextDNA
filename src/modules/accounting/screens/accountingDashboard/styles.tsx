import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, shadow } from '../../../../core/theme';

export const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Continuous Bank Cards Styles
  bankCardsContainer: {
    flexDirection: 'row',
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    ...shadow.medium,
    marginBottom: spacing.xl,
  },
  bankCard: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardType: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  balance: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  cardMeta: {
    color: colors.white,
    fontSize: 9,
    opacity: 0.6,
  },
  // Action Grid Styles
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.medium,
    minWidth: '45%',
  },
  actionIconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  // Quick Actions Section Styles
  quickActionsSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  quickActionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.small,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  quickActionIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text_primary,
  },
  headerComponent: {
    gap: spacing.xl,
    marginBottom: spacing.md,
  }
});
