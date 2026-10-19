// Star input/display and Agency Score bars (SCR-008e, US-4.3).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { Txt } from './ui';

export function Stars({ value = 0, onChange, size = 48, labels }) {
  return (
    <View>
      <View style={styles.row} accessibilityRole={onChange ? 'adjustable' : 'text'} accessibilityValue={{ min: 0, max: 5, now: value }}>
        {[1, 2, 3, 4, 5].map(n => {
          const filled = value >= n;
          const Star = (
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={onChange ? size * 0.8 : size}
              color={filled ? colors.amber : onChange ? colors.placeholder : '#E5E7EB'}
            />
          );
          return onChange ? (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
              style={({ pressed }) => [styles.starBtn, { width: size, height: size }, pressed && { transform: [{ scale: 1.15 }] }]}
            >
              {Star}
            </Pressable>
          ) : <View key={n}>{Star}</View>;
        })}
      </View>
      {labels ? (
        <View style={styles.labels}>
          <Txt variant="caption" color={colors.textSecondary}>{labels[0]}</Txt>
          <Txt variant="caption" color={colors.textSecondary}>{labels[1]}</Txt>
        </View>
      ) : null}
    </View>
  );
}

export function ScoreBar({ icon, label, value }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const color = pct >= 70 ? colors.success : pct >= 40 ? colors.amber : colors.danger;
  return (
    <View style={styles.bar}>
      <View style={styles.barHeader}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
        <Txt variant="label" style={{ flex: 1, marginLeft: 8 }}>{label}</Txt>
        <Txt variant="label" color={colors.primaryDark} style={{ fontWeight: '700' }}>{value == null ? '—' : `${Math.round(pct)}%`}</Txt>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  starBtn: { alignItems: 'center', justifyContent: 'center' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs, paddingHorizontal: space.sm },
  bar: { marginBottom: space.md },
  barHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.neutralBg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
