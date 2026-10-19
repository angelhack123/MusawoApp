// SCR-001: brand moment while settings load (max ~2s).
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { Decor } from '../components/AppBar';
import { Txt } from '../components/ui';

export default function SplashScreen() {
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(appear, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 8 }).start();
  }, [appear]);

  return (
    <View style={styles.container}>
      <Decor variant="hero" />
      <Animated.View style={{ alignItems: 'center', opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
        <View style={styles.logo}>
          <Ionicons name="shield-checkmark" size={72} color={colors.primary} />
        </View>
        <Txt variant="h1" color={colors.white} style={styles.wordmark}>MUSAWO</Txt>
        <Txt variant="body" color="rgba(255,255,255,0.8)">Trust But Verify</Txt>
      </Animated.View>
      <ActivityIndicator color={colors.white} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 128, height: 128, borderRadius: 40, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  wordmark: { letterSpacing: 6, marginBottom: space.xs },
  spinner: { position: 'absolute', bottom: 64 },
});
