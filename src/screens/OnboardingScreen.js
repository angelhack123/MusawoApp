// SCR-002a–c onboarding + US-5.1 first-time setup (language, home district, DPPA consent).
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { ReferenceAPI } from '../api/musawo';
import { Decor } from '../components/AppBar';
import { Button, Card, Txt } from '../components/ui';
import { SelectSheet } from '../components/Sheet';

const SLIDES = [
  { key: 'verify', icon: 'medical', badge: 'checkmark-circle', badgeColor: colors.success },
  { key: 'voice', icon: 'chatbubble-ellipses', badge: 'heart', badgeColor: '#F43F5E' },
  { key: 'track', icon: 'git-network', badge: 'checkmark-done-circle', badgeColor: colors.primary },
];

function Illustration({ icon, badge, badgeColor }) {
  return (
    <View style={styles.illo}>
      <View style={styles.illoRingOuter}>
        <View style={styles.illoRingInner}>
          <Ionicons name={icon} size={88} color={colors.white} />
        </View>
      </View>
      <View style={styles.illoBadge}>
        <Ionicons name={badge} size={44} color={badgeColor} />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { t, settings, updateSettings } = useAppState();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [setup, setSetup] = useState(false);
  const [lang, setLang] = useState(settings.lang);
  const [district, setDistrict] = useState(settings.homeDistrict);
  const [districts, setDistricts] = useState([]);
  const [districtSheet, setDistrictSheet] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {});
  }, []);

  const next = () => {
    if (index < SLIDES.length - 1) listRef.current?.scrollToIndex({ index: index + 1 });
    else setSetup(true);
  };

  const finish = () => updateSettings({ lang, homeDistrict: district, consented: true, onboarded: true });

  if (setup) {
    return (
      <View style={[styles.setup, { paddingTop: insets.top + space.lg }]}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}>
          <Txt variant="h1" color={colors.primaryDark} accessibilityRole="header">{t('onboarding.setupTitle')}</Txt>
          <Txt variant="body" color={colors.textSecondary} style={{ marginTop: space.xs, marginBottom: space.xl }}>{t('onboarding.setupBody')}</Txt>

          <Txt variant="h3" color={colors.primaryDark} style={styles.label}>{t('settings.language')}</Txt>
          <Card style={{ padding: 0 }}>
            {[['en', 'English'], ['lg', 'Luganda']].map(([code, name], i) => (
              <Pressable
                key={code}
                onPress={() => { setLang(code); updateSettings({ lang: code }); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: lang === code }}
                style={[styles.radioRow, i === 0 && styles.divider]}
              >
                <Txt variant="body" style={{ flex: 1, fontWeight: lang === code ? '700' : '400' }}>{name}</Txt>
                <Ionicons name={lang === code ? 'radio-button-on' : 'radio-button-off'} size={24} color={lang === code ? colors.primary : colors.placeholder} />
              </Pressable>
            ))}
          </Card>

          <Txt variant="h3" color={colors.primaryDark} style={styles.label}>{t('settings.homeDistrict')}</Txt>
          <Card onPress={() => setDistrictSheet(true)} style={styles.selectRow}>
            <Ionicons name="location" size={22} color={colors.primary} />
            <Txt variant="body" style={{ flex: 1, marginLeft: space.md }} color={district ? colors.text : colors.placeholder}>
              {district?.name || t('onboarding.chooseDistrict')}
            </Txt>
            <Ionicons name="chevron-down" size={20} color={colors.neutral} />
          </Card>
          <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: 6 }}>{t('onboarding.districtHint')}</Txt>

          <Pressable
            onPress={() => setConsent(c => !c)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            style={styles.consent}
          >
            <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={28} color={consent ? colors.primary : colors.neutral} />
            <View style={{ flex: 1, marginLeft: space.md }}>
              <Txt variant="label" style={{ fontWeight: '700' }}>{t('onboarding.consentTitle')}</Txt>
              <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400', marginTop: 2 }}>{t('onboarding.consentBody')}</Txt>
            </View>
          </Pressable>

          <Button title={t('onboarding.getStarted')} onPress={finish} disabled={!consent} size="lg" icon="arrow-forward" style={{ marginTop: space.xl }} />
        </ScrollView>

        <SelectSheet
          visible={districtSheet}
          onClose={() => setDistrictSheet(false)}
          title={t('settings.homeDistrict')}
          searchPlaceholder={t('filters.searchDistrict')}
          allLabel={t('onboarding.skipDistrict')}
          options={districts.map(d => ({ value: d.id, label: d.name, group: t(`regions.${d.region}`) }))}
          selected={district?.id}
          onSelect={(id) => setDistrict(id ? { id, name: districts.find(d => d.id === id)?.name } : null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Decor variant="hero" />
      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <Button variant="text" title={t('onboarding.skip')} onPress={() => setSetup(true)} style={styles.skip} />
      </View>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={s => s.key}
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Illustration {...item} />
            <Txt variant="h1" color={colors.white} style={styles.slideTitle}>{t(`onboarding.${item.key}Title`)}</Txt>
            <Txt variant="bodyLg" color="rgba(255,255,255,0.85)" style={styles.slideBody}>{t(`onboarding.${item.key}Body`)}</Txt>
          </View>
        )}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />)}
        </View>
        <Button
          title={index === SLIDES.length - 1 ? t('onboarding.getStarted') : t('common.next')}
          onPress={next}
          size="lg"
          variant="secondary"
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryDark, overflow: 'hidden' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.md },
  skip: { minWidth: 72 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl },
  illo: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: space.xxl },
  illoRingOuter: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  illoRingInner: { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  illoBadge: { position: 'absolute', right: 18, bottom: 18, width: 68, height: 68, borderRadius: 34, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  slideTitle: { textAlign: 'center', marginBottom: space.md },
  slideBody: { textAlign: 'center' },
  footer: { paddingHorizontal: space.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: space.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 4 },
  dotActive: { width: 28, backgroundColor: colors.white },
  nextBtn: { backgroundColor: colors.white, borderColor: colors.white },
  setup: { flex: 1, backgroundColor: colors.bg },
  label: { marginTop: space.lg, marginBottom: space.sm },
  radioRow: { minHeight: touch.large, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  selectRow: { flexDirection: 'row', alignItems: 'center', minHeight: touch.large },
  consent: { flexDirection: 'row', alignItems: 'flex-start', marginTop: space.xl, padding: space.lg, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});
