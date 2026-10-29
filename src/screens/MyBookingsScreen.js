// Patient: bookings made on this phone; cancel upcoming ones.
import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import { BookingAPI } from '../api/booking';
import { formatSlot, formatUGX } from '../utils/format';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { BookingStatusPill } from '../components/BookingParts';
import { Banner, Button, Card, SectionTitle, Txt } from '../components/ui';

const ACTIVE = ['REQUESTED', 'ACCEPTED'];

function PatientBookingCard({ booking, onCancel }) {
  const t = useAppState().t;
  const canCancel = ACTIVE.includes(booking.status) && new Date(booking.start_at) > new Date();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Txt variant="caption" color={colors.textSecondary} style={{ fontWeight: '700', letterSpacing: 1 }}>{booking.reference}</Txt>
        <BookingStatusPill status={booking.status} />
      </View>
      <Txt variant="h3" style={{ marginTop: space.sm }}>{booking.doctor.full_name}</Txt>
      <Txt variant="body" color={colors.textSecondary}>{booking.facility.name}</Txt>
      <Txt variant="body" style={{ fontWeight: '700', marginTop: space.xs }}>{formatSlot(booking.start_at)}</Txt>
      {booking.fee_at_booking ? <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400' }}>{formatUGX(booking.fee_at_booking)}</Txt> : null}
      {booking.status === 'REQUESTED' ? (
        <Txt variant="caption" color={colors.warningText} style={{ marginTop: space.sm }}>{t('book.waiting')}</Txt>
      ) : null}
      {booking.status_note && ['DECLINED', 'CANCELLED'].includes(booking.status) ? (
        <View style={styles.note}><Txt variant="label" style={{ fontWeight: '400' }}>{t('book.reason')}: {booking.status_note}</Txt></View>
      ) : null}
      {canCancel ? (
        <Button title={t('book.cancelBooking')} variant="danger" icon="close-circle" onPress={() => onCancel(booking)} style={{ marginTop: space.md }} />
      ) : null}
    </Card>
  );
}

export default function MyBookingsScreen({ navigation }) {
  const t = useAppState().t;
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setBookings(await BookingAPI.mine());
      setError(null);
    } catch (err) {
      setError(err.offline ? t('common.offline') : err.message);
      setBookings(prev => prev || []);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancel = (booking) => Alert.alert(t('book.cancelTitle'), t('book.cancelBody'), [
    { text: t('feedback.keepGoing'), style: 'cancel' },
    {
      text: t('book.cancelBooking'),
      style: 'destructive',
      onPress: async () => {
        try { await BookingAPI.cancel(booking.reference); load(); }
        catch (err) { Alert.alert(t('common.errorTitle'), err.message); }
      },
    },
  ]);

  const now = new Date();
  const upcoming = (bookings || []).filter(b => ACTIVE.includes(b.status) && new Date(b.start_at) > now)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const past = (bookings || []).filter(b => !upcoming.includes(b));

  return (
    <View style={styles.container}>
      <AppBar title={t('book.myBookings')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[colors.primary]} />}
      >
        {error ? <Banner tone="offline" text={error} style={{ marginBottom: space.md }} /> : null}
        {!bookings ? <SkeletonList count={2} /> : bookings.length === 0 ? (
          <EmptyState icon="calendar" title={t('book.noBookingsTitle')} message={t('book.noBookings')}
            actionLabel={t('book.findDoctor')} onAction={() => navigation.navigate('Tabs', { screen: 'Book' })} />
        ) : (
          <>
            {upcoming.length > 0 && <SectionTitle title={t('book.upcoming')} />}
            {upcoming.map(b => <PatientBookingCard key={b.reference} booking={b} onCancel={cancel} />)}
            {past.length > 0 && <SectionTitle title={t('book.past')} style={{ marginTop: space.lg }} />}
            {past.map(b => <PatientBookingCard key={b.reference} booking={b} onCancel={cancel} />)}
          </>
        )}
        <Txt variant="caption" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: space.lg }}>{t('book.deviceNote')}</Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { marginTop: space.sm, padding: space.sm, borderRadius: radius.sm, backgroundColor: colors.neutralBg },
});
