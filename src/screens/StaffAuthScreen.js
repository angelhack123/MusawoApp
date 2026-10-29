// Doctors & facility owners: sign in, or create an account (approved by Musawo before use).
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { useStaffSession } from '../state/StaffSession';
import AppBar from '../components/AppBar';
import { Banner, Button, Txt } from '../components/ui';

function Field({ label, ...props }) {
  return (
    <View style={{ marginTop: space.lg }}>
      <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '700', marginBottom: 6 }}>{label}</Txt>
      <TextInput style={styles.input} placeholderTextColor={colors.placeholder} accessibilityLabel={label} {...props} />
    </View>
  );
}

export default function StaffAuthScreen({ navigation }) {
  const t = useAppState().t;
  const session = useStaffSession();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('DOCTOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reg, setReg] = useState('');
  const [busy, setBusy] = useState(false);

  const done = () => navigation.replace('StaffHome');

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'login') {
        await session.login(email, password);
      } else {
        await session.register({ email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim(), role,
          registration_number: role === 'DOCTOR' ? reg.trim() : '' });
      }
      done();
    } catch (err) {
      Alert.alert(mode === 'login' ? t('staff.loginFailed') : t('staff.registerFailed'), err.offline ? t('common.offline') : err.message);
    } finally {
      setBusy(false);
    }
  };

  const valid = mode === 'login'
    ? email.includes('@') && password.length >= 1
    : email.includes('@') && password.length >= 8 && fullName.trim().length >= 3 && (role !== 'DOCTOR' || reg.trim().length >= 3);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBar title={t('staff.title')} subtitle={t('staff.subtitle')} onBack={() => navigation.goBack()}>
        <View style={styles.tabs}>
          {['login', 'register'].map(m => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.tab, mode === m && styles.tabActive]} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}>
              <Txt variant="label" color={mode === m ? colors.primaryDark : colors.white} style={{ fontWeight: '700' }}>{t(`staff.${m}`)}</Txt>
            </Pressable>
          ))}
        </View>
      </AppBar>

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
        {mode === 'register' && (
          <>
            <Txt variant="h3" color={colors.primaryDark}>{t('staff.iAm')}</Txt>
            <View style={styles.roles}>
              {[['DOCTOR', 'medkit'], ['FACILITY_OWNER', 'business']].map(([r, icon]) => {
                const selected = role === r;
                return (
                  <Pressable key={r} onPress={() => setRole(r)} accessibilityRole="radio" accessibilityState={{ checked: selected }}
                    style={[styles.role, selected && styles.roleSelected]}>
                    <Ionicons name={icon} size={32} color={selected ? colors.white : colors.primary} />
                    <Txt variant="body" color={selected ? colors.white : colors.text} style={{ fontWeight: '700', marginTop: space.sm, textAlign: 'center' }}>
                      {t(`staff.roles.${r}`)}
                    </Txt>
                    <Txt variant="caption" color={selected ? 'rgba(255,255,255,0.85)' : colors.textSecondary} style={{ textAlign: 'center', marginTop: 2 }}>
                      {t(`staff.roles.${r}_hint`)}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
            <Field label={t('staff.fullName')} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            {role === 'DOCTOR' && (
              <Field label={t('staff.regNumber')} value={reg} onChangeText={v => setReg(v.toUpperCase())} autoCapitalize="characters" placeholder="K1234" />
            )}
            <Field label={t('book.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0772 123456" />
          </>
        )}

        <Field label={t('staff.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label={t('staff.password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"
          placeholder={mode === 'register' ? t('staff.passwordHint') : undefined} />

        {mode === 'register' && (
          <Banner tone="info" icon="shield-checkmark" text={t('staff.approvalNote')} style={{ marginTop: space.lg }} />
        )}

        <Button title={t(mode === 'login' ? 'staff.signIn' : 'staff.createAccount')} icon={mode === 'login' ? 'log-in' : 'person-add'}
          size="lg" onPress={submit} loading={busy} disabled={!valid} style={{ marginTop: space.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', marginTop: space.md, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: 4 },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.white },
  roles: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  role: { flex: 1, alignItems: 'center', padding: space.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card },
  roleSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  input: { minHeight: touch.large, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: space.md,
    fontSize: 16, color: colors.text, backgroundColor: colors.card },
});
