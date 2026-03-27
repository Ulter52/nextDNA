import React, { memo } from 'react';
import { View, TextInput, Text } from 'react-native';
import { colors, spacing } from '@core/theme';
import { styles as detailStyles } from '../screens/itemDetail/styles';

export const FormInput = memo(({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default', editable = true, rightElement }: any) => (
  <View style={[detailStyles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={12} color={colors.text_tertiary} />}
        <Text style={[detailStyles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
      </View>
      {rightElement}
    </View>
    <TextInput
      style={{ fontSize: 14, color: editable ? colors.text_primary : colors.text_tertiary, fontWeight: '600', padding: 0, width: '100%' }}
      value={String(value ?? '')}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor={colors.text_tertiary}
      editable={editable}
      autoCorrect={false}
    />
  </View>
));
