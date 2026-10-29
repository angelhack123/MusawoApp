// Staff workspace: pending-approval state, doctor bookings dashboard, or facility-owner dashboard.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { useStaffSession } from '../state/StaffSession';
import { StaffAPI } from '../api/booking';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { BookingCard } from '../components/BookingParts';
import { Banner, Button, Card, IconButton, IconCircle, Txt } from '../components/ui';

const SCOPES = ['requests', 'upcoming', 'past'];

function PendingApproval({ profile, onRefresh }) {
  const t = useAppState().t;
  return (
    <View>
      <Card style={{ alignItems: 'center' }}>
        <IconCircle icon="hourglass" size={72} color={colors.warningText} bg={colors.warningBg} />
        <Txt variant="h2" color={colors.primaryDark} style={{ marginTop: space.md, textAlign: 'center' }}>{t('staff.pendingTitle')}</Txt>
        <Txt variant="body" color={colors.textSecondary} style={{ marginTop: space.sm, textAlign: 'center' }}>{t('staff.pendingBody')}</Txt>
        {profile.claimed_registration_number ? (
          <Txt variant="label" style={{ marginTop: space.md }}>{t('staff.regNumber')}: {profile.claimed_registration_number}</Txt>
        ) : null}
        <Button title={t('staff.checkAgain')} icon="refresh" variant="secondary" onPress={onRefresh} style={{ marginTop: space.lg }} />
      </Card>
    </View>
  );
}

function DoctorDashboard({ navigation }) {
  const t = useAppState().t;
  const [scope, setScope] = useState('requests');
  const [items, setItems] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, requests] = await Promise.all([
        StaffAPI.doctorBookings(scope),
        scope === 'requests' ? null : StaffAPI.doctorBookings('requests'),
      ]);
      setItems(list.items);
      setCounts(c => ({ ...c, [scope]: list.count, ...(requests ? { requests: requests.count } : {}) }));
      setError(null);
    } catch (err) {
      setError(err.offline ? t('common.offline') : err.message);
      setItems(prev => prev || []);
    }
  }, [scope, t]);

  useFocusEffect(useCallback(() => {
    load();
    const timer = setInterval(load, 60000); // Backup for push: refresh every minute while open
    return () => clearInterval(timer);
  }, [load]));

  return (
    <View>
      <Card onPress={() => navigation.navigate('Availability')} style={styles.action}>
        <IconCircle icon="time" size={44} />
        <View style={{ flex: 1, marginHorizontal: space.md }}>
          <Txt variant="body" style={{ fontWeight: '700' }}>{t('staff.hoursAndFees')}</Txt>
          <Txt variant="caption" color={colors.textSecondary}>{t('staff.hoursHint')}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
      </Card>

      <View style={styles.segments} accessibilityRole="tablist">
        {SCOPES.map(s => (
          <Pressable key={s} onPress={() => { setScope(s); setItems(null); }} style={[styles.segment, scope === s && styles.segmentActive]}
            accessibilityRole="tab" accessibilityState={{ selected: scope === s }}>
            <Txt variant="label" color={scope === s ? colors.white : colors.primaryDark} style={{ fontWeight: '700' }}>
              {t(`staff.scopes.${s}`)}{counts[s] ? ` (${counts[s]})` : ''}
            </Txt>
          </Pressable>
        ))}
      </View>

      {error ? <Banner tone="offline" text={error} style={{ marginBottom: space.md }} /> : null}
      {!items ? <SkeletonList count={3} /> : items.length === 0 ? (
        <EmptyState icon="calendar-clear" title={t(`staff.empty.${scope}`)} message={scope === 'requests' ? t('staff.emptyRequestsHint') : undefined} />
      ) : items.map(b => (
        <BookingCard key={b.id} booking={b} title={b.patient_name} subtitle={b.facility.name}
          onPress={() => navigation.navigate('DoctorBooking', { id: b.id, booking: b })} />
      ))}
    </View>
  );
}

function OwnerDashboard({ navigation }) {
  const t = useAppState().t;
  const [facilities, setFacilities] = useState(null);
  const [error, setError] = useState(null);

  useFocusEffect(useCallback(() => {
    StaffAPI.ownedFacilities().then(f => { setFacilities(f); setError(null); })
      .catch(err => { setError(err.offline ? t('common.offline') : err.message); setFacilities(prev => prev || []); });
  }, [t]));

  return (
    <View>
      <Button title={t('staff.registerFacility')} icon="add-circle" size="lg" onPress={() => navigation.navigate('OwnerFacilityForm')} style={{ marginBottom: space.lg }} />
      {error ? <Banner tone="offline" text={error} style={{ marginBottom: space.md }} /> : null}
      {!facilities ? <SkeletonList count={2} /> : facilities.length === 0 ? (
        <EmptyState icon="business" title={t('staff.noFacilitiesTitle')} message={t('staff.noFacilities')} />
      ) : facilities.map(f => (
        <Card key={f.id} onPress={() => navigation.navigate('OwnerFacility', { id: f.id })} style={styles.action}>
          <IconCircle icon="business" size={48} />
          <View style={{ flex: 1, marginHorizontal: space.md }}>
            <Txt variant="h3" numberOfLines={2}>{f.name}</Txt>
            <Txt variant="caption" color={colors.textSecondary}>{[f.type_display, f.district_name].filter(Boolean).join(' · ')}</Txt>
            <Txt variant="caption" color={f.is_verified ? colors.successText : colors.warningText} style={{ fontWeight: '700', marginTop: 2 }}>
              {f.is_verified ? `✓ ${t('facility.verified')}` : t('staff.awaitingVerification')} · {t('staff.doctorCount', { count: f.doctors.length })}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
        </Card>
      ))}
    </View>
  );
}

export default function StaffHomeScreen({ navigation }) {
  const t = useAppState().t;
  const { profile, loading, pushStatus, refresh, logout } = useStaffSession();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !profile) navigation.replace('StaffAuth');
  }, [loading, profile]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (!profile) return <View style={styles.container} />;

  const signOut = () => Alert.alert(t('staff.signOutTitle'), t('staff.signOutBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('staff.signOut'), style: 'destructive', onPress: async () => { await logout(); navigation.goBack(); } },
  ]);

  return (
    <View style={styles.container}>
      <AppBar
        title={profile.full_name}
        subtitle={t(`staff.roles.${profile.role}`)}
        onBack={() => navigation.goBack()}
        right={
          <View style={{ flexDirection: 'row' }}>
            {profile.is_approved && (
              <IconButton icon="notifications-outline" badge={profile.unread_notifications > 0}
                onPress={() => navigation.navigate('Notifications')} label={t('staff.notifications')} />
            )}
            <IconButton icon="log-out-outline" onPress={signOut} label={t('staff.signOut')} />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} colors={[colors.primary]} />}
      >
        {profile.is_approved && pushStatus === 'denied' && (
          <Banner tone="warning" icon="notifications-off" text={t('staff.pushDenied')} style={{ marginBottom: space.md }} />
        )}
        {profile.is_approved && pushStatus === 'unavailable' && (
          <Banner tone="info" icon="notifications" text={t('staff.pushUnavailable')} style={{ marginBottom: space.md }} />
        )}
        {!profile.is_approved ? <PendingApproval profile={profile} onRefresh={refresh} />
          : profile.role === 'DOCTOR' ? <DoctorDashboard navigation={navigation} />
          : <OwnerDashboard navigation={navigation} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  action: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  segments: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 4, marginVertical: space.md },
  segment: { flex: 1, minHeight: touch.min - 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.primary },
});
