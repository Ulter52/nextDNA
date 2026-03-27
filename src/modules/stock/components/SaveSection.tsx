import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle2, Save } from 'lucide-react-native';
import { colors, spacing } from '@core/theme';
import { formStyles } from './styles';

export const SaveSection = memo(({ isEdit, isPending, handleSubmit }: any) => (
  <View style={formStyles.saveContainer}>
    <CheckCircle2 size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
    <Text style={formStyles.saveTitle}>Save Draft?</Text>
    <Text style={formStyles.saveText}>This saves the receipt as a Draft. Submit later to finalize stock.</Text>
    <TouchableOpacity style={formStyles.saveBtn} onPress={handleSubmit} disabled={isPending}>
      {isPending ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          <Save size={20} color={colors.white} />
          <Text style={formStyles.saveBtnText}>{isEdit ? 'Update Draft' : 'Save as Draft'}</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
));
