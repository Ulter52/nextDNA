import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '@core/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    height: SCREEN_HEIGHT * 0.8,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  itemInfo: {
    padding: spacing.lg,
    backgroundColor: colors.blue_50,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  itemCode: {
    fontSize: 12,
    color: colors.text_secondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text_tertiary,
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  listContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  serialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  serialText: {
    fontSize: 14,
    color: colors.text_primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.text_secondary,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border_light,
    flexDirection: 'row',
    gap: spacing.md,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.orange_500,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    ...shadow.small,
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    ...shadow.small,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text_primary,
  },
  addButton: {
    backgroundColor: colors.blue_50,
    padding: 10,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  }
});
