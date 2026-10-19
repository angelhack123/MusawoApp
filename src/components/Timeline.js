// Vertical status timeline (SCR-012): done = teal + bold, current = larger pulsing dot, future = gray.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { Txt } from './ui';

function PulseDot({ color }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[styles.pulse, { backgroundColor: color, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] }]}
      />
      <View style={[styles.dotCurrent, { backgroundColor: color }]}><View style={styles.dotCore} /></View>
    </View>
  );
}

// steps: [{ key, label, description, date, state: 'done'|'current'|'future', color?, icon? }]
export default function Timeline({ steps }) {
  return (
    <View>
      {steps.map((step, i) => {
        const color = step.color || colors.primary;
        const isLast = i === steps.length - 1;
        return (
          <View key={step.key} style={styles.row} accessibilityLabel={`${step.label}. ${step.date || ''}`}>
            <View style={styles.rail}>
              {step.state === 'current' ? (
                <PulseDot color={color} />
              ) : (
                <View style={styles.dotWrap}>
                  <View style={[styles.dot, step.state === 'done' ? { backgroundColor: color } : styles.dotFuture]}>
                    {step.state === 'done' ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
                  </View>
                </View>
              )}
              {!isLast && <View style={[styles.line, step.state === 'done' && { backgroundColor: color }]} />}
            </View>
            <View style={[styles.content, isLast && { paddingBottom: 0 }]}>
              <Txt
                variant="body"
                color={step.state === 'future' ? colors.placeholder : colors.text}
                style={step.state !== 'future' && { fontWeight: '700' }}
              >
                {step.label}
              </Txt>
              {step.date ? <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>{step.date}</Txt> : null}
              {step.description ? (
                <Txt variant="label" color={step.state === 'future' ? colors.placeholder : colors.textSecondary} style={{ marginTop: 4, fontWeight: '400' }}>
                  {step.description}
                </Txt>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 36, alignItems: 'center' },
  dotWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotFuture: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  dotCurrent: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white },
  pulse: { position: 'absolute', width: 26, height: 26, borderRadius: 13 },
  line: { flex: 1, width: 3, borderRadius: 2, backgroundColor: colors.border, marginVertical: 2 },
  content: { flex: 1, paddingLeft: space.sm, paddingBottom: space.xl, paddingTop: 3 },
});
