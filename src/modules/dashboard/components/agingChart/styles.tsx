import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography } from '../../../../core/theme';

export const styles = StyleSheet.create({
  agingContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card_bg,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: moderateScale(160),
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  agingBucket: { 
    alignItems: 'center', 
    gap: spacing.sm, 
    width: '18%' 
  },
  agingBarContainer: { 
    width: '80%', 
    height: moderateScale(80), 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.sm, 
    justifyContent: 'flex-end', 
    overflow: 'hidden' 
  },
  agingBar: { 
    width: '100%', 
    borderRadius: borderRadius.xs 
  },
  agingLabel: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.black, 
    color: colors.text_tertiary 
  },
  agingValue: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.bold, 
    color: colors.text_secondary 
  },
});
