// Doctor: consultation fee and weekly bookable hours per linked facility.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { StaffAPI } from '../api/booking';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { BottomSheet } from '../components/Sheet';
import { Banner, Button, Card, Chip, SectionTitle, Txt } from '../components/ui';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // Monday first, as stored by the backend
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const mins = 6 * 60 + i * 30; // 06:00 → 22:00
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
});
const SLOT_LENGTHS = [15, 20, 30, 45, 60];
const hhmm = (time) => time.slice(0, 5);

function FacilityHours({ link, rules, onChanged }) {
  const t = useAppState().t;
  const [fee, setFee] = useState(link.consultation_fee != null ? String(link.consultation_fee) : '');
  const [savingFee, setSavingFee] = useState(false);
  const [adding, setAdding] = useState(false);
  const [days, setDays] = useState([]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [slot, setSlot] = useState(30);
  const [busy, setBusy] = useState(false);

  const saveFee = async () => {
    setSavingFee(true);
    try { await StaffAPI.setFee(link.id, fee === '' ? null : Number(fee.replace(/\D/g, ''))); onChanged(); }
    catch (err) { Alert.alert(t('common.errorTitle'), err.message); }
    finally { setSavingFee(false); }
  };

  const addHours = async () => {
    setBusy(true);
    try {
      for (const weekday of days) {
        await StaffAPI.addAvailability({ facility_id: link.facility.id, weekday, start_time: start, end_time: end, slot_minutes: slot });
      }
      setAdding(false); setDays([]);
      onChanged();
    } catch (err) {
      Alert.alert(t('common.errorTitle'), err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (rule) => Alert.alert(t('staff.removeHoursTitle'), t('staff.removeHoursBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('staff.remove'), style: 'destructive', onPress: () => StaffAPI.deleteAvailability(rule.id).then(onChanged) },
  ]);

  const toggle = (rule, value) => StaffAPI.updateAvailability(rule.id, { is_active: value }).then(onChanged)
    .catch(err => Alert.alert(t('common.errorTitle'), err.message));

  const feeChanged = fee !== (link.consultation_fee != null ? String(link.consultation_fee) : '');

  return (
    <Card style={{ marginBottom: space.lg }}>
      <Txt variant="h3" color={colors.primaryDark}>{link.facility.name}</Txt>
      <Txt variant="caption" color={colors.textSecondary}>{[link.facility.type_display, link.facility.district].filter(Boolean).join(' · ')}</Txt>

      <Txt variant="label" color={colors.textSecondary} style={styles.label}>{t('staff.feeLabel')}</Txt>
      <View style={styles.feeRow}>
        <Txt variant="body" style={{ fontWeight: '700', marginRight: space.sm }}>UGX</Txt>
        <TextInput value={fee} onChangeText={v => setFee(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="50000"
          placeholderTextColor={colors.placeholder} style={styles.feeInput} accessibilityLabel={t('staff.feeLabel')} />
        <Button title={t('staff.save')} onPress={saveFee} loading={savingFee} disabled={!feeChanged} style={{ minWidth: 90 }} />
      </View>

      <Txt variant="label" color={colors.textSecondary} style={styles.label}>{t('staff.weeklyHours')}</Txt>
      {rules.length === 0 ? (
        <Txt variant="body" color={colors.textSecondary}>{t('staff.noHours')}</Txt>
      ) : rules.map(r => (
        <View key={r.id} style={styles.rule}>
          <View style={{ flex: 1 }}>
            <Txt variant="body" style={{ fontWeight: '700', opacity: r.is_active ? 1 : 0.5 }}>{t(`staff.days.${r.weekday}`)}</Txt>
            <Txt variant="caption" color={colors.textSecondary}>{hhmm(r.start_time)}–{hhmm(r.end_time)} · {t('staff.slotLength', { minutes: r.slot_minutes })}</Txt>
          </View>
          <Switch value={r.is_active} onValueChange={v => toggle(r, v)} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
          <Pressable onPress={() => remove(r)} hitSlop={10} style={styles.delete} accessibilityRole="button" accessibilityLabel={t('staff.remove')}>
            <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
          </Pressable>
        </View>
      ))}
      <Button title={t('staff.addHours')} icon="add" variant="secondary" onPress={() => setAdding(true)} style={{ marginTop: space.md }} />

      <BottomSheet visible={adding} onClose={() => setAdding(false)} title={t('staff.addHoursAt', { facility: link.facility.name })} fullHeight>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.lg }}>
          <Txt variant="label" color={colors.textSecondary} style={styles.label}>{t('staff.whichDays')}</Txt>
          <View style={styles.wrap}>
            {WEEKDAYS.map(d => (
              <Chip key={d} label={t(`staff.days.${d}`)} selected={days.includes(d)}
                onPress={() => setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))} />
            ))}
          </View>
          <Txt variant="label" color={colors.textSecondary} style={styles.label}>{t('staff.from')}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TIMES.slice(0, -1).map(tm => <Chip key={tm} label={tm} selected={start === tm} onPress={() => { setStart(tm); if (end <= tm) setEnd(TIMES[TIMES.indexOf(tm) + 1]); }} />)}
          </ScrollView>
          <Txt variant="label" color={colors.textSecondary} style={styles.label}>{t('staff.to')}</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TIMES.filter(tm => tm > start).map(tm => <Chip key={tm} label={tm} selected={end === tm} onPress={() => setEnd(tm)} />)}
          </ScrollView>
          <Txt variant="label" color={colors.textSecondary} style={styles.label}>{t('staff.eachAppointment')}</Txt>
          <View style={styles.wrap}>
            {SLOT_LENGTHS.map(m => <Chip key={m} label={t('staff.slotLength', { minutes: m })} selected={slot === m} onPress={() => setSlot(m)} />)}
          </View>
          <Button title={t('staff.saveHours')} icon="checkmark" size="lg" onPress={addHours} loading={busy} disabled={days.length === 0}
            style={{ marginTop: space.lg }} />
        </ScrollView>
      </BottomSheet>
    </Card>
  );
}

export default function AvailabilityScreen({ navigation }) {
  const t = useAppState().t;
  const [links, setLinks] = useState(null);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [l, r] = await Promise.all([StaffAPI.myFacilities(), StaffAPI.availability()]);
      setLinks(l); setRules(r); setError(null);
    } catch (err) {
      setError(err.offline ? t('common.offline') : err.message);
      setLinks(prev => prev || []);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <AppBar title={t('staff.hoursAndFees')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
        <Banner tone="info" icon="information-circle" text={t('staff.hoursIntro')} style={{ marginBottom: space.lg }} />
        {error ? <Banner tone="offline" text={error} style={{ marginBottom: space.md }} /> : null}
        {!links ? <SkeletonList count={2} /> : links.length === 0 ? (
          <EmptyState icon="business" title={t('staff.noLinksTitle')} message={t('staff.noLinks')} />
        ) : links.map(link => (
          <FacilityHours key={link.id} link={link} rules={rules.filter(r => r.facility_id === link.facility.id)} onChanged={load} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: '700', marginTop: space.lg, marginBottom: space.sm },
  feeRow: { flexDirection: 'row', alignItems: 'center' },
  feeInput: { flex: 1, minHeight: touch.min, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: space.md,
    fontSize: 16, color: colors.text, marginRight: space.sm },
  rule: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  delete: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
