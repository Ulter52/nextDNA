import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral_100,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral_100,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text_primary,
    fontWeight: '500',
    padding: 0,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  activeIconButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text_secondary,
  },
  activeCategoryText: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  cardGrid: {
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...shadow.medium,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  reportName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text_primary,
  },
  reportDesc: {
    fontSize: 12,
    color: colors.text_tertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 16,
  },
  emptyText: {
    color: colors.text_tertiary,
    fontSize: 14,
    fontWeight: '500',
  }
});
