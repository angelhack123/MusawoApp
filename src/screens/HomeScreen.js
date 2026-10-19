// SCR-003: hub with two equally prominent actions + closed-loop updates.
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import { storage } from '../utils/storage';
import { flushFeedbackQueue, syncMyTickets } from '../api/musawo';
import { Decor } from '../components/AppBar';
import { Banner, Card, Chip, IconButton, IconCircle, PressableScale, SectionTitle, Txt } from '../components/ui';

function ActionCard({ icon, iconBg, title, subtitle, onPress, accent }) {
  return (
    <Card onPress={onPress} accent={accent} style={styles.action} accessibilityLabel={title}>
      <IconCircle icon={icon} size={64} iconSize={36} bg={iconBg} color={accent} />
      <View style={{ flex: 1, marginLeft: space.lg }}>
        <Txt variant="h2" color={colors.primaryDark}>{title}</Txt>
        <Txt variant="body" color={colors.textSecondary} style={{ marginTop: 2 }}>{subtitle}</Txt>
      </View>
      <View style={[styles.go, { backgroundColor: accent }]}>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </View>
    </Card>
  );
}

function Tile({ icon, label, onPress, color, bg, badge }) {
  return (
    <PressableScale onPress={onPress} style={styles.tile} accessibilityRole="button" accessibilityLabel={label}>
      <IconCircle icon={icon} size={44} color={color} bg={bg} />
      <Txt variant="label" style={styles.tileLabel} numberOfLines={2}>{label}</Txt>
      {badge ? <View style={styles.tileBadge}><Txt variant="caption" color={colors.white} style={{ fontWeight: '700' }}>{badge}</Txt></View> : null}
    </PressableScale>
  );
}

export default function HomeScreen({ navigation }) {
  const { t, settings } = useAppState();
  const insets = useSafeAreaInsets();
  const [recent, setRecent] = useState([]);
  const [updated, setUpdated] = useState([]);
  const [queued, setQueued] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [history] = await Promise.all([storage.getSearchHistory(), flushFeedbackQueue()]);
    setRecent(history.slice(0, 3));
    setQueued((await storage.getFeedbackQueue()).length);
    const sync = await syncMyTickets();
    setUpdated(sync.updated);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.white} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + space.sm }]}>
        <Decor variant="hero" />
        <View style={styles.appBar}>
          <View style={styles.logo}><Ionicons name="shield-checkmark" size={22} color={colors.primary} /></View>
          <Txt variant="h3" color={colors.white} style={styles.wordmark}>MUSAWO</Txt>
          <View style={{ flex: 1 }} />
          <IconButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} label={t('settings.title')} />
        </View>
        <Txt variant="h1" color={colors.white} style={{ marginTop: space.lg }} accessibilityRole="header">{t('home.greeting')}</Txt>
        <Txt variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>{t('home.prompt')}</Txt>
      </View>

      <View style={styles.body}>
        <ActionCard
          icon="shield-checkmark"
          iconBg={colors.primaryLight}
          accent={colors.primary}
          title={t('home.verifyTitle')}
          subtitle={t('home.verifySubtitle')}
          onPress={() => navigation.navigate('Verify')}
        />
        <ActionCard
          icon="chatbubble-ellipses"
          iconBg={colors.successBg}
          accent={colors.success}
          title={t('home.feedbackTitle')}
          subtitle={t('home.feedbackSubtitle')}
          onPress={() => navigation.navigate('Feedback')}
        />

        {updated.length > 0 && (
          <Banner
            tone="success"
            icon="notifications"
            title={t('home.updatesTitle', { count: updated.length })}
            text={t('home.updatesBody')}
            onPress={() => updated.length === 1
              ? navigation.navigate('ComplaintDetail', { ticket: updated[0].ticket_number })
              : navigation.navigate('Track')}
            style={styles.banner}
          />
        )}
        {queued > 0 && (
          <Banner tone="offline" title={t('home.queuedTitle', { count: queued })} text={t('home.queuedBody')} style={styles.banner} />
        )}

        <View style={styles.tiles}>
          <Tile icon="receipt" label={t('home.trackLink')} color={colors.info} bg={colors.infoBg}
            onPress={() => navigation.navigate('Track')} badge={updated.length || null} />
          <Tile icon="business" label={t('home.facilitiesLink')} color={colors.success} bg={colors.successBg}
            onPress={() => navigation.navigate('Facilities')} />
          <Tile icon="ribbon" label={t('home.rightsLink')} color="#B45309" bg={colors.warningBg}
            onPress={() => navigation.navigate('PatientRights')} />
        </View>

        {recent.length > 0 && (
          <View style={{ marginTop: space.xl }}>
            <SectionTitle title={t('home.recentSearches')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recent.map(item => (
                <Chip
                  key={item.term}
                  icon={item.mode === 'reg' ? 'card' : 'time'}
                  label={item.term}
                  onPress={() => navigation.navigate('Verify', { query: item.term, mode: item.mode, at: Date.now() })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <Card style={styles.rightsCard} onPress={() => navigation.navigate('PatientRights')}>
          <View style={{ flex: 1 }}>
            <Txt variant="label" color={colors.primaryMuted} style={{ fontWeight: '700', letterSpacing: 1 }}>{t('home.didYouKnow')}</Txt>
            <Txt variant="h3" color={colors.white} style={{ marginTop: 4 }}>{t('home.rightTeaser')}</Txt>
            <Txt variant="label" color="rgba(255,255,255,0.85)" style={{ marginTop: space.sm, fontWeight: '600' }}>
              {t('home.learnRights')} →
            </Txt>
          </View>
          <Ionicons name="hand-left" size={56} color="rgba(255,255,255,0.18)" />
        </Card>

        {settings.lang === 'lg' && (
          <Banner tone="info" icon="language" text={t('settings.luganda.pending')} style={styles.banner} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: space.lg,
    paddingBottom: 72,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  appBar: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  wordmark: { marginLeft: space.sm, letterSpacing: 3 },
  body: { paddingHorizontal: space.lg, marginTop: -52 },
  action: { minHeight: 140, flexDirection: 'row', alignItems: 'center', marginBottom: space.lg, borderRadius: radius.lg },
  go: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  banner: { marginBottom: space.lg },
  tiles: { flexDirection: 'row', gap: space.md },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: 'center',
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileLabel: { marginTop: space.sm, textAlign: 'center', fontWeight: '600' },
  tileBadge: { position: 'absolute', top: 8, right: 8, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  rightsCard: { marginTop: space.xl, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, marginBottom: space.lg },
});
