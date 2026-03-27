import { StyleSheet } from 'react-native';
import { colors, commonStyles, spacing, typography } from '@theme';

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24, gap: 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  successText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    elevation: 2
  },
  form: {
    gap: 16
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
     paddingHorizontal: 16
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  addItemBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12
  },
  itemsList: {
    gap: 20
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    position: 'relative'
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    elevation: 2
  },
  subInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827'
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8'
  },
  amountInput: {
    backgroundColor: '#eff6ff',
    color: '#2563eb'
  },
  taxInfo: {
    paddingHorizontal: 12,
    paddingBottom: 4
  },
  taxInfoText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
});

export default styles;