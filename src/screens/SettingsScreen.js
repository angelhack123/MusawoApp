// SCR-013: language, home district, notifications (US-5.3), about/legal pages, local data.
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { useStaffSession } from '../state/StaffSession';
import { ReferenceAPI } from '../api/musawo';
import { storage } from '../utils/storage';
import { APP_VERSION } from '../config';
import AppBar from '../components/AppBar';
import { SelectSheet } from '../components/Sheet';
import { Card, IconCircle, Txt } from '../components/ui';

function Row({ icon, label, value, onPress, right, danger, last, sub }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      android_ripple={{ color: colors.primaryLight }}
      style={[styles.row, !last && styles.divider]}
    >
      <IconCircle icon={icon} size={36} color={danger ? colors.dangerText : colors.primary} bg={danger ? colors.dangerBg : colors.primaryLight} />
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Txt variant="body" color={danger ? colors.dangerText : colors.text} style={{ fontWeight: '600' }}>{label}</Txt>
        {sub ? <Txt variant="caption" color={colors.textSecondary}>{sub}</Txt> : null}
      </View>
      {value ? <Txt variant="label" color={colors.textSecondary} style={{ marginRight: space.sm }}>{value}</Txt> : null}
      {right || (onPress ? <Ionicons name="chevron-forward" size={20} color={colors.placeholder} /> : null)}
    </Pressable>
  );
}

function Group({ title, children }) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <Txt variant="label" color={colors.textSecondary} style={styles.groupTitle}>{title.toUpperCase()}</Txt>
      <Card style={{ padding: 0, overflow: 'hidden' }}>{children}</Card>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { t, settings, updateSettings, resetSettings } = useAppState();
  const staff = useStaffSession();
  const [districts, setDistricts] = useState([]);
  const [sheet, setSheet] = useState(false);

  useEffect(() => { ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {}); }, []);

  const toggle = (key) => (value) => updateSettings({ [key]: value });
  const switchProps = { trackColor: { true: colors.primary, false: colors.border }, thumbColor: colors.white };

  const clearHistory = () => Alert.alert(t('settings.clearHistory'), t('settings.clearHistoryConfirm'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('settings.clear'), style: 'destructive', onPress: () => storage.clearSearchHistory() },
  ]);

  const resetAll = () => Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('settings.reset'),
      style: 'destructive',
      onPress: async () => {
        await storage.clearAll();
        await resetSettings();
        Alert.alert(t('settings.resetDoneTitle'), t('settings.resetDone'));
      },
    },
  ]);

  return (
    <View style={styles.container}>
      <AppBar title={t('settings.title')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}>
        <Group title={t('settings.preferences')}>
          <Row icon="language" label={t('settings.language')} value={settings.lang === 'lg' ? 'Luganda' : 'English'} onPress={() => navigation.navigate('Language')} />
          <Row icon="location" label={t('settings.homeDistrict')} value={settings.homeDistrict?.name || t('settings.notSet')} onPress={() => setSheet(true)} last />
        </Group>

        <Group title={t('settings.notifications')}>
          <Row icon="notifications" label={t('settings.push')} sub={t('settings.pushSub')}
            right={<Switch value={settings.pushNotif} onValueChange={toggle('pushNotif')} {...switchProps} accessibilityLabel={t('settings.push')} />} />
          <Row icon="chatbox" label={t('settings.sms')} sub={t('settings.smsSub')} last
            right={<Switch value={settings.smsNotif} onValueChange={toggle('smsNotif')} {...switchProps} accessibilityLabel={t('settings.sms')} />} />
        </Group>

        <Group title={t('settings.healthWorkers')}>
          <Row icon="medkit" label={staff.signedIn ? t('home.workspace') : t('staff.title')}
            sub={staff.signedIn ? staff.profile.email : t('home.healthWorkerHint')}
            onPress={() => navigation.navigate(staff.signedIn ? 'StaffHome' : 'StaffAuth')} last />
        </Group>

        <Group title={t('settings.learn')}>
          <Row icon="ribbon" label={t('rights.title')} onPress={() => navigation.navigate('PatientRights')} last />
        </Group>

        <Group title={t('settings.about')}>
          <Row icon="information-circle" label={t('info.about.title')} onPress={() => navigation.navigate('InfoPage', { page: 'about' })} />
          <Row icon="shield" label={t('info.privacy.title')} onPress={() => navigation.navigate('InfoPage', { page: 'privacy' })} />
          <Row icon="document-text" label={t('info.terms.title')} onPress={() => navigation.navigate('InfoPage', { page: 'terms' })} />
          <Row icon="mail" label={t('info.contact.title')} onPress={() => navigation.navigate('InfoPage', { page: 'contact' })} last />
        </Group>

        <Group title={t('settings.data')}>
          <Row icon="time" label={t('settings.clearHistory')} onPress={clearHistory} />
          <Row icon="trash" label={t('settings.resetAll')} sub={t('settings.resetHint')} onPress={resetAll} danger last />
        </Group>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
          <Txt variant="label" color={colors.primaryDark} style={{ fontWeight: '700', marginTop: space.xs }}>Musawo v{APP_VERSION}</Txt>
          <Txt variant="caption" color={colors.textSecondary}>Trust But Verify • GHE Consulting</Txt>
        </View>
      </ScrollView>

      <SelectSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={t('settings.homeDistrict')}
        searchPlaceholder={t('filters.searchDistrict')}
        allLabel={t('settings.notSet')}
        options={districts.map(d => ({ value: d.id, label: d.name, group: t(`regions.${d.region}`) }))}
        selected={settings.homeDistrict?.id}
        onSelect={(id) => updateSettings({ homeDistrict: id ? { id, name: districts.find(d => d.id === id)?.name } : null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  groupTitle: { fontWeight: '700', letterSpacing: 0.8, marginBottom: space.sm, marginLeft: space.xs },
  row: { minHeight: touch.large + 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  footer: { alignItems: 'center', marginTop: space.md, padding: space.lg, borderRadius: radius.md },
});
