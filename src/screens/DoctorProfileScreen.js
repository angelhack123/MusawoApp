// SCR-005: full verification details (US-1.4), status explanation (US-1.3), sharing (US-1.6).
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import { DoctorsAPI } from '../api/musawo';
import { doctorStatus } from '../utils/status';
import { formatDate, formatMonthYear } from '../utils/format';
import { shareDoctor, shareDoctorWhatsApp } from '../utils/share';
import AppBar from '../components/AppBar';
import StatusBadge, { StatusExplainSheet } from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { FacilityCard, specialtyName } from '../components/Cards';
import { Avatar, Banner, Button, Card, IconButton, InfoRow, SectionTitle, Txt } from '../components/ui';

export default function DoctorProfileScreen({ navigation, route }) {
  const { t, settings } = useAppState();
  const { id } = route.params;
  const [doctor, setDoctor] = useState(route.params.doctor || null);
  const [loading, setLoading] = useState(!route.params.doctor);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [explain, setExplain] = useState(false);

  useEffect(() => {
    DoctorsAPI.get(id)
      .then(res => { setDoctor(res.data); setOffline(res.fromCache); })
      .catch(err => { if (!doctor) setError(err.offline ? t('common.offlineNoCache') : err.message); else if (err.offline) setOffline(true); })
      .finally(() => setLoading(false));
  }, [id]);

  const appBar = (
    <AppBar
      title={t('doctor.title')}
      onBack={() => navigation.goBack()}
      right={doctor ? <IconButton icon="share-social" onPress={() => shareDoctor(doctor)} label={t('doctor.share')} /> : null}
      rounded={false}
    />
  );

  if (!doctor) {
    return (
      <View style={styles.container}>
        {appBar}
        {loading ? (
          <View style={{ padding: space.lg, alignItems: 'center' }}>
            <Skeleton width={80} height={80} r={40} />
            <Skeleton width="60%" height={24} style={{ marginTop: space.lg }} />
            <Skeleton width="100%" height={48} r={12} style={{ marginTop: space.lg }} />
            <Skeleton width="100%" height={200} r={12} style={{ marginTop: space.lg }} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" tone="danger" title={t('common.errorTitle')} message={error} actionLabel={t('common.goBack')} onAction={() => navigation.goBack()} />
        )}
      </View>
    );
  }

  const s = doctorStatus(doctor.status);
  const suspended = doctor.status === 'SUSPENDED';
  const specialty = specialtyName(doctor.specialty, settings.lang, t('doctor.generalPractitioner'));
  const rows = [
    { icon: 'card', label: t('doctor.regNumber'), value: doctor.registration_number },
    { icon: 'business', label: t('doctor.council'), value: doctor.council_display || doctor.council },
    { icon: 'calendar', label: t('doctor.licensedSince'), value: formatMonthYear(doctor.registration_date) || t('common.notAvailable') },
    doctor.license_expiry_date && { icon: 'hourglass', label: t('doctor.licenseExpiry'), value: formatDate(doctor.license_expiry_date),
      valueColor: doctor.status === 'EXPIRED' ? colors.warningText : colors.text },
    { icon: 'refresh', label: t('doctor.lastVerified'), value: formatMonthYear(doctor.last_verified_at) || t('common.notAvailable') },
    suspended && doctor.suspension_date && { icon: 'warning', label: t('doctor.suspendedOn'), value: formatDate(doctor.suspension_date), valueColor: colors.dangerText },
    suspended && doctor.suspension_reason && { icon: 'document-text', label: t('doctor.reason'), value: doctor.suspension_reason, valueColor: colors.dangerText },
    doctor.source_gazette_ref && { icon: 'newspaper', label: t('doctor.source'), value: doctor.source_gazette_ref },
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      {appBar}
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={[styles.header, { backgroundColor: s.bg }]}>
          <View style={[styles.avatarRing, { borderColor: s.accent }]}>
            <Avatar name={doctor.full_name} photoUrl={doctor.photo_url} size={80} color={s.fg} bg={colors.white} />
          </View>
          <Txt variant="h1" style={styles.center} accessibilityRole="header">{doctor.full_name}</Txt>
          <Txt variant="bodyLg" color={colors.textSecondary} style={[styles.center, { marginBottom: space.lg }]}>{specialty}</Txt>
          <StatusBadge status={doctor.status} size="full" onPress={() => setExplain(true)} />
          <Txt variant="label" color={s.fg} style={[styles.center, { marginTop: space.md, fontWeight: '600' }]}>
            {t(`status.${s.key}Advice`)}
          </Txt>
        </View>

        <View style={styles.body}>
          {offline && <Banner tone="offline" text={t('common.showingSaved')} style={{ marginBottom: space.md }} />}

          <Card style={{ paddingVertical: space.xs }}>
            {rows.map((r, i) => <InfoRow key={r.label} {...r} last={i === rows.length - 1} />)}
          </Card>

          <Button variant="text" icon="information-circle" title={t('doctor.whatStatusMeans')} onPress={() => setExplain(true)} style={{ alignSelf: 'flex-start', marginTop: space.sm }} />

          {doctor.facilities?.length > 0 && (
            <View style={{ marginTop: space.lg }}>
              <SectionTitle title={t('doctor.facilities')} />
              {doctor.facilities.map(f => (
                <View key={f.id}>
                  <FacilityCard facility={f} compact onPress={() => navigation.navigate('FacilityProfile', { id: f.id, facility: f })} />
                  {f.is_primary ? <Txt variant="caption" color={colors.primary} style={styles.primaryTag}>{t('doctor.primaryFacility')}</Txt> : null}
                </View>
              ))}
            </View>
          )}

          <Button title={t('doctor.shareWhatsApp')} variant="whatsapp" icon="logo-whatsapp" size="lg" onPress={() => shareDoctorWhatsApp(doctor)} style={{ marginTop: space.xl }} />
          <View style={styles.actions}>
            <Button title={t('doctor.share')} variant="secondary" icon="share-social" onPress={() => shareDoctor(doctor)} style={{ flex: 1 }} />
            <Button title={t('doctor.searchAnother')} icon="search" onPress={() => navigation.navigate('Tabs', { screen: 'Verify' })} style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>

      <StatusExplainSheet visible={explain} onClose={() => setExplain(false)} doctor={doctor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  avatarRing: { borderWidth: 3, borderRadius: 50, padding: 4, marginBottom: space.md, backgroundColor: colors.white },
  center: { textAlign: 'center' },
  body: { padding: space.lg },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  primaryTag: { marginTop: -4, marginBottom: space.sm, marginLeft: space.md, fontWeight: '700' },
});
