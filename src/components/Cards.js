// Doctor Result Card (UI Spec 2.3) and Facility card (US-4.1).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { doctorStatus, facilityIcon } from '../utils/status';
import { useAppState } from '../state/AppState';
import { Avatar, Card, IconCircle, Txt } from './ui';
import StatusBadge from './StatusBadge';

export const specialtyName = (specialty, lang, fallback) =>
  (lang === 'lg' && specialty?.display_name_lg) || specialty?.name || fallback;

export function DoctorCard({ doctor, onPress }) {
  const { t, settings } = useAppState();
  const s = doctorStatus(doctor.status);
  const specialty = specialtyName(doctor.specialty, settings.lang, t('doctor.generalPractitioner'));
  return (
    <Card onPress={onPress} style={styles.doctor} accessibilityLabel={`${doctor.full_name}, ${t(`status.${s.key}`)}`}>
      <Avatar name={doctor.full_name} photoUrl={doctor.photo_url} size={56} color={s.fg} bg={s.bg} />
      <View style={styles.info}>
        <Txt variant="h3" numberOfLines={2}>{doctor.full_name}</Txt>
        <Txt variant="body" color={colors.textSecondary} numberOfLines={1}>{specialty}</Txt>
        <Txt variant="caption" color={colors.textSecondary} style={{ marginBottom: space.sm }}>{doctor.registration_number}</Txt>
        <StatusBadge status={doctor.status} size="sm" />
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.placeholder} />
    </Card>
  );
}

export function FacilityCard({ facility, onPress, selectable, selected, compact }) {
  const { t } = useAppState();
  const score = facility.agency_score;
  const district = facility.district?.name || facility.district;
  return (
    <Card
      onPress={onPress}
      style={[styles.facility, compact && styles.compact, selected && styles.selected]}
      accessibilityLabel={facility.name}
    >
      <IconCircle icon={facilityIcon(facility.type)} size={compact ? 40 : 48} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Txt variant={compact ? 'body' : 'h3'} style={compact && { fontWeight: '600' }} numberOfLines={2}>{facility.name}</Txt>
          {facility.is_verified ? <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4, marginTop: 3 }} /> : null}
        </View>
        <Txt variant="label" color={colors.textSecondary} numberOfLines={1} style={{ fontWeight: '400' }}>
          {[facility.type_display || facility.type, district].filter(Boolean).join(' • ')}
        </Txt>
        {!compact && (
          <View style={styles.scoreRow}>
            {score ? (
              <>
                <Ionicons name="star" size={16} color={colors.amber} />
                <Txt variant="label" style={{ marginLeft: 4, fontWeight: '700' }}>{score.avg_overall_rating?.toFixed(1)}</Txt>
                <Txt variant="caption" color={colors.textSecondary} style={{ marginLeft: 6 }}>
                  {t('facility.reports', { count: score.total_feedback_count })}
                </Txt>
              </>
            ) : (
              <Txt variant="caption" color={colors.textSecondary}>{t('facility.noScoreShort')}</Txt>
            )}
          </View>
        )}
      </View>
      {selectable ? (
        <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={26} color={selected ? colors.primary : colors.placeholder} />
      ) : (
        <Ionicons name="chevron-forward" size={22} color={colors.placeholder} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  doctor: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  facility: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  compact: { padding: space.md, marginBottom: space.sm },
  selected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryLight },
  info: { flex: 1, marginHorizontal: space.md },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
});
