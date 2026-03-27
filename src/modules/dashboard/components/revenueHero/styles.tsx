import { StyleSheet } from 'react-native';
import { moderateScale, colors, spacing, borderRadius, typography, shadow } from '../../../../core/theme';

export const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.medium,
    shadowColor: colors.primary,
  },
  heroMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: { 
    color: colors.blue_100, 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.bold, 
    textTransform: 'uppercase', 
    marginBottom: spacing.xs 
  },
  heroAmount: { 
    color: colors.white, 
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black 
  },
  heroIconBg: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    padding: spacing.md, 
    borderRadius: borderRadius.lg 
  },
  heroDivider: { 
    height: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    marginVertical: spacing.lg 
  },
  heroFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md 
  },
  trendBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.sm, 
    paddingVertical: spacing.xs, 
    borderRadius: borderRadius.sm, 
    gap: spacing.xs 
  },
  trendPercent: { 
    color: colors.white, 
    fontSize: typography.sizes.xs, 
    fontWeight: typography.weights.black 
  },
  heroSubText: { 
    color: colors.blue_100, 
    fontSize: typography.sizes.sm, 
    fontWeight: typography.weights.semibold 
  },
});
