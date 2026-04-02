import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { styles } from './styles';
import { getInitials } from '@core/utils/formatters';

interface Props {
  user: string | null;
  onPress: () => void;
}

export const ProfileCard = React.memo(({ user, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.profileCard} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitials(user)}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{user || 'User'}</Text>
        <Text style={styles.userSub}>View profile & settings</Text>
      </View>

      <ChevronRight size={16} />
    </TouchableOpacity>
  );
});