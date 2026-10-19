// Icon "illustration" + message for empty/error states (vector only, per Mandate 4).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { Button, Txt } from './ui';

export default function EmptyState({ icon = 'search', title, message, actionLabel, onAction, tone = 'primary', style }) {
  const fg = tone === 'danger' ? colors.dangerText : colors.primary;
  const bg = tone === 'danger' ? colors.dangerBg : colors.primaryLight;
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.outer, { borderColor: bg }]}>
        <View style={[styles.inner, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={44} color={fg} />
        </View>
      </View>
      {title ? <Txt variant="h3" color={colors.primaryDark} style={styles.title}>{title}</Txt> : null}
      {message ? <Txt variant="body" color={colors.textSecondary} style={styles.message}>{message}</Txt> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} variant="secondary" style={{ marginTop: space.lg }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl },
  outer: { width: 120, height: 120, borderRadius: 60, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: space.lg, textAlign: 'center' },
  message: { marginTop: space.sm, textAlign: 'center' },
});
