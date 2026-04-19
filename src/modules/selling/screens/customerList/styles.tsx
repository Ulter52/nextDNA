import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadow, moderateScale } from '../../../../core/theme';

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  customerCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.small,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: colors.blue_50,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  customerDetails: {
    fontSize: 10,
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 'bold',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 12,
    color: colors.text_tertiary,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.text_tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loaderFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});

export default styles;
