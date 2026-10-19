// SCR-012: ticket header, status timeline (US-3.1), resolution + rating (US-3.3), escalation details.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import { FeedbackAPI, markTicketSeen } from '../api/musawo';
import { storage } from '../utils/storage';
import { feedbackStatus } from '../utils/status';
import { formatDate, formatDateTime } from '../utils/format';
import AppBar from '../components/AppBar';
import Timeline from '../components/Timeline';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Banner, Button, Card, IconButton, InfoRow, Txt } from '../components/ui';
import { StatusPill } from './TrackScreen';

// What can still happen after each status (Received → Under Review → Resolved)
const NEXT_STAGES = {
  RECEIVED: ['UNDER_REVIEW', 'RESOLVED'],
  UNDER_REVIEW: ['RESOLVED'],
  ESCALATED: ['RESOLVED'],
  RESOLVED: [],
  CLOSED: [],
};
const TERMINAL = ['RESOLVED', 'CLOSED'];

export const buildTimeline = (fb, t) => {
  let history = [...(fb.status_history || [])].sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  if (!history.length) history = [{ status: 'RECEIVED', changed_at: fb.submitted_at }];
  if (history[history.length - 1].status !== fb.status) history.push({ status: fb.status, changed_at: null });
  // Collapse repeated consecutive statuses
  history = history.filter((h, i) => i === 0 || h.status !== history[i - 1].status);

  const lastIndex = history.length - 1;
  const done = history.map((h, i) => {
    const s = feedbackStatus(h.status);
    const showNote = h.note && h.status !== 'RECEIVED' && !/^Bulk /.test(h.note);
    return {
      key: `${h.status}-${i}`,
      label: t(`feedbackStatus.${s.key}`),
      date: formatDateTime(h.changed_at),
      description: showNote ? h.note : t(`feedbackStatus.${s.key}Desc`),
      state: i === lastIndex && !TERMINAL.includes(h.status) ? 'current' : 'done',
      color: s.color,
    };
  });
  const future = (NEXT_STAGES[fb.status] || []).map(status => {
    const s = feedbackStatus(status);
    return { key: `future-${status}`, label: t(`feedbackStatus.${s.key}`), description: t(`feedbackStatus.${s.key}Desc`), state: 'future' };
  });
  return [...done, ...future];
};

export default function ComplaintDetailScreen({ navigation, route }) {
  const t = useAppState().t;
  const { ticket } = route.params;
  const [data, setData] = useState(route.params.data || null);
  const [loading, setLoading] = useState(!route.params.data);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rating, setRating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const fb = await FeedbackAPI.track(ticket);
      if (!fb) { setError(t('track.notFound')); return; }
      setData(fb);
      setError(null);
      markTicketSeen(fb);
      storage.addTrackedTicket({ ticket_number: fb.ticket_number, status: fb.status, facility: fb.facility, submitted_at: fb.submitted_at });
    } catch (err) {
      setError(err.offline ? t('common.offline') : err.message);
    } finally {
      setLoading(false);
    }
  }, [ticket, t]);

  useEffect(() => { load(); }, [load]);

  const rate = async (satisfied) => {
    setRating(true);
    try {
      setData(await FeedbackAPI.rate(ticket, satisfied));
    } catch (err) {
      Alert.alert(t('common.errorTitle'), err.message);
    } finally {
      setRating(false);
    }
  };

  const copy = async () => { await Clipboard.setStringAsync(ticket); setCopied(true); };

  const appBar = (
    <AppBar title={t('complaint.title')} onBack={() => navigation.goBack()} rounded={false}
      right={<IconButton icon={copied ? 'checkmark' : 'copy-outline'} onPress={copy} label={t('feedback.copyTicket')} />} />
  );

  if (!data) {
    return (
      <View style={styles.container}>
        {appBar}
        {loading ? (
          <View style={{ padding: space.lg }}>
            <Skeleton height={120} r={12} />
            <Skeleton height={260} r={12} style={{ marginTop: space.lg }} />
          </View>
        ) : (
          <EmptyState icon="alert-circle" tone="danger" title={t('common.errorTitle')} message={error} actionLabel={t('common.retry')} onAction={() => { setLoading(true); load(); }} />
        )}
      </View>
    );
  }

  const s = feedbackStatus(data.status);
  const resolved = TERMINAL.includes(data.status);

  return (
    <View style={styles.container}>
      {appBar}
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[colors.primary]} />}
      >
        <Card style={[styles.header, { borderTopColor: s.color }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt style={styles.ticket} selectable>{data.ticket_number}</Txt>
            <StatusPill status={data.status} />
          </View>
          <InfoRow icon="business" label={t('feedback.facility')} value={data.facility?.name || '—'} />
          <InfoRow icon="calendar" label={t('feedback.visitDate')} value={formatDate(data.visit_date) || '—'} />
          <InfoRow icon="time" label={t('complaint.submitted')} value={formatDate(data.submitted_at) || '—'} last />
        </Card>

        {error ? <Banner tone="offline" text={error} style={{ marginTop: space.md }} /> : null}

        {data.is_escalated && (
          <Banner tone="warning" icon="arrow-up-circle" title={t('complaint.escalatedTitle')} text={t('complaint.escalatedBody')} style={{ marginTop: space.md }} />
        )}

        <Card style={{ marginTop: space.lg }}>
          <Txt variant="h3" color={colors.primaryDark} style={{ marginBottom: space.lg }}>{t('complaint.progress')}</Txt>
          <Timeline steps={buildTimeline(data, t)} />
        </Card>

        {resolved && (
          <Card style={[styles.resolution]}>
            <Txt variant="h3" color={colors.successText}>{t('complaint.actionTaken')}</Txt>
            <Txt variant="body" style={{ marginTop: space.sm }}>{data.resolution_summary || t('complaint.noSummary')}</Txt>
            {data.resolved_at ? (
              <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: space.sm }}>
                {t('complaint.resolvedOn', { date: formatDate(data.resolved_at) })}
              </Txt>
            ) : null}

            <View style={styles.rateBox}>
              {data.resolution_satisfied == null ? (
                <>
                  <Txt variant="body" style={{ fontWeight: '700', marginBottom: space.md }}>{t('complaint.rateQuestion')}</Txt>
                  <View style={{ flexDirection: 'row', gap: space.md }}>
                    <Button title={t('feedback.yes')} icon="thumbs-up" onPress={() => rate(true)} disabled={rating} style={{ flex: 1 }} />
                    <Button title={t('feedback.no')} icon="thumbs-down" variant="secondary" onPress={() => rate(false)} disabled={rating} style={{ flex: 1 }} />
                  </View>
                </>
              ) : (
                <Txt variant="body" color={colors.successText} style={{ fontWeight: '600' }}>
                  {data.resolution_satisfied ? t('complaint.ratedYes') : t('complaint.ratedNo')}
                </Txt>
              )}
            </View>
          </Card>
        )}

        <Txt variant="caption" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: space.lg }}>{t('complaint.pullToRefresh')}</Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, paddingBottom: space.xxl },
  header: { borderTopWidth: 5, borderRadius: radius.lg },
  ticket: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1, fontFamily: Platform.select({ android: 'monospace', ios: 'Menlo' }), flexShrink: 1 },
  resolution: { marginTop: space.lg, borderLeftWidth: 4, borderLeftColor: colors.success },
  rateBox: { marginTop: space.lg, padding: space.md, borderRadius: radius.md, backgroundColor: colors.bg },
});
