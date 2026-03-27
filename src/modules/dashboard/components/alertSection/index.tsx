import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { styles } from './styles';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
}

interface AlertSectionProps {
  alerts?: Alert[];
  autoHideDuration?: number; // duration in milliseconds
}

export const AlertSection: React.FC<AlertSectionProps> = ({ alerts, autoHideDuration = 8000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [alerts, autoHideDuration]);

  if (!visible || !alerts || alerts.length === 0) return null;

  return (
    <View style={styles.section}>
      {alerts.map((alert) => (
        <TouchableOpacity 
          key={alert.id} 
          style={[
            styles.alertCard, 
            alert.type === 'critical' ? styles.alert_critical : 
            alert.type === 'warning' ? styles.alert_warning : 
            styles.alert_info
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.alertMain}>
            <View style={[
              styles.alertIconCircle, 
              alert.type === 'critical' ? styles.bg_critical : 
              alert.type === 'warning' ? styles.bg_warning : 
              styles.bg_info
            ]}>
              {alert.type === 'critical' ? <AlertCircle size={16} color="#ffffff" /> : 
               alert.type === 'warning' ? <Info size={16} color="#ffffff" /> : 
               <CheckCircle2 size={16} color="#ffffff" />}
            </View>
            <Text style={styles.alertText}>{alert.message}</Text>
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>
      ))}
    </View>
  );
};
