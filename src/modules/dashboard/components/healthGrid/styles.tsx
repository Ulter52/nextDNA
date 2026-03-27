import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography } from '../../../../core/theme';

export const styles = StyleSheet.create({
  grid: { 
    flexDirection: 'row', 
    gap: spacing.md 
  },
  gridCard: { 
    flex: 1, 
    backgroundColor: colors.card_bg, 
    borderRadius: borderRadius.xl, 
    padding: moderateScale(20), 
    borderWidth: 1, 
    borderColor: colors.border_light 
  },
  iconBox: { 
    width: moderateScale(40), 
    height: moderateScale(40), 
    borderRadius: borderRadius.md, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: spacing.md 
  },
  gridLabel: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.bold, 
    color: colors.text_tertiary, 
    marginBottom: spacing.xs 
  },
  gridValue: { 
    fontSize: typography.sizes.xl, 
    fontWeight: typography.weights.bold, 
    color: colors.text_primary 
  },
  gridFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.xs, 
    marginTop: spacing.xs 
  },
  gridSubText: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.bold, 
    color: colors.text_secondary 
  },
});
