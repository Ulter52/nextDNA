import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text_tertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb', // Vivid Primary Blue
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: '#1d4ed8',
  },
  headerCell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  // Vivid Row Backgrounds (Slightly more saturated for visibility)
  blueRow: {
    backgroundColor: '#dbeafe', // Blue 100
  },
  greenRow: {
    backgroundColor: '#dcfce7', // Green 100
  },
  redRow: {
    backgroundColor: '#fee2e2', // Red 100
  },
  totalRow: {
    backgroundColor: '#bbf7d0', // Stronger Success Green for totals
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    zIndex: 1,
  },
  cell: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: colors.text_primary,
    fontWeight: '700', // Bolder for better visibility
  },
  totalText: {
    fontWeight: '900',
    color: '#064e3b', // Deep Green
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text_tertiary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fabActions: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.medium,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  miniFabLabel: {
    marginRight: spacing.sm,
    backgroundColor: colors.neutral_800,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  miniFabLabelText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.large,
    elevation: 8,
  },
  syncBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: colors.white,
  }
});
