// Patient: name, phone and a short description of the condition, then send the request.
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { BookingAPI } from '../api/booking';
import { storage } from '../utils/storage';
import { formatSlot, formatUGX } from '../utils/format';
import AppBar from '../components/AppBar';
import { Banner, Button, Card, InfoRow, Txt } from '../components/ui';

const CONDITION_MAX = 300;

export default function BookDetailsScreen({ navigation, route }) {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  const { doctor, facility, slot } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [condition, setCondition] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storage.getPatientContact().then(c => { if (c) { setName(c.name || ''); setPhone(c.phone || ''); } });
  }, []);

  const valid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9 && condition.trim().length >= 5;

  const submit = async () => {
    setSaving(true);
    try {
      const booking = await BookingAPI.create({
        doctor_id: doctor.id,
        facility_id: facility.id,
        start: slot.start,
        patient_name: name.trim(),
        patient_phone: phone.trim(),
        condition_summary: condition.trim(),
      });
      storage.savePatientContact({ name: name.trim(), phone: phone.trim() });
      navigation.replace('BookingDone', { booking });
    } catch (err) {
      if (err.status === 409) {
        Alert.alert(t('book.slotGoneTitle'), err.message, [{ text: t('book.pickAnother'), onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert(t('common.errorTitle'), err.offline ? t('common.offline') : err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBar title={t('book.detailsTitle')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Card style={{ paddingVertical: space.xs }}>
          <InfoRow icon="person" label={t('book.doctor')} value={doctor.full_name} />
          <InfoRow icon="business" label={t('feedback.facility')} value={facility.name} />
          <InfoRow icon="time" label={t('book.when')} value={formatSlot(slot.start)} />
          <InfoRow icon="cash" label={t('book.fee')} value={formatUGX(facility.consultation_fee) || t('book.feeOnRequest')} last />
        </Card>

        <Txt variant="h3" color={colors.primaryDark} style={styles.label}>{t('book.yourName')}</Txt>
        <TextInput value={name} onChangeText={setName} placeholder={t('book.namePlaceholder')} placeholderTextColor={colors.placeholder}
          style={styles.input} autoCapitalize="words" accessibilityLabel={t('book.yourName')} />

        <Txt variant="h3" color={colors.primaryDark} style={styles.label}>{t('book.phone')}</Txt>
        <TextInput value={phone} onChangeText={setPhone} placeholder="0772 123456" placeholderTextColor={colors.placeholder}
          style={styles.input} keyboardType="phone-pad" accessibilityLabel={t('book.phone')} />
        <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>{t('book.phoneHint')}</Txt>

        <Txt variant="h3" color={colors.primaryDark} style={styles.label}>{t('book.condition')}</Txt>
        <View>
          <TextInput value={condition} onChangeText={setCondition} placeholder={t('book.conditionPlaceholder')} placeholderTextColor={colors.placeholder}
            style={[styles.input, styles.textArea]} multiline maxLength={CONDITION_MAX} accessibilityLabel={t('book.condition')} />
          <Txt variant="caption" color={colors.textSecondary} style={styles.counter}>{condition.length}/{CONDITION_MAX}</Txt>
        </View>

        <Banner tone="info" icon="lock-closed" title={t('book.privacyTitle')} text={t('book.privacyBody')} style={{ marginTop: space.lg }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Button title={t('book.send')} icon="send" size="lg" onPress={submit} loading={saving} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { marginTop: space.xl, marginBottom: space.sm },
  input: { minHeight: touch.large, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: space.md,
    fontSize: 16, color: colors.text, backgroundColor: colors.card },
  textArea: { minHeight: 110, paddingTop: space.md, paddingBottom: space.xl, textAlignVertical: 'top' },
  counter: { position: 'absolute', right: space.md, bottom: space.sm },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
