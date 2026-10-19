// "Know your rights" — Patient Rights and Responsibilities Charter summary (PRD Appendix A, Goal G4).
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import AppBar from '../components/AppBar';
import { Button, Card, IconCircle, Txt } from '../components/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RIGHTS = [
  { key: 'respect', icon: 'heart' },
  { key: 'information', icon: 'chatbubbles' },
  { key: 'consent', icon: 'hand-left' },
  { key: 'privacy', icon: 'lock-closed' },
  { key: 'refuse', icon: 'close-circle' },
  { key: 'complain', icon: 'megaphone' },
];

export default function PatientRightsScreen({ navigation }) {
  const t = useAppState().t;
  const [open, setOpen] = useState('respect');

  const toggle = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === key ? null : key);
  };

  return (
    <View style={styles.container}>
      <AppBar title={t('rights.title')} subtitle={t('rights.subtitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}>
        <Txt variant="body" color={colors.textSecondary} style={{ marginBottom: space.lg }}>{t('rights.intro')}</Txt>
        {RIGHTS.map((r, i) => {
          const expanded = open === r.key;
          return (
            <Card key={r.key} style={[styles.card, expanded && styles.cardOpen]}>
              <Pressable onPress={() => toggle(r.key)} style={styles.head} accessibilityRole="button" accessibilityState={{ expanded }}>
                <IconCircle icon={r.icon} size={44} color={expanded ? colors.white : colors.primary} bg={expanded ? colors.primary : colors.primaryLight} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Txt variant="caption" color={colors.textSecondary}>{t('rights.number', { n: i + 1 })}</Txt>
                  <Txt variant="body" style={{ fontWeight: '700' }}>{t(`rights.items.${r.key}.title`)}</Txt>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.neutral} />
              </Pressable>
              {expanded && (
                <View style={styles.bodyText}>
                  <Txt variant="body">{t(`rights.items.${r.key}.body`)}</Txt>
                  <View style={styles.example}>
                    <Ionicons name="bulb" size={18} color={colors.warningText} />
                    <Txt variant="label" color={colors.warningText} style={{ flex: 1, marginLeft: space.sm, fontWeight: '500' }}>
                      {t(`rights.items.${r.key}.example`)}
                    </Txt>
                  </View>
                </View>
              )}
            </Card>
          );
        })}
        <Card style={styles.cta}>
          <Txt variant="h3" color={colors.white}>{t('rights.ctaTitle')}</Txt>
          <Txt variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 4, marginBottom: space.lg }}>{t('rights.ctaBody')}</Txt>
          <Button title={t('home.feedbackTitle')} variant="secondary" icon="chatbubble-ellipses" onPress={() => navigation.navigate('Feedback')} style={{ borderColor: colors.white }} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { marginBottom: space.md, padding: space.md },
  cardOpen: { borderWidth: 1, borderColor: colors.primaryMuted },
  head: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  bodyText: { marginTop: space.md, paddingLeft: space.xs },
  example: { flexDirection: 'row', alignItems: 'flex-start', marginTop: space.md, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.warningBg },
  cta: { marginTop: space.lg, backgroundColor: colors.primaryDark, borderRadius: radius.lg },
});
