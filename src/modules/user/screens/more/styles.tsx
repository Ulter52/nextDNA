import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, shadow, moderateScale } from '../../../../core/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (spacing.lg * 2) - spacing.md) / 2;

export const styles = StyleSheet.create({
  /* ================= SAFE AREA ================= */
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  /* ================= HEADER ================= */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text_primary,
    letterSpacing: -0.5,
  },

  /* ================= CONTENT ================= */
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* ================= SECTION ================= */
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    marginLeft: 4,
  },

  /* ================= PROFILE CARD ================= */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.medium,
  },
  avatar: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.light,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text_primary,
    marginLeft: spacing.md,
  },
  userSub: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.md,
    marginTop: 2,
  },

  /* ================= WORKSPACE GRID ================= */
  workspaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  workspaceCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.medium,
    gap: spacing.sm,
  },

  iconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },

  workspaceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text_primary,
    textAlign: 'center',
  },

  /* ================= QUICK ACTIONS ================= */
  actionContainer: {
    gap: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.small,
  },
  actionIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text_primary,
  },

  /* ================= FOOTER ================= */
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border_light,
    backgroundColor: colors.white,
    ...shadow.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
