import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '@core/theme';

export const formStyles = StyleSheet.create({
  itemRow: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border_light
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  itemsCountLabel: {
    color: colors.orange_600,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  headerAction: {
    backgroundColor: colors.orange_50,
    padding: 8,
    borderRadius: 8
  },
  serialFieldTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light
  },
  serialFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text_tertiary,
    letterSpacing: 0.5
  },
  serialCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  totalsDisplay: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.small
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 12,
    color: colors.text_secondary,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text_primary
  },
  totalValueSmall: {
    fontSize: 12,
    fontWeight: 'normal',
    color: colors.text_primary
  },
  grandTotalRow: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border_light,
    paddingTop: spacing.sm
  },
  saveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl
  },
  saveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text_primary,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  saveText: {
    fontSize: 12,
    color: colors.text_secondary,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    ...shadow.medium
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
