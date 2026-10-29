// Facility owner: booking schedule (no medical details), linked doctors, facility details.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { StaffAPI } from '../api/booking';
import { daysAgo, formatTime, toISODate } from '../utils/format';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import SearchInput from '../components/SearchInput';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import { BookingStatusPill } from '../components/BookingParts';
import { Banner, Button, Card, IconButton, InfoRow, Txt } from '../components/ui';

const TABS = ['schedule', 'doctors', 'details'];

// Yesterday + the next 13 days
const scheduleDays = () => Array.from({ length: 15 }, (_, i) => { const d = daysAgo(1); d.setDate(d.getDate() + i); return d; });

function Schedule({ facilityId }) {
  const t = useAppState().t;
  const [day, setDay] = useState(toISODate(new Date()));
  const [rows, setRows] = useState(null);

  const load = useCallback(() => {
    setRows(null);
    StaffAPI.schedule(facilityId, day).then(r => setRows(r.bookings)).catch(() => setRows([]));
  }, [facilityId, day]);

  useEffect(() => { load(); }, [load]);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.md }}>
        {scheduleDays().map(d => {
          const iso = toISODate(d);
          const selected = iso === day;
          return (
            <Pressable key={iso} onPress={() => setDay(iso)} style={[styles.day, selected && styles.daySelected]} accessibilityRole="button" accessibilityState={{ selected }}>
              <Txt variant="caption" color={selected ? colors.white : colors.textSecondary} style={{ fontWeight: '700' }}>
                {d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
              </Txt>
              <Txt variant="h3" color={selected ? colors.white : colors.text}>{d.getDate()}</Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      <Banner tone="info" icon="lock-closed" text={t('staff.schedulePrivacy')} style={{ marginBottom: space.md }} />
      {!rows ? <SkeletonList count={2} /> : rows.length === 0 ? (
        <EmptyState icon="calendar-clear" title={t('staff.noScheduleTitle')} message={t('staff.noSchedule')} />
      ) : rows.map(r => (
        <Card key={r.patient_id} style={styles.row}>
          <View style={styles.time}>
            <Txt variant="body" color={colors.primaryDark} style={{ fontWeight: '800' }}>{formatTime(r.start_at)}</Txt>
            <Txt variant="caption" color={colors.textSecondary}>{formatTime(r.end_at)}</Txt>
          </View>
          <View style={{ flex: 1, marginHorizontal: space.md }}>
            <Txt variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>{r.doctor}</Txt>
            <Txt variant="caption" color={colors.textSecondary} style={{ letterSpacing: 1 }}>{t('staff.patientId')}: {r.patient_id}</Txt>
          </View>
          <BookingStatusPill status={r.status} />
        </Card>
      ))}
    </View>
  );
}

function Doctors({ facility, onChanged }) {
  const t = useAppState().t;
  const [reg, setReg] = useState('');
  const [busy, setBusy] = useState(false);

  const link = async () => {
    setBusy(true);
    try { onChanged(await StaffAPI.linkDoctor(facility.id, reg.trim())); setReg(''); }
    catch (err) { Alert.alert(t('common.errorTitle'), err.message); }
    finally { setBusy(false); }
  };

  const unlink = (doctor) => Alert.alert(t('staff.unlinkTitle'), t('staff.unlinkBody', { name: doctor.full_name }), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('staff.remove'),
      style: 'destructive',
      onPress: async () => {
        try { onChanged(await StaffAPI.unlinkDoctor(facility.id, doctor.id)); }
        catch (err) { Alert.alert(t('common.errorTitle'), err.message); }
      },
    },
  ]);

  return (
    <View>
      <Card style={{ marginBottom: space.lg }}>
        <Txt variant="h3" color={colors.primaryDark}>{t('staff.linkDoctor')}</Txt>
        <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400', marginBottom: space.md }}>{t('staff.linkDoctorHint')}</Txt>
        <SearchInput value={reg} onChangeText={v => setReg(v.toUpperCase())} placeholder={t('verify.regPlaceholder')} icon="card-outline"
          autoCapitalize="characters" onSubmitEditing={link} />
        <Button title={t('staff.addDoctor')} icon="person-add" onPress={link} loading={busy} disabled={reg.trim().length < 3} style={{ marginTop: space.md }} />
      </Card>
      {facility.doctors.length === 0 ? (
        <EmptyState icon="people" title={t('staff.noDoctorsTitle')} message={t('staff.noDoctors')} />
      ) : facility.doctors.map(d => (
        <Card key={d.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Txt variant="body" style={{ fontWeight: '700' }}>{d.full_name}</Txt>
            <Txt variant="caption" color={colors.textSecondary}>{[d.specialty, d.registration_number].filter(Boolean).join(' · ')}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.xs, gap: space.sm }}>
              <StatusBadge status={d.status} size="sm" />
              <Txt variant="caption" color={d.has_account ? colors.successText : colors.textSecondary}>
                {d.has_account ? t('staff.onMusawo') : t('staff.notOnMusawo')}
              </Txt>
            </View>
          </View>
          <IconButton icon="trash-outline" color={colors.dangerText} onPress={() => unlink(d)} label={t('staff.remove')} />
        </Card>
      ))}
    </View>
  );
}

export default function OwnerFacilityScreen({ navigation, route }) {
  const t = useAppState().t;
  const [facility, setFacility] = useState(null);
  const [tab, setTab] = useState('schedule');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => StaffAPI.ownedFacility(route.params.id).then(setFacility).catch(() => {}), [route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <AppBar title={facility?.name || t('facility.title')} subtitle={facility && (facility.is_verified ? t('facility.verified') : t('staff.awaitingVerification'))}
        onBack={() => navigation.goBack()}>
        <View style={styles.tabs}>
          {TABS.map(k => (
            <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
              <Txt variant="label" color={tab === k ? colors.primaryDark : colors.white} style={{ fontWeight: '700' }}>{t(`staff.tabs.${k}`)}</Txt>
            </Pressable>
          ))}
        </View>
      </AppBar>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[colors.primary]} />}
      >
        {!facility ? <Skeleton height={200} r={12} /> : tab === 'schedule' ? <Schedule facilityId={facility.id} />
          : tab === 'doctors' ? <Doctors facility={facility} onChanged={setFacility} />
          : (
            <View>
              <Card style={{ paddingVertical: space.xs }}>
                <InfoRow icon="business" label={t('compare.type')} value={facility.type_display} />
                <InfoRow icon="location" label={t('facility.district')} value={[facility.subcounty, facility.district_name].filter(Boolean).join(', ')} />
                {facility.address ? <InfoRow icon="navigate" label={t('facility.address')} value={facility.address} /> : null}
                <InfoRow icon="call" label={t('facility.phone')} value={facility.phone || '—'} last />
              </Card>
              <Button title={t('staff.editDetails')} icon="create" variant="secondary" onPress={() => navigation.navigate('OwnerFacilityForm', { facility })}
                style={{ marginTop: space.md }} />
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', marginTop: space.md, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: 4 },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.white },
  day: { width: 60, paddingVertical: space.sm, marginRight: space.sm, borderRadius: radius.md, alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md, minHeight: touch.large },
  time: { alignItems: 'center', minWidth: 52 },
});
