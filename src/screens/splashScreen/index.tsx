import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import styles from './styles.tsx';
import { colors } from '@theme';


export function SplashScreen({ onReady }: { onReady: (user: string | null) => void }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animation for Logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check Auth and Initialize
    const initializeApp = async () => {
      try {
        const [user] = await Promise.all([
          AsyncStorage.getItem('erp_user'),
          new Promise(resolve => setTimeout(resolve, 2000)) // Min splash time for UX
        ]);
        onReady(user);
      } catch (e) {
        console.error('Initialization error:', e);
        onReady(null);
      }
    };

    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
              barStyle="light-content"
              backgroundColor={colors.primary}
              translucent={false}
            />
      <Animated.View style={[
        styles.logoContainer, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.iconBox}>
          <ShoppingBag size={48} color={colors.white} strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>DNA Connect</Text>
        <Text style={styles.subtitle}>Business, Anywhere, Anytime</Text>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}


