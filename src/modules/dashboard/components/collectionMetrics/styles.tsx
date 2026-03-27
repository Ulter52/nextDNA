import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography } from '../../../../core/theme';

export const styles = StyleSheet.create({
  collectionsCard: {
    backgroundColor: colors.card_bg,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  collectionSplit: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.md 
  },
  splitItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm 
  },
  dot: { 
    width: spacing.sm, 
    height: spacing.sm, 
    borderRadius: borderRadius.round 
  },
  splitLabel: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.bold, 
    color: colors.text_secondary 
  },
  splitValue: { 
    fontSize: typography.sizes.md, 
    fontWeight: typography.weights.black, 
    color: colors.text_primary 
  },
  progressBarBg: { 
    height: spacing.sm, 
    backgroundColor: colors.border_light, 
    borderRadius: borderRadius.xs, 
    flexDirection: 'row', 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%' 
  },
  arSummary: { 
    flexDirection: 'row', 
    marginTop: spacing.lg, 
    paddingTop: spacing.lg, 
    borderTopWidth: 1, 
    borderTopColor: colors.border_light, 
    alignItems: 'center' 
  },
  arItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  arLabel: { 
    fontSize: typography.sizes.xs, 
    color: colors.text_tertiary, 
    fontWeight: typography.weights.bold, 
    marginBottom: spacing.xs 
  },
  arValue: { 
    fontSize: typography.sizes.lg, 
    fontWeight: typography.weights.black 
  },
  verticalDivider: { 
    width: 1, 
    height: moderateScale(30), 
    backgroundColor: colors.border_light 
  },
});
