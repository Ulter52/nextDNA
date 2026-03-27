import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography, shadow } from '../../../../core/theme';

export const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadow.small,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  accountName: { flex: 1, marginRight: spacing.md },
  balance: { fontSize: 13, fontWeight: 'bold' },
});