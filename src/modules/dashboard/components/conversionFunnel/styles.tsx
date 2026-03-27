import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography } from '../../../../core/theme';

export const styles = StyleSheet.create({
  funnelCard: { 
    backgroundColor: colors.card_bg, 
    borderRadius: borderRadius.xxl, 
    padding: moderateScale(20), 
    borderWidth: 1, 
    borderColor: colors.border_light 
  },
  funnelStep: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  stepInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md 
  },
  stepCircle: { 
    width: moderateScale(24), 
    height: moderateScale(24), 
    borderRadius: borderRadius.md, 
    backgroundColor: colors.primary_light, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  stepNum: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.black, 
    color: colors.primary 
  },
  stepLabel: { 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.bold, 
    color: colors.text_primary 
  },
  stepStats: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm 
  },
  stepValue: { 
    fontSize: typography.sizes.md, 
    fontWeight: typography.weights.black, 
    color: colors.text_primary 
  },
  funnelConnector: { 
    height: moderateScale(20), 
    width: 1, 
    backgroundColor: colors.border_light, 
    marginLeft: moderateScale(12), 
    marginVertical: spacing.xs 
  },
});
