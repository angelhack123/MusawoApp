// SCR-014: radio list; the change applies immediately (US-5.2).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import AppBar from '../components/AppBar';
import { Banner, Card, Txt } from '../components/ui';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'lg', name: 'Luganda', native: 'Oluganda' },
];

export default function LanguageScreen({ navigation }) {
  const { t, settings, updateSettings } = useAppState();
  return (
    <View style={styles.container}>
      <AppBar title={t('settings.language')} onBack={() => navigation.goBack()} rounded={false} />
      <View style={{ padding: space.lg }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {LANGUAGES.map((l, i) => {
            const selected = settings.lang === l.code;
            return (
              <Pressable
                key={l.code}
                onPress={() => updateSettings({ lang: l.code })}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                android_ripple={{ color: colors.primaryLight }}
                style={[styles.row, i < LANGUAGES.length - 1 && styles.divider, selected && { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={26} color={selected ? colors.primary : colors.placeholder} />
                <View style={{ marginLeft: space.md }}>
                  <Txt variant="bodyLg" style={{ fontWeight: selected ? '700' : '400' }}>{l.name}</Txt>
                  <Txt variant="caption" color={colors.textSecondary}>{l.native}</Txt>
                </View>
              </Pressable>
            );
          })}
        </Card>
        {settings.lang === 'lg' && (
          <Banner tone="info" icon="construct" text={t('settings.luganda.pending')} style={{ marginTop: space.lg }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { minHeight: touch.large + 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
