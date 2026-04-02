import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle2, Save } from 'lucide-react-native';
import { colors, spacing } from '@core/theme';
import { formStyles } from './styles';

export const SaveSection = memo(({ 
  isEdit, 
  isPending, 
  handleSubmit, 
  title = "Save Draft?", 
  subtitle = "This saves the document as a Draft. Submit later to finalize.",
  label
}: any) => (
  <View style={formStyles.saveContainer}>
    <CheckCircle2 size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
    <Text style={formStyles.saveTitle}>{title}</Text>
    <Text style={formStyles.saveText}>{subtitle}</Text>
    <TouchableOpacity style={formStyles.saveBtn} onPress={handleSubmit} disabled={isPending}>
      {isPending ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          <Save size={20} color={colors.white} />
          <Text style={formStyles.saveBtnText}>
            {label ? label : (isEdit ? 'Update Draft' : 'Save as Draft')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  </View>
));
