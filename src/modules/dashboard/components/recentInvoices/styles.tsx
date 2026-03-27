import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography } from '../../../../core/theme';

export const styles = StyleSheet.create({
  invoiceList: { 
    gap: spacing.md 
  },
  invoiceItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: colors.card_bg, 
    borderRadius: borderRadius.lg, 
    padding: spacing.md, 
    borderWidth: 1, 
    borderColor: colors.border_light 
  },
  invLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md, 
    flex: 1 
  },
  invIcon: { 
    width: moderateScale(44), 
    height: moderateScale(44), 
    borderRadius: borderRadius.md, 
    backgroundColor: colors.background, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  invCustomer: { 
    fontSize: typography.sizes.md, 
    fontWeight: typography.weights.bold, 
    color: colors.text_primary 
  },
  invMeta: { 
    fontSize: typography.sizes.xs, 
    color: colors.text_tertiary, 
    fontWeight: typography.weights.medium 
  },
  invRight: { 
    alignItems: 'flex-end' 
  },
  invAmount: { 
    fontSize: typography.sizes.md, 
    fontWeight: typography.weights.bold, 
    color: colors.text_primary 
  },
  invStatus: { 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.bold, 
    textTransform: 'uppercase' 
  },
});
