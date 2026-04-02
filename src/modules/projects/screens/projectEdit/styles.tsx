import { StyleSheet, Dimensions } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography, shadow } from '../../../../core/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Horizontal List Styles
  horizontalList: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    marginHorizontal: spacing.xs,
    padding: spacing.lg,
    ...shadow.medium,
    // Flex to take available space
    flex: 1,
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text_secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
    textAlign: 'right',
    flex: 1.5,
  },

  // Specific card variants
  blueCard: {
    borderTopWidth: 4,
    borderTopColor: colors.blue_500,
  },
  cyanCard: {
    borderTopWidth: 4,
    borderTopColor: colors.teal_500,
  },
  greenCard: {
    borderTopWidth: 4,
    borderTopColor: colors.green_500,
  },
  orangeCard: {
    borderTopWidth: 4,
    borderTopColor: colors.orange_500,
  },
  purpleCard: {
    borderTopWidth: 4,
    borderTopColor: colors.purple_500,
  },

  // Descriptions & Long Text
  descriptionContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  descriptionText: {
    fontSize: typography.sizes.xs,
    color: colors.text_secondary,
    lineHeight: 18,
  },

  // Toggles / Booleans
  booleanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  booleanLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text_primary,
  },

  // Tax Table Styles
  taxItem: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.blue_50,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.blue_100,
  },
  taxTemplate: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  taxDate: {
    fontSize: typography.sizes.xs,
    color: colors.text_tertiary,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    marginTop: spacing.xl,
    paddingVertical: 16,
    borderRadius: borderRadius.xl,
    ...shadow.medium
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
