import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { styles } from './styles';

interface Props {
  item: any;
  onPress: () => void;
}

export const ActionItem = React.memo(({ item, onPress }: Props) => {
  const Icon = item.icon;

  return (
    <TouchableOpacity onPress={onPress} style={styles.actionItem} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: item.bgColor }]}>
        <Icon size={20} color={item.color} />
      </View>

      <Text style={styles.actionText}>{item.label}</Text>

      <ChevronRight size={14} />
    </TouchableOpacity>
  );
});