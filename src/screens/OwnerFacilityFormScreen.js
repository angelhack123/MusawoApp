// Facility owner: register a facility (unverified until Musawo checks it) or edit its details.
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { StaffAPI } from '../api/booking';
import { ReferenceAPI } from '../api/musawo';
import { FACILITY_TYPES } from '../utils/status';
import AppBar from '../components/AppBar';
import { SelectSheet } from '../components/Sheet';
import { Banner, Button, Chip, Txt } from '../components/ui';

const OWNERSHIP = ['PUBLIC', 'PRIVATE', 'NGO', 'PNFP'];

export default function OwnerFacilityFormScreen({ navigation, route }) {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  const existing = route.params?.facility;
  const [name, setName] = useState(existing?.name || '');
  const [type, setType] = useState(existing?.type || null);
  const [ownership, setOwnership] = useState(existing?.ownership || null);
  const [district, setDistrict] = useState(existing ? { id: existing.district_id, name: existing.district_name } : null);
  const [subcounty, setSubcounty] = useState(existing?.subcounty || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [districts, setDistricts] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true);
    const payload = { name: name.trim(), type, ownership, district_id: district.id, subcounty: subcounty.trim() || null,
      address: address.trim() || null, phone: phone.trim() || null };
    try {
      if (existing) {
        await StaffAPI.updateFacility(existing.id, payload);
        navigation.goBack(); // The facility screen reloads on focus
      } else {
        const saved = await StaffAPI.createFacility(payload);
        navigation.replace('OwnerFacility', { id: saved.id });
      }
    } catch (err) {
      Alert.alert(t('common.errorTitle'), err.offline ? t('common.offline') : err.message);
    } finally {
      setSaving(false);
    }
  };

  const valid = name.trim().length >= 3 && type && ownership && district;
  const input = (label, value, onChange, props = {}) => (
    <View style={{ marginTop: space.lg }}>
      <Txt variant="label" color={colors.textSecondary} style={styles.label}>{label}</Txt>
      <TextInput value={value} onChangeText={onChange} style={styles.input} placeholderTextColor={colors.placeholder} accessibilityLabel={label} {...props} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBar title={existing ? t('staff.editFacility') : t('staff.registerFacility')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {!existing && <Banner tone="info" icon="shield-checkmark" text={t('staff.facilityReview')} />}
        {input(t('feedback.manualName'), name, setName, { autoCapitalize: 'words' })}

        <Txt variant="label" color={colors.textSecondary} style={[styles.label, { marginTop: space.lg }]}>{t('feedback.manualType')}</Txt>
        <View style={styles.wrap}>
          {FACILITY_TYPES.map(ft => <Chip key={ft} label={t(`facilityTypes.${ft}`)} selected={type === ft} onPress={() => setType(ft)} />)}
        </View>

        <Txt variant="label" color={colors.textSecondary} style={[styles.label, { marginTop: space.md }]}>{t('facility.ownership')}</Txt>
        <View style={styles.wrap}>
          {OWNERSHIP.map(o => <Chip key={o} label={t(`staff.ownership.${o}`)} selected={ownership === o} onPress={() => setOwnership(o)} />)}
        </View>

        <Txt variant="label" color={colors.textSecondary} style={[styles.label, { marginTop: space.md }]}>{t('facility.district')}</Txt>
        <Pressable onPress={() => setSheet(true)} style={[styles.input, styles.select]} accessibilityRole="button">
          <Txt variant="body" color={district ? colors.text : colors.placeholder} style={{ flex: 1 }}>{district?.name || t('onboarding.chooseDistrict')}</Txt>
          <Ionicons name="chevron-down" size={20} color={colors.neutral} />
        </Pressable>

        {input(t('staff.subcounty'), subcounty, setSubcounty)}
        {input(t('facility.address'), address, setAddress)}
        {input(t('facility.phone'), phone, setPhone, { keyboardType: 'phone-pad' })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Button title={existing ? t('staff.save') : t('staff.registerFacility')} icon="checkmark" size="lg" onPress={save} loading={saving} disabled={!valid} />
      </View>

      <SelectSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={t('filters.district')}
        searchPlaceholder={t('filters.searchDistrict')}
        options={districts.map(d => ({ value: d.id, label: d.name, group: t(`regions.${d.region}`) }))}
        selected={district?.id}
        onSelect={(id) => setDistrict({ id, name: districts.find(d => d.id === id)?.name })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: '700', marginBottom: 6 },
  input: { minHeight: touch.large, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: space.md,
    fontSize: 16, color: colors.text, backgroundColor: colors.card },
  select: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
