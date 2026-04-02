import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';

interface Props {
  item: any;
  onPress: () => void;
}

export const WorkspaceCard = React.memo(({ item, onPress }: Props) => {
  const Icon = item.icon;

  return (
    <TouchableOpacity onPress={onPress} style={styles.workspaceCard} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
        <Icon size={20} color={item.color} />
      </View>

      <Text numberOfLines={1} style={styles.workspaceText}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
});