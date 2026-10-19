// Verification badge (UI Spec 2.1): pill, colour + icon + label; tap explains the status (US-1.3).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { doctorStatus } from '../utils/status';
import { formatDate } from '../utils/format';
import { useT } from '../state/AppState';
import { Txt } from './ui';
import { InfoSheet } from './Sheet';

export default function StatusBadge({ status, size = 'md', onPress, style }) {
  const t = useT();
  const s = doctorStatus(status);
  const full = size === 'full';
  const small = size === 'sm';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${t(`status.${s.key}`)}${onPress ? `. ${t('status.tapToLearn')}` : ''}`}
      hitSlop={small ? 8 : 0}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: s.bg, borderColor: s.accent },
        small && styles.small,
        full && styles.full,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Ionicons name={s.icon} size={full ? 22 : 16} color={s.fg} />
      <Txt variant="label" color={s.fg} style={[styles.label, full && styles.fullLabel]} numberOfLines={1}>
        {t(`status.${s.key}`)}
      </Txt>
      {full && onPress ? <Ionicons name="information-circle-outline" size={20} color={s.fg} style={{ marginLeft: 'auto' }} /> : null}
    </Pressable>
  );
}

// "What does this status mean?" modal with the relevant dates (SCR-005, US-1.3)
export function StatusExplainSheet({ visible, onClose, doctor, status }) {
  const t = useT();
  const s = doctorStatus(status || doctor?.status);
  const facts = [];
  if (doctor?.status === 'SUSPENDED') {
    if (doctor.suspension_date) facts.push([t('doctor.suspendedOn'), formatDate(doctor.suspension_date)]);
    if (doctor.suspension_reason) facts.push([t('doctor.reason'), doctor.suspension_reason]);
  }
  if (doctor?.license_expiry_date) facts.push([t('doctor.licenseExpiry'), formatDate(doctor.license_expiry_date)]);
  if (doctor?.last_verified_at) facts.push([t('doctor.lastVerified'), formatDate(doctor.last_verified_at)]);

  return (
    <InfoSheet visible={visible} onClose={onClose} icon={s.icon} iconColor={s.fg} iconBg={s.bg} title={t(`status.${s.key}`)}>
      <Txt variant="body" color={colors.text}>{t(`status.${s.key}Explain`)}</Txt>
      <View style={[styles.advice, { backgroundColor: s.bg }]}>
        <Txt variant="label" color={s.fg} style={{ fontWeight: '600' }}>{t(`status.${s.key}Advice`)}</Txt>
      </View>
      {facts.map(([label, value]) => (
        <View key={label} style={styles.fact}>
          <Txt variant="caption" color={colors.textSecondary}>{label}</Txt>
          <Txt variant="body" style={{ fontWeight: '600' }}>{value}</Txt>
        </View>
      ))}
    </InfoSheet>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  small: { height: 28, paddingHorizontal: space.sm },
  full: { alignSelf: 'stretch', height: 48, paddingHorizontal: space.lg, borderRadius: radius.md },
  label: { marginLeft: 6, fontWeight: '700' },
  fullLabel: { fontSize: 16 },
  advice: { padding: space.md, borderRadius: radius.sm, marginTop: space.md },
  fact: { marginTop: space.md },
});
