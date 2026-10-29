// Patient: pick a facility, a day and an open time for this doctor.
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { BookingAPI } from '../api/booking';
import { formatTime, parseDate } from '../utils/format';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import { Skeleton } from '../components/Skeleton';
import { FeeTag } from '../components/BookingParts';
import { specialtyName } from '../components/Cards';
import { Avatar, Banner, Button, Card, SectionTitle, Txt } from '../components/ui';

export default function BookDoctorScreen({ navigation, route }) {
  const { t, settings } = useAppState();
  const insets = useSafeAreaInsets();
  const { doctor } = route.params;
  const [facility, setFacility] = useState(doctor.facilities.length === 1 ? doctor.facilities[0] : null);
  const [days, setDays] = useState(null);
  const [day, setDay] = useState(null);
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState(null);

  // Days with open-slot counts for the chosen facility; jump to the first open day
  useEffect(() => {
    if (!facility) return;
    setDays(null); setDay(null); setSlots(null); setSlot(null); setError(null);
    BookingAPI.slots(doctor.id, facility.id)
      .then(list => { setDays(list); setDay(list.find(d => d.open_slots > 0)?.date || null); })
      .catch(err => setError(err.offline ? t('common.offline') : err.message));
  }, [facility?.id]);

  useEffect(() => {
    if (!facility || !day) return;
    setSlots(null); setSlot(null);
    BookingAPI.slots(doctor.id, facility.id, day)
      .then(setSlots)
      .catch(err => setError(err.offline ? t('common.offline') : err.message));
  }, [day]);

  return (
    <View style={styles.container}>
      <AppBar title={t('book.bookTitle')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }}>
        <Card style={styles.doctorCard}>
          <Avatar name={doctor.full_name} photoUrl={doctor.photo_url} size={64} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Txt variant="h3">{doctor.full_name}</Txt>
            <Txt variant="body" color={colors.textSecondary}>{specialtyName(doctor.specialty, settings.lang, t('doctor.generalPractitioner'))}</Txt>
            <StatusBadge status={doctor.status} size="sm" style={{ marginTop: space.xs }} />
          </View>
        </Card>

        <SectionTitle title={t('book.whereTitle')} style={styles.section} />
        {doctor.facilities.map(f => {
          const selected = facility?.id === f.id;
          return (
            <Pressable key={f.id} onPress={() => setFacility(f)} accessibilityRole="radio" accessibilityState={{ checked: selected }}
              style={[styles.option, selected && styles.optionSelected]}>
              <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.placeholder} />
              <View style={{ flex: 1, marginHorizontal: space.md }}>
                <Txt variant="body" style={{ fontWeight: '700' }}>{f.name}</Txt>
                <Txt variant="caption" color={colors.textSecondary}>{[f.type_display, f.district].filter(Boolean).join(' · ')}</Txt>
              </View>
              <FeeTag amount={f.consultation_fee} />
            </Pressable>
          );
        })}

        {facility && (
          <>
            <SectionTitle title={t('book.whenTitle')} style={styles.section} />
            {error ? <Banner tone="danger" text={error} /> : !days ? <Skeleton height={72} r={12} /> : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {days.map(d => {
                  const date = parseDate(d.date);
                  const selected = day === d.date;
                  const full = d.open_slots === 0;
                  return (
                    <Pressable key={d.date} disabled={full} onPress={() => setDay(d.date)}
                      accessibilityRole="button" accessibilityState={{ selected, disabled: full }}
                      style={[styles.day, selected && styles.daySelected, full && { opacity: 0.4 }]}>
                      <Txt variant="caption" color={selected ? colors.white : colors.textSecondary} style={{ fontWeight: '700' }}>
                        {date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
                      </Txt>
                      <Txt variant="h2" color={selected ? colors.white : colors.text}>{date.getDate()}</Txt>
                      <Txt variant="caption" color={selected ? colors.white : full ? colors.textSecondary : colors.success}>
                        {full ? t('book.full') : t('book.openCount', { count: d.open_slots })}
                      </Txt>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {days && !days.some(d => d.open_slots > 0) && (
              <Banner tone="info" icon="calendar" text={t('book.noOpenDays')} style={{ marginTop: space.md }} />
            )}

            {day && (
              <>
                <SectionTitle title={t('book.timeTitle')} style={styles.section} />
                {!slots ? <Skeleton height={100} r={12} /> : (
                  <View style={styles.slots}>
                    {slots.map(s => {
                      const selected = slot?.start === s.start;
                      return (
                        <Pressable key={s.start} onPress={() => setSlot(s)} accessibilityRole="button" accessibilityState={{ selected }}
                          style={[styles.slot, selected && styles.slotSelected]}>
                          <Txt variant="body" color={selected ? colors.white : colors.primaryDark} style={{ fontWeight: '700' }}>{formatTime(s.start)}</Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Button
          title={t('common.continue')}
          icon="arrow-forward"
          size="lg"
          disabled={!slot}
          onPress={() => navigation.navigate('BookDetails', { doctor, facility, slot })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  doctorCard: { flexDirection: 'row', alignItems: 'center' },
  section: { marginTop: space.xl },
  option: { minHeight: touch.large, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    padding: space.md, marginBottom: space.sm, borderWidth: 2, borderColor: colors.border },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  day: { width: 72, paddingVertical: space.sm, marginRight: space.sm, borderRadius: radius.md, alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  slot: { minWidth: 84, minHeight: touch.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.primaryMuted, backgroundColor: colors.card },
  slotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
