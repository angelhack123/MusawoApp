// Shared booking UI: status pill, booking summary card, fee tag.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { useT } from '../state/AppState';
import { bookingStatus } from '../utils/status';
import { formatSlot, formatUGX } from '../utils/format';
import { Card, Txt } from './ui';

export function BookingStatusPill({ status }) {
  const t = useT();
  const s = bookingStatus(status);
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={14} color={s.color} />
      <Txt variant="caption" color={s.color} style={{ marginLeft: 4, fontWeight: '700' }}>{t(`bookingStatus.${s.key}`)}</Txt>
    </View>
  );
}

export function FeeTag({ amount }) {
  const t = useT();
  return (
    <View style={styles.fee}>
      <Txt variant="caption" color={colors.primaryDark} style={{ fontWeight: '700' }}>
        {formatUGX(amount) || t('book.feeOnRequest')}
      </Txt>
    </View>
  );
}

// title/subtitle let each role decide what it may show (owners never see patient details)
export function BookingCard({ booking, title, subtitle, onPress, right }) {
  return (
    <Card onPress={onPress} style={styles.card} accessibilityLabel={title}>
      <View style={styles.when}>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginHorizontal: space.md }}>
        <Txt variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>{title}</Txt>
        <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400' }} numberOfLines={1}>{formatSlot(booking.start_at)}</Txt>
        {subtitle ? <Txt variant="caption" color={colors.textSecondary} numberOfLines={1}>{subtitle}</Txt> : null}
      </View>
      {right ?? <BookingStatusPill status={booking.status} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill },
  fee: { backgroundColor: colors.primaryLight, paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  when: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
});
