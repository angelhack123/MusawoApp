// SCR-011: look up a ticket (US-3.1), "My Complaints" (US-3.4), recently tracked tickets.
import React, { useCallback, useState } from 'react';
import { Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { FeedbackAPI, flushFeedbackQueue, syncMyTickets } from '../api/musawo';
import { storage } from '../utils/storage';
import { feedbackStatus } from '../utils/status';
import { formatDate } from '../utils/format';
import { TICKET_RE } from '../config';
import AppBar from '../components/AppBar';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import { Banner, Button, Card, SectionTitle, Txt } from '../components/ui';

// Accept "msw2026000123" or "MSW-2026-000123"
const normaliseTicket = (raw) => {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = /^MSW(\d{4})(\d{6})$/.exec(clean);
  return m ? `MSW-${m[1]}-${m[2]}` : raw.trim().toUpperCase();
};

export function StatusPill({ status }) {
  const t = useAppState().t;
  const s = feedbackStatus(status);
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={14} color={s.color} />
      <Txt variant="caption" color={s.color} style={{ marginLeft: 4, fontWeight: '700' }}>{t(`feedbackStatus.${s.key}`)}</Txt>
    </View>
  );
}

function TicketRow({ ticket, onPress, updated }) {
  const t = useAppState().t;
  return (
    <Card onPress={onPress} style={styles.ticketRow} accessibilityLabel={ticket.ticket_number}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt variant="body" style={styles.mono}>{ticket.ticket_number}</Txt>
          {updated ? <View style={styles.newDot}><Txt variant="caption" color={colors.white} style={{ fontWeight: '700' }}>{t('track.updated')}</Txt></View> : null}
        </View>
        <Txt variant="label" color={colors.textSecondary} numberOfLines={1} style={{ fontWeight: '400', marginTop: 2 }}>
          {[ticket.facility?.name, formatDate(ticket.submitted_at || ticket.at)].filter(Boolean).join(' • ')}
        </Txt>
      </View>
      {ticket.status ? <StatusPill status={ticket.status} /> : null}
      <Ionicons name="chevron-forward" size={20} color={colors.placeholder} style={{ marginLeft: space.sm }} />
    </Card>
  );
}

export default function TrackScreen({ navigation }) {
  const t = useAppState().t;
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [mine, setMine] = useState([]);
  const [tracked, setTracked] = useState([]);
  const [queued, setQueued] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await flushFeedbackQueue();
    const [{ tickets }, recent, queue] = await Promise.all([syncMyTickets(), storage.getTrackedTickets(), storage.getFeedbackQueue()]);
    setMine(tickets);
    setTracked(recent.filter(r => !tickets.some(m => m.ticket_number === r.ticket_number)));
    setQueued(queue.length);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const check = async () => {
    Keyboard.dismiss();
    const ticket = normaliseTicket(input);
    if (!TICKET_RE.test(ticket)) {
      setError(t('track.invalid'));
      return;
    }
    setError(null);
    setChecking(true);
    try {
      const data = await FeedbackAPI.track(ticket);
      if (!data) {
        setError(t('track.notFound'));
        return;
      }
      await storage.addTrackedTicket({ ticket_number: data.ticket_number, status: data.status, facility: data.facility, submitted_at: data.submitted_at });
      setInput('');
      navigation.navigate('ComplaintDetail', { ticket: data.ticket_number, data });
    } catch (err) {
      setError(err.offline ? t('common.offline') : err.message);
    } finally {
      setChecking(false);
    }
  };

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.xxl }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      >
        <AppBar title={t('track.title')} subtitle={t('track.subtitle')}>
          <SearchInput
            value={input}
            onChangeText={(v) => { setInput(v.toUpperCase()); setError(null); }}
            placeholder={t('track.placeholder')}
            icon="receipt-outline"
            autoCapitalize="characters"
            maxLength={18}
            onSubmitEditing={check}
            error={error}
            style={{ marginTop: space.md }}
          />
          <Button title={t('track.check')} onPress={check} loading={checking} disabled={!input.trim()} variant="secondary" icon="search" size="lg" style={{ marginTop: space.md, borderColor: colors.white }} />
        </AppBar>

        <View style={styles.body}>
          {queued > 0 && <Banner tone="offline" title={t('home.queuedTitle', { count: queued })} text={t('home.queuedBody')} style={{ marginBottom: space.lg }} />}

          <SectionTitle title={t('track.myComplaints')} />
          {mine.length === 0 ? (
            <Card style={{ padding: 0 }}>
              <EmptyState icon="file-tray" title={t('track.noneTitle')} message={t('track.none')} actionLabel={t('home.feedbackTitle')} onAction={() => navigation.navigate('Feedback')} />
            </Card>
          ) : mine.map(ticket => (
            <TicketRow
              key={ticket.ticket_number}
              ticket={ticket}
              updated={ticket.lastSeenStatus && ticket.lastSeenStatus !== ticket.status}
              onPress={() => navigation.navigate('ComplaintDetail', { ticket: ticket.ticket_number })}
            />
          ))}

          {tracked.length > 0 && (
            <View style={{ marginTop: space.xl }}>
              <SectionTitle title={t('track.recentlyTracked')} />
              {tracked.map(ticket => (
                <TicketRow key={ticket.ticket_number} ticket={ticket}
                  onPress={() => navigation.navigate('ComplaintDetail', { ticket: ticket.ticket_number })} />
              ))}
            </View>
          )}

          <Card style={styles.howCard}>
            <Txt variant="h3" color={colors.primaryDark} style={{ marginBottom: space.md }}>{t('track.howTitle')}</Txt>
            {['received', 'review', 'resolved', 'escalated'].map(key => (
              <View key={key} style={styles.howRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Txt variant="label" style={{ flex: 1, marginLeft: space.sm, fontWeight: '400' }}>{t(`track.how.${key}`)}</Txt>
              </View>
            ))}
            <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: space.sm }}>{t('track.anonymousNote')}</Txt>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg },
  ticketRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md, minHeight: touch.large },
  mono: { fontWeight: '800', letterSpacing: 0.5, color: colors.primaryDark },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill },
  newDot: { marginLeft: space.sm, backgroundColor: colors.amber, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  howCard: { marginTop: space.xl, backgroundColor: colors.primaryLight },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.sm },
});
