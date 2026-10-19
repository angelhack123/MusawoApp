// Pulsing placeholders instead of blank screens (UI Spec Mandate 4).
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius, space, shadow } from '../theme';

export function Skeleton({ width = '100%', height = 14, r = 6, style }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: '#DDEFEC', opacity }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card} accessibilityLabel="Loading">
      <Skeleton width={56} height={56} r={28} />
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="45%" style={{ marginTop: 8 }} />
        <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={72} height={28} r={14} />
    </View>
  );
}

export function SkeletonList({ count = 3 }) {
  return <View>{Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
    ...shadow.card,
  },
});
