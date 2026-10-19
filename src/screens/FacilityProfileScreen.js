// US-4.2 profile + US-4.3 Agency Score; "Give Feedback" pre-fills the form.
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import { FacilitiesAPI } from '../api/musawo';
import { facilityIcon } from '../utils/status';
import { formatDate } from '../utils/format';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { ScoreBar, Stars } from '../components/Rating';
import { DoctorCard } from '../components/Cards';
import { Banner, Button, Card, IconCircle, InfoRow, SectionTitle, Txt } from '../components/ui';

export const SCORE_ROWS = [
  { key: 'respect_score', icon: 'people', labelKey: 'score.respect' },
  { key: 'communication_score', icon: 'chatbubbles', labelKey: 'score.communication' },
  { key: 'transparency_score', icon: 'cash', labelKey: 'score.transparency' },
];

export function AgencyScoreCard({ score }) {
  const t = useAppState().t;
  if (!score) {
    return (
      <Card style={styles.scoreCard}>
        <Txt variant="h3" color={colors.primaryDark}>{t('score.title')}</Txt>
        <View style={styles.noScore}>
          <IconCircle icon="bar-chart" size={48} color={colors.neutral} bg={colors.neutralBg} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Txt variant="body" style={{ fontWeight: '700' }}>{t('score.notEnoughTitle')}</Txt>
            <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400' }}>{t('score.notEnough')}</Txt>
          </View>
        </View>
      </Card>
    );
  }
  return (
    <Card style={styles.scoreCard}>
      <Txt variant="h3" color={colors.primaryDark}>{t('score.title')}</Txt>
      <View style={styles.scoreTop}>
        <Txt style={styles.bigScore}>{score.avg_overall_rating?.toFixed(1) ?? '—'}</Txt>
        <View style={{ marginLeft: space.md }}>
          <Stars value={Math.round(score.avg_overall_rating || 0)} size={22} />
          <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
            {t('score.basedOn', { count: score.total_feedback_count })}
          </Txt>
        </View>
      </View>
      {SCORE_ROWS.map(r => <ScoreBar key={r.key} icon={r.icon} label={t(r.labelKey)} value={score[r.key]} />)}
      <Txt variant="caption" color={colors.textSecondary}>{t('score.explain')}</Txt>
    </Card>
  );
}

export default function FacilityProfileScreen({ navigation, route }) {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [facility, setFacility] = useState(route.params.facility?.agency_score !== undefined ? route.params.facility : null);
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    FacilitiesAPI.get(id).then(setFacility).catch(err => setError(err.offline ? t('common.offline') : err.message));
    FacilitiesAPI.doctors(id).then(setDoctors).catch(() => setDoctors([]));
  }, [id]);

  const appBar = <AppBar title={t('facility.title')} onBack={() => navigation.goBack()} rounded={false} />;

  if (!facility) {
    return (
      <View style={styles.container}>
        {appBar}
        {error ? (
          <EmptyState icon="alert-circle" tone="danger" title={t('common.errorTitle')} message={error} actionLabel={t('common.goBack')} onAction={() => navigation.goBack()} />
        ) : (
          <View style={{ padding: space.lg }}>
            <Skeleton height={160} r={16} />
            <Skeleton height={220} r={12} style={{ marginTop: space.lg }} />
          </View>
        )}
      </View>
    );
  }

  const hasGps = facility.latitude != null && facility.longitude != null;
  const district = facility.district?.name || facility.district;
  // Google Maps directions; falls back to a name search when GPS is missing (US-4.2)
  const directions = () => Linking.openURL(hasGps
    ? `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.name}, ${district}, Uganda`)}`);

  const details = [
    { icon: 'location', label: t('facility.district'), value: [facility.subcounty, district].filter(Boolean).join(', ') },
    facility.address && { icon: 'navigate', label: t('facility.address'), value: facility.address },
    hasGps && { icon: 'compass', label: t('facility.gps'), value: `${Number(facility.latitude).toFixed(5)}, ${Number(facility.longitude).toFixed(5)}` },
    facility.ownership_display && { icon: 'people', label: t('facility.ownership'), value: facility.ownership_display },
    facility.moh_facility_code && { icon: 'barcode', label: t('facility.mohCode'), value: facility.moh_facility_code },
    facility.phone && { icon: 'call', label: t('facility.phone'), value: facility.phone },
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      {appBar}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <IconCircle icon={facilityIcon(facility.type)} size={72} color={colors.white} bg={colors.primary} />
          <Txt variant="h1" style={styles.center} accessibilityRole="header">{facility.name}</Txt>
          <Txt variant="body" color={colors.textSecondary} style={styles.center}>{facility.type_display || facility.type}</Txt>
          {facility.is_verified ? (
            <View style={styles.verified}><Txt variant="caption" color={colors.successText} style={{ fontWeight: '700' }}>✓ {t('facility.verified')}</Txt></View>
          ) : (
            <Banner tone="warning" icon="alert-circle" text={t('facility.unverified')} style={{ marginTop: space.md, alignSelf: 'stretch' }} />
          )}
          <View style={styles.actions}>
            <Button title={t('facility.directions')} icon="navigate" variant="secondary" onPress={directions} style={{ flex: 1 }} />
            {facility.phone ? (
              <Button title={t('facility.call')} icon="call" variant="secondary" onPress={() => Linking.openURL(`tel:${facility.phone}`)} style={{ flex: 1 }} />
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <AgencyScoreCard score={facility.agency_score} />

          <Card style={{ marginTop: space.lg, paddingVertical: space.xs }}>
            {details.map((d, i) => <InfoRow key={d.label} {...d} last={i === details.length - 1} />)}
          </Card>

          {doctors?.length > 0 && (
            <View style={{ marginTop: space.xl }}>
              <SectionTitle title={t('facility.doctorsHere', { count: doctors.length })} />
              {doctors.map(d => (
                <DoctorCard key={d.id} doctor={d} onPress={() => navigation.navigate('DoctorProfile', { id: d.id, doctor: d })} />
              ))}
            </View>
          )}
          {facility.updated_at ? (
            <Txt variant="caption" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: space.lg }}>
              {t('facility.updated', { date: formatDate(facility.updated_at) })}
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + space.md }]}>
        <Button
          title={t('facility.giveFeedback')}
          icon="chatbubble-ellipses"
          size="lg"
          onPress={() => navigation.navigate('Feedback', {
            facility: { id: facility.id, name: facility.name, type: facility.type, type_display: facility.type_display, district: facility.district },
          })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', backgroundColor: colors.card, padding: space.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  center: { textAlign: 'center', marginTop: space.sm },
  verified: { marginTop: space.md, backgroundColor: colors.successBg, paddingHorizontal: space.md, paddingVertical: 4, borderRadius: radius.pill },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg, alignSelf: 'stretch' },
  body: { padding: space.lg },
  scoreCard: { borderRadius: radius.lg },
  scoreTop: { flexDirection: 'row', alignItems: 'center', marginVertical: space.lg },
  bigScore: { fontSize: 48, fontWeight: '800', color: colors.primaryDark },
  noScore: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
