// Doctor: full booking details (patient, condition, contact) and accept / decline / cancel / complete.
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { StaffAPI } from '../api/booking';
import { formatSlot, formatUGX } from '../utils/format';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { BottomSheet } from '../components/Sheet';
import { BookingStatusPill } from '../components/BookingParts';
import { Avatar, Button, Card, Chip, InfoRow, Txt } from '../components/ui';

const QUICK_REASONS = ['unavailable', 'fullyBooked', 'wrongFacility', 'seeOther'];

export default function DoctorBookingScreen({ navigation, route }) {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(route.params.booking || null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [reasonFor, setReasonFor] = useState(null); // 'decline' | 'cancel'
  const [reason, setReason] = useState('');

  useEffect(() => {
    StaffAPI.doctorBooking(route.params.id).then(setBooking)
      .catch(err => setError(err.offline ? t('common.offline') : err.message));
  }, [route.params.id]);

  const act = async (action, why) => {
    setBusy(action);
    try {
      setBooking(await StaffAPI.bookingAction(booking.id, action, why));
      setReasonFor(null);
      setReason('');
    } catch (err) {
      Alert.alert(t('common.errorTitle'), err.message);
    } finally {
      setBusy(null);
    }
  };

  const appBar = <AppBar title={t('staff.bookingTitle')} onBack={() => navigation.goBack()} rounded={false} />;
  if (!booking) {
    return (
      <View style={styles.container}>
        {appBar}
        {error ? <EmptyState icon="alert-circle" tone="danger" title={t('common.errorTitle')} message={error} />
          : <View style={{ padding: space.lg }}><Skeleton height={260} r={12} /></View>}
      </View>
    );
  }

  const started = new Date(booking.start_at) <= new Date();

  return (
    <View style={styles.container}>
      {appBar}
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 140 }}>
        <Card style={styles.patient}>
          <Avatar name={booking.patient_name} size={56} />
          <View style={{ flex: 1, marginHorizontal: space.md }}>
            <Txt variant="h3">{booking.patient_name}</Txt>
            <Txt variant="caption" color={colors.textSecondary} style={{ letterSpacing: 1 }}>{booking.reference}</Txt>
          </View>
          <BookingStatusPill status={booking.status} />
        </Card>

        <Card style={styles.condition}>
          <Txt variant="label" color={colors.primaryDark} style={{ fontWeight: '700' }}>{t('staff.condition')}</Txt>
          <Txt variant="bodyLg" style={{ marginTop: space.sm }}>{booking.condition_summary}</Txt>
        </Card>

        <Card style={{ marginTop: space.md, paddingVertical: space.xs }}>
          <InfoRow icon="time" label={t('book.when')} value={formatSlot(booking.start_at)} />
          <InfoRow icon="business" label={t('feedback.facility')} value={booking.facility.name} />
          <InfoRow icon="cash" label={t('book.fee')} value={formatUGX(booking.fee_at_booking) || t('book.feeOnRequest')} />
          <InfoRow icon="call" label={t('book.phone')} value={booking.patient_phone} last />
        </Card>
        <Button title={t('staff.callPatient')} icon="call" variant="secondary" onPress={() => Linking.openURL(`tel:${booking.patient_phone}`)} style={{ marginTop: space.md }} />

        {booking.status_note ? (
          <View style={styles.note}><Txt variant="label" style={{ fontWeight: '400' }}>{t('book.reason')}: {booking.status_note}</Txt></View>
        ) : null}
      </ScrollView>

      {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          {booking.status === 'REQUESTED' && (
            <>
              <Button title={t('staff.decline')} variant="danger" icon="close" onPress={() => setReasonFor('decline')} style={{ flex: 1 }} />
              <Button title={t('staff.accept')} icon="checkmark" onPress={() => act('accept')} loading={busy === 'accept'} style={{ flex: 1 }} />
            </>
          )}
          {booking.status === 'ACCEPTED' && !started && (
            <Button title={t('staff.cancelBooking')} variant="danger" icon="close-circle" onPress={() => setReasonFor('cancel')} style={{ flex: 1 }} />
          )}
          {booking.status === 'ACCEPTED' && started && (
            <Button title={t('staff.markComplete')} icon="checkmark-done" onPress={() => act('complete')} loading={busy === 'complete'} style={{ flex: 1 }} />
          )}
        </View>
      )}

      <BottomSheet visible={!!reasonFor} onClose={() => setReasonFor(null)} title={t(reasonFor === 'cancel' ? 'staff.cancelTitle' : 'staff.declineTitle')}>
        <View style={{ paddingHorizontal: space.lg }}>
          <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400', marginBottom: space.md }}>{t('staff.reasonHint')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {QUICK_REASONS.map(k => <Chip key={k} label={t(`staff.reasons.${k}`)} selected={reason === t(`staff.reasons.${k}`)} onPress={() => setReason(t(`staff.reasons.${k}`))} />)}
          </View>
          <TextInput value={reason} onChangeText={setReason} placeholder={t('staff.reasonPlaceholder')} placeholderTextColor={colors.placeholder}
            style={styles.input} multiline maxLength={300} accessibilityLabel={t('book.reason')} />
          <Button title={t(reasonFor === 'cancel' ? 'staff.cancelBooking' : 'staff.decline')} variant="danger" size="lg"
            onPress={() => act(reasonFor, reason.trim())} loading={busy === reasonFor} disabled={!reason.trim()} style={{ marginTop: space.md }} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  patient: { flexDirection: 'row', alignItems: 'center' },
  condition: { marginTop: space.md, backgroundColor: colors.primaryLight, borderLeftWidth: 4, borderLeftColor: colors.primary },
  note: { marginTop: space.md, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.neutralBg },
  input: { minHeight: 90, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, padding: space.md, fontSize: 16,
    color: colors.text, textAlignVertical: 'top', marginTop: space.sm },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg,
    paddingTop: space.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, minHeight: touch.large },
});
