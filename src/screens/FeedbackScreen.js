// SCR-006 → SCR-010: the "Voice Engine" wizard (US-2.1 – US-2.7).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { FacilitiesAPI, FeedbackAPI, ReferenceAPI, rememberTicket } from '../api/musawo';
import { storage } from '../utils/storage';
import { daysAgo, formatDate, formatLongDate, parseDate, sameDay, toISODate } from '../utils/format';
import { COMMENT_MAX, FEEDBACK_WINDOW_DAYS } from '../config';
import AppBar from '../components/AppBar';
import CalendarPicker from '../components/CalendarPicker';
import SearchInput from '../components/SearchInput';
import { InfoSheet, SelectSheet } from '../components/Sheet';
import { Stars } from '../components/Rating';
import { SkeletonList } from '../components/Skeleton';
import { FacilityCard } from '../components/Cards';
import { Banner, Button, Card, Chip, IconButton, IconCircle, ProgressSegments, Txt } from '../components/ui';

// Five rights-based questions (PRD §5.1, US-2.4). `inverted`: "Yes" is the bad answer.
const QUESTIONS = [
  { id: 'q1_introduced', icon: 'person', options: ['yes', 'no'] },
  { id: 'q2_explained', icon: 'chatbubbles', options: ['yes', 'no', 'na'] },
  { id: 'q3_side_effects', icon: 'medkit', options: ['yes', 'no', 'na'] },
  { id: 'q4_unofficial_payment', icon: 'cash', options: ['yes', 'no'], inverted: true },
  { id: 'q5_overall_rating', icon: 'star', stars: true },
];

const ANSWER_STYLE = {
  good: { bg: colors.successBg, fg: colors.successText, border: colors.success },
  bad: { bg: colors.dangerBg, fg: colors.dangerText, border: colors.danger },
  na: { bg: colors.neutralBg, fg: colors.neutralText, border: colors.neutral },
};
const answerTone = (q, opt) => (opt === 'na' ? 'na' : (opt === 'yes') !== !!q.inverted ? 'good' : 'bad');
const ANSWER_ICON = { yes: 'checkmark-circle', no: 'close-circle', na: 'remove-circle' };
const toBool = (a) => (a === 'yes' ? true : a === 'no' ? false : null);

const MANUAL_TYPES = ['GENERAL_HOSPITAL', 'HC_IV', 'HC_III', 'HC_II', 'CLINIC', 'PHARMACY'];

// Monday of the current week (the "This Week" quick-select)
const startOfWeek = () => {
  const d = daysAgo(0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export default function FeedbackScreen({ navigation, route }) {
  const { t, settings } = useAppState();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [facility, setFacility] = useState(null);
  const [visitDate, setVisitDate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(true);   // Default ON (US-2.6)
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [info, setInfo] = useState(null);
  const scrollRef = useRef(null);
  const advanceTimer = useRef(null);
  const loaded = useRef(false);

  const dirty = !result && Boolean(facility || visitDate || Object.keys(answers).length || comment);

  // Prefill from a facility profile, otherwise offer to resume a draft (24h)
  useEffect(() => {
    (async () => {
      if (route.params?.facility) {
        setFacility(route.params.facility);
        storage.addRecentFacility(route.params.facility);
      } else {
        const draft = await storage.getFeedbackDraft();
        if (draft?.facility || draft?.answers && Object.keys(draft.answers).length) {
          Alert.alert(t('feedback.resumeTitle'), t('feedback.resumeBody'), [
            { text: t('feedback.startOver'), style: 'destructive', onPress: () => storage.clearFeedbackDraft() },
            {
              text: t('feedback.resume'),
              onPress: () => {
                setFacility(draft.facility || null);
                setVisitDate(draft.visitDate ? parseDate(draft.visitDate) : null);
                setAnswers(draft.answers || {});
                setComment(draft.comment || '');
                setAnonymous(draft.anonymous ?? true);
                setStep(draft.step || 1);
                setQIndex(draft.qIndex || 0);
              },
            },
          ]);
        }
      }
      loaded.current = true;
    })();
    return () => clearTimeout(advanceTimer.current);
  }, []);

  // Autosave progress (US-2.1)
  useEffect(() => {
    if (!loaded.current || !dirty) return;
    const timer = setTimeout(() => storage.saveFeedbackDraft({
      facility, visitDate: visitDate && toISODate(visitDate), answers, comment, anonymous, step, qIndex,
    }), 400);
    return () => clearTimeout(timer);
  }, [facility, visitDate, answers, comment, anonymous, step, qIndex, dirty]);

  // Confirm before leaving mid-way, including Android back (US-2.1)
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (!dirty) return;
    e.preventDefault();
    Alert.alert(t('feedback.exitTitle'), t('feedback.exitBody'), [
      { text: t('feedback.keepGoing'), style: 'cancel' },
      { text: t('feedback.exit'), style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
    ]);
  }), [navigation, dirty, t]);

  const goStep = (n) => {
    setStep(n);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const answer = (q, value) => {
    setAnswers(prev => ({ ...prev, [q.id]: value }));
    // Auto-advance after a short beat so the selection is visible (SCR-008)
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) setQIndex(i => i + 1);
      else goStep(4);
    }, 350);
  };

  const submit = async () => {
    const payload = {
      facility_id: facility.id,
      visit_date: toISODate(visitDate),
      is_anonymous: anonymous,
      q1_introduced: toBool(answers.q1_introduced),
      q2_explained: toBool(answers.q2_explained),
      q3_side_effects: toBool(answers.q3_side_effects),
      q4_unofficial_payment: toBool(answers.q4_unofficial_payment),
      q5_overall_rating: answers.q5_overall_rating,
      comment: comment.trim() || null,
    };
    setSubmitting(true);
    try {
      const res = await FeedbackAPI.submit(payload);
      await rememberTicket(res, facility.name);
      await storage.clearFeedbackDraft();
      setResult({ ticket: res.ticket_number, escalated: res.is_escalated });
    } catch (err) {
      if (err.offline) {
        // Queue and send later (UI Spec Mandate 4)
        const queue = await storage.getFeedbackQueue();
        await storage.setFeedbackQueue([...queue, { payload, facilityName: facility.name, queuedAt: Date.now() }]);
        await storage.clearFeedbackDraft();
        setResult({ queued: true, escalated: payload.q4_unofficial_payment });
      } else {
        Alert.alert(t('feedback.submitFailed'), err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <SuccessView result={result} anonymous={anonymous} navigation={navigation} />;
  }

  const canContinue = step === 1 ? !!facility : step === 2 ? !!visitDate : true;
  const question = QUESTIONS[qIndex];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBar
        title={t('feedback.title')}
        subtitle={t('feedback.stepOf', { step, total: 4 })}
        right={<IconButton icon="close" onPress={() => navigation.goBack()} label={t('feedback.exit')} />}
      >
        <ProgressSegments total={4} current={step} light style={{ marginTop: space.md }} />
      </AppBar>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <FacilityStep facility={facility} onSelect={(f) => { setFacility(f); storage.addRecentFacility(f); }} />
        )}

        {step === 2 && (
          <View>
            <StepHeading icon="calendar" title={t('feedback.dateTitle')} />
            <View style={styles.quickRow}>
              {[
                ['today', daysAgo(0)],
                ['yesterday', daysAgo(1)],
                ['thisWeek', startOfWeek()],
              ].map(([key, date], i, all) => {
                // Today/Yesterday win if "This Week" lands on the same day
                const selected = sameDay(visitDate, date) && !all.slice(0, i).some(([, d]) => sameDay(d, date));
                return <Chip key={key} label={t(`feedback.${key}`)} selected={selected} onPress={() => setVisitDate(date)} style={styles.quickChip} />;
              })}
            </View>
            <CalendarPicker
              value={visitDate}
              onChange={setVisitDate}
              maxDate={daysAgo(0)}
              minDate={daysAgo(FEEDBACK_WINDOW_DAYS)}
            />
            <Banner tone="info" icon="time" text={t('feedback.dateLimit')} style={{ marginTop: space.md }} />
          </View>
        )}

        {step === 3 && (
          <View>
            <View style={styles.qCounterRow}>
              <Txt variant="label" color={colors.primary} style={{ fontWeight: '700' }}>
                {t('feedback.questionOf', { n: qIndex + 1, total: QUESTIONS.length })}
              </Txt>
              <View style={styles.qDots}>
                {QUESTIONS.map((q, i) => (
                  <Pressable key={q.id} onPress={() => setQIndex(i)} hitSlop={6} accessibilityLabel={t('feedback.questionOf', { n: i + 1, total: QUESTIONS.length })}>
                    <View style={[styles.qDot, answers[q.id] != null && styles.qDotDone, i === qIndex && styles.qDotActive]} />
                  </Pressable>
                ))}
              </View>
            </View>

            <Card style={styles.questionCard} key={question.id}>
              <View style={styles.questionTop}>
                <IconCircle icon={question.icon} size={52} />
                <IconButton
                  icon="information-circle"
                  color={colors.primary}
                  bg={colors.primaryLight}
                  onPress={() => setInfo(question)}
                  label={t('feedback.aboutRight')}
                />
              </View>
              <Txt variant="bodyLg" style={styles.questionText}>{t(`questions.${question.id}.text`)}</Txt>

              {question.stars ? (
                <View style={{ marginTop: space.lg }}>
                  <Stars
                    value={answers[question.id] || 0}
                    onChange={(n) => answer(question, n)}
                    labels={[t('feedback.poor'), t('feedback.excellent')]}
                  />
                  {answers[question.id] ? (
                    <Txt variant="h3" color={colors.primaryDark} style={{ textAlign: 'center', marginTop: space.md }}>
                      {t(`feedback.rating${answers[question.id]}`)}
                    </Txt>
                  ) : null}
                </View>
              ) : (
                <View style={{ marginTop: space.lg }}>
                  {question.options.map(opt => {
                    const tone = ANSWER_STYLE[answerTone(question, opt)];
                    const selected = answers[question.id] === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => answer(question, opt)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        style={({ pressed }) => [
                          styles.answerBtn,
                          { backgroundColor: tone.bg, borderColor: selected ? tone.border : 'transparent' },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Ionicons name={ANSWER_ICON[opt]} size={26} color={tone.fg} />
                        <Txt variant="bodyLg" color={tone.fg} style={{ marginLeft: space.md, fontWeight: '700', flex: 1 }}>{t(`feedback.${opt}`)}</Txt>
                        {selected ? <Ionicons name="checkmark" size={24} color={tone.fg} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>

            {question.id === 'q4_unofficial_payment' && (
              <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: space.sm, textAlign: 'center' }}>{t('feedback.q4Note')}</Txt>
            )}
            {qIndex > 0 && (
              <Button variant="text" title={t('feedback.previousQuestion')} icon="arrow-back" onPress={() => setQIndex(i => i - 1)} style={{ alignSelf: 'center', marginTop: space.md }} />
            )}
          </View>
        )}

        {step === 4 && (
          <ReviewStep
            facility={facility}
            visitDate={visitDate}
            answers={answers}
            comment={comment}
            setComment={setComment}
            anonymous={anonymous}
            setAnonymous={setAnonymous}
            onEditQuestion={(i) => { setQIndex(i); goStep(3); }}
            onEditStep={goStep}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        {step > 1 && step !== 3 && (
          <Button title={t('common.back')} variant="secondary" onPress={() => goStep(step - 1)} style={{ flex: 1 }} />
        )}
        {step === 3 && (
          <Button title={t('common.back')} variant="secondary" onPress={() => goStep(2)} style={{ flex: 1 }} />
        )}
        {step < 3 && (
          <Button title={t('common.continue')} onPress={() => goStep(step + 1)} disabled={!canContinue} icon="arrow-forward" style={{ flex: 2 }} />
        )}
        {step === 3 && (
          <Button
            title={t('common.continue')}
            onPress={() => goStep(4)}
            disabled={QUESTIONS.some(q => answers[q.id] == null)}
            icon="arrow-forward"
            style={{ flex: 2 }}
          />
        )}
        {step === 4 && (
          <Button title={t('feedback.submit')} onPress={submit} loading={submitting} icon="send" style={{ flex: 2 }}
            disabled={!facility || !visitDate || QUESTIONS.some(q => answers[q.id] == null)} />
        )}
      </View>

      <InfoSheet
        visible={!!info}
        onClose={() => setInfo(null)}
        icon="ribbon"
        title={t('feedback.yourRight')}
        closeLabel={t('common.gotIt')}
      >
        {info ? (
          <>
            <Txt variant="h3" color={colors.primaryDark}>{t(`questions.${info.id}.right`)}</Txt>
            <Txt variant="body" color={colors.textSecondary} style={{ marginTop: space.sm }}>{t(`questions.${info.id}.explain`)}</Txt>
          </>
        ) : null}
      </InfoSheet>
    </KeyboardAvoidingView>
  );
}

function StepHeading({ icon, title, subtitle }) {
  return (
    <View style={styles.stepHeading}>
      <IconCircle icon={icon} size={44} />
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Txt variant="h2" color={colors.primaryDark} accessibilityRole="header">{title}</Txt>
        {subtitle ? <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400' }}>{subtitle}</Txt> : null}
      </View>
    </View>
  );
}

// SCR-006 / US-2.2: recent (3), type-ahead search grouped by district, manual entry
function FacilityStep({ facility, onSelect }) {
  const { t, settings } = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manual, setManual] = useState(false);

  useEffect(() => { storage.getRecentFacilities().then(setRecent); }, []);

  useEffect(() => {
    const q = query.trim();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Before typing, show facilities in the user's home district (US-5.1)
        const res = await FacilitiesAPI.list({ q: q || undefined, districtId: q ? undefined : settings.homeDistrict?.id, limit: 30 });
        setResults(res.items);
        setError(null);
      } catch (err) {
        setError(err.offline ? t('common.offline') : err.message);
      } finally {
        setLoading(false);
      }
    }, q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const grouped = useMemo(() => {
    const groups = {};
    results.forEach(f => { (groups[f.district?.name || '—'] ||= []).push(f); });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [results]);

  return (
    <View>
      <StepHeading icon="business" title={t('feedback.facilityTitle')} subtitle={t('feedback.facilitySubtitle')} />

      {facility && (
        <Banner tone="success" icon="checkmark-circle" title={t('feedback.selected')} text={facility.name} style={{ marginBottom: space.md }} />
      )}

      {recent.length > 0 && (
        <View style={{ marginBottom: space.md }}>
          <Txt variant="label" color={colors.textSecondary} style={styles.groupLabel}>{t('feedback.recentFacilities')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {recent.map(f => (
              <Chip key={f.id} icon="time" label={f.name} selected={facility?.id === f.id} onPress={() => onSelect(f)} />
            ))}
          </View>
        </View>
      )}

      <SearchInput value={query} onChangeText={setQuery} placeholder={t('feedback.facilitySearch')} style={{ marginBottom: space.md }} />

      {loading ? <SkeletonList count={2} /> : error ? (
        <Banner tone="offline" text={error} />
      ) : results.length === 0 ? (
        <Txt variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginVertical: space.lg }}>
          {query ? t('feedback.noFacilities', { query }) : t('feedback.typeToSearch')}
        </Txt>
      ) : grouped.map(([district, list]) => (
        <View key={district}>
          <Txt variant="label" color={colors.textSecondary} style={styles.groupLabel}>{district.toUpperCase()}</Txt>
          {list.map(f => (
            <FacilityCard key={f.id} facility={f} compact selectable selected={facility?.id === f.id} onPress={() => onSelect(f)} />
          ))}
        </View>
      ))}

      {manual ? (
        <ManualFacility
          initialName={query}
          onCancel={() => setManual(false)}
          onCreated={(f) => { setManual(false); onSelect(f); }}
        />
      ) : (
        <Button variant="text" icon="add-circle" title={t('feedback.cantFind')} onPress={() => setManual(true)} style={{ marginTop: space.sm }} />
      )}
    </View>
  );
}

// "Can't find your facility? Enter manually" — saved unverified for admin review
function ManualFacility({ initialName, onCancel, onCreated }) {
  const { t, settings } = useAppState();
  const [name, setName] = useState(initialName || '');
  const [district, setDistrict] = useState(settings.homeDistrict);
  const [type, setType] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true);
    try {
      onCreated(await FacilitiesAPI.suggest({ name: name.trim(), districtId: district.id, type }));
    } catch (err) {
      Alert.alert(t('common.errorTitle'), err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ marginTop: space.md, borderWidth: 1, borderColor: colors.primaryMuted }}>
      <Txt variant="h3" color={colors.primaryDark}>{t('feedback.manualTitle')}</Txt>
      <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400', marginBottom: space.md }}>{t('feedback.manualBody')}</Txt>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('feedback.manualName')}
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        accessibilityLabel={t('feedback.manualName')}
      />
      <Pressable onPress={() => setSheet(true)} style={[styles.input, styles.selectInput]} accessibilityRole="button">
        <Txt variant="body" color={district ? colors.text : colors.placeholder} style={{ flex: 1 }}>{district?.name || t('filters.district')}</Txt>
        <Ionicons name="chevron-down" size={20} color={colors.neutral} />
      </Pressable>
      <Txt variant="label" color={colors.textSecondary} style={{ marginBottom: space.sm }}>{t('feedback.manualType')}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {MANUAL_TYPES.map(ft => <Chip key={ft} label={t(`facilityTypes.${ft}`)} selected={type === ft} onPress={() => setType(ft)} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.sm }}>
        <Button title={t('common.cancel')} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
        <Button title={t('feedback.manualSave')} onPress={save} loading={saving} disabled={name.trim().length < 3 || !district || !type} style={{ flex: 1 }} />
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
    </Card>
  );
}

// SCR-009: summary, optional comment, anonymity toggle
function ReviewStep({ facility, visitDate, answers, comment, setComment, anonymous, setAnonymous, onEditQuestion, onEditStep }) {
  const t = useAppState().t;
  return (
    <View>
      <StepHeading icon="checkmark-done" title={t('feedback.reviewTitle')} subtitle={t('feedback.reviewSubtitle')} />

      <Card style={{ paddingVertical: space.sm }}>
        <SummaryRow icon="business" label={t('feedback.facility')} value={facility?.name} onEdit={() => onEditStep(1)} />
        <SummaryRow icon="calendar" label={t('feedback.visitDate')} value={formatLongDate(visitDate)} onEdit={() => onEditStep(2)} />
        {QUESTIONS.map((q, i) => {
          const a = answers[q.id];
          const tone = q.stars ? null : ANSWER_STYLE[answerTone(q, a)];
          return (
            <Pressable key={q.id} onPress={() => onEditQuestion(i)} style={styles.summaryQ} accessibilityRole="button">
              <Txt variant="label" style={{ flex: 1, fontWeight: '400' }} numberOfLines={2}>{`Q${i + 1}. ${t(`questions.${q.id}.short`)}`}</Txt>
              {a == null ? (
                <Txt variant="caption" color={colors.dangerText} style={{ fontWeight: '700' }}>{t('feedback.unanswered')}</Txt>
              ) : q.stars ? (
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map(n => <Ionicons key={n} name={a >= n ? 'star' : 'star-outline'} size={16} color={colors.amber} />)}
                </View>
              ) : (
                <View style={[styles.answerPill, { backgroundColor: tone.bg }]}>
                  <Ionicons name={ANSWER_ICON[a]} size={16} color={tone.fg} />
                  <Txt variant="caption" color={tone.fg} style={{ marginLeft: 4, fontWeight: '700' }}>{t(`feedback.${a}`)}</Txt>
                </View>
              )}
            </Pressable>
          );
        })}
      </Card>

      {answers.q4_unofficial_payment === 'yes' && (
        <Banner tone="warning" icon="flag" title={t('feedback.escalateTitle')} text={t('feedback.escalateBody')} style={{ marginTop: space.md }} />
      )}

      <Txt variant="h3" color={colors.primaryDark} style={{ marginTop: space.xl, marginBottom: space.sm }}>{t('feedback.commentTitle')}</Txt>
      <View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={t('feedback.commentPlaceholder')}
          placeholderTextColor={colors.placeholder}
          maxLength={COMMENT_MAX}
          multiline
          style={styles.textArea}
          accessibilityLabel={t('feedback.commentTitle')}
        />
        <Txt variant="caption" color={comment.length > COMMENT_MAX - 50 ? colors.warningText : colors.textSecondary} style={styles.counter}>
          {comment.length}/{COMMENT_MAX}
        </Txt>
      </View>

      <Card style={[styles.anonCard, anonymous && { borderColor: colors.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconCircle icon={anonymous ? 'eye-off' : 'receipt'} size={44} />
          <View style={{ flex: 1, marginHorizontal: space.md }}>
            <Txt variant="body" style={{ fontWeight: '700' }}>{t('feedback.anonymous')}</Txt>
            <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '400' }}>{t('feedback.anonymousHelp')}</Txt>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
            accessibilityLabel={t('feedback.anonymous')}
          />
        </View>
        <Banner
          tone={anonymous ? 'info' : 'success'}
          icon={anonymous ? 'lock-closed' : 'receipt'}
          text={anonymous ? t('feedback.anonymousOn') : t('feedback.anonymousOff')}
          style={{ marginTop: space.md }}
        />
      </Card>
    </View>
  );
}

function SummaryRow({ icon, label, value, onEdit }) {
  return (
    <Pressable onPress={onEdit} style={styles.summaryRow} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Txt variant="caption" color={colors.textSecondary}>{label}</Txt>
        <Txt variant="body" style={{ fontWeight: '600' }} numberOfLines={2}>{value}</Txt>
      </View>
      <Ionicons name="create-outline" size={20} color={colors.neutral} />
    </Pressable>
  );
}

// SCR-010: thank-you with check "burst", ticket + copy, what happens next
function SuccessView({ result, anonymous, navigation }) {
  const t = useAppState().t;
  const insets = useSafeAreaInsets();
  const pop = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 14 }),
      Animated.timing(burst, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  const copy = async () => {
    await Clipboard.setStringAsync(result.ticket);
    setCopied(true);
  };

  const steps = ['received', 'notified', 'action'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.success, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.burstWrap}>
        {Array.from({ length: 10 }, (_, i) => {
          const angle = (i / 10) * 2 * Math.PI;
          return (
            <Animated.View
              key={i}
              style={[styles.particle, {
                backgroundColor: i % 2 ? colors.amber : colors.primary,
                opacity: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 90] }) },
                  { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 90] }) },
                ],
              }]}
            />
          );
        })}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: pop }] }]}>
          <Ionicons name={result.queued ? 'cloud-upload' : 'checkmark'} size={64} color={colors.white} />
        </Animated.View>
      </View>

      <Txt variant="h1" color={colors.primaryDark} style={styles.centerText} accessibilityRole="header">
        {result.queued ? t('feedback.queuedTitle') : t('feedback.thankYou')}
      </Txt>
      <Txt variant="bodyLg" color={colors.textSecondary} style={[styles.centerText, { marginTop: space.sm }]}>
        {result.queued ? t('feedback.queuedBody') : t('feedback.thankYouBody')}
      </Txt>

      {result.ticket ? (
        <Card style={styles.ticketCard}>
          <Txt variant="label" color={colors.textSecondary}>{t('feedback.yourTicket')}</Txt>
          <Txt style={styles.ticketNumber} selectable>{result.ticket}</Txt>
          <Button title={copied ? t('feedback.copied') : t('feedback.copyTicket')} icon={copied ? 'checkmark' : 'copy-outline'} variant="secondary" onPress={copy} />
          <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: space.sm, textAlign: 'center' }}>{t('feedback.saveTicket')}</Txt>
        </Card>
      ) : !result.queued && anonymous ? (
        <Banner tone="info" icon="lock-closed" text={t('feedback.anonymousDone')} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
      ) : null}

      {result.escalated ? (
        <Banner tone="warning" icon="flag" title={t('feedback.escalateTitle')} text={t('feedback.escalatedDone')} style={{ marginTop: space.md, alignSelf: 'stretch' }} />
      ) : null}

      <Card style={styles.nextCard}>
        <Txt variant="h3" color={colors.primaryDark} style={{ marginBottom: space.md }}>{t('feedback.whatsNext')}</Txt>
        {steps.map((key, i) => (
          <View key={key} style={styles.nextRow}>
            <View style={styles.nextNum}><Txt variant="label" color={colors.white} style={{ fontWeight: '700' }}>{i + 1}</Txt></View>
            <Txt variant="body" style={{ flex: 1 }}>{t(`feedback.next.${key}`)}</Txt>
          </View>
        ))}
      </Card>

      {result.ticket ? (
        <Button title={t('feedback.trackThis')} icon="receipt" variant="secondary" size="lg"
          onPress={() => navigation.replace('ComplaintDetail', { ticket: result.ticket })} style={styles.fullBtn} />
      ) : null}
      <Button title={t('feedback.returnHome')} icon="home" size="lg" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} style={styles.fullBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl },
  footer: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  stepHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  groupLabel: { fontWeight: '700', marginBottom: space.sm, marginTop: space.xs, letterSpacing: 0.5 },
  quickRow: { flexDirection: 'row', marginBottom: space.sm },
  quickChip: { flex: 1, justifyContent: 'center', minHeight: touch.min },
  qCounterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  qDots: { flexDirection: 'row', gap: 6 },
  qDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  qDotDone: { backgroundColor: colors.primaryMuted },
  qDotActive: { width: 24, backgroundColor: colors.primary },
  questionCard: { padding: space.xl, borderRadius: radius.lg, ...shadow.raised },
  questionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionText: { marginTop: space.lg, fontWeight: '600', fontSize: 20, lineHeight: 28 },
  answerBtn: {
    minHeight: touch.large,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    marginBottom: space.md,
  },
  input: {
    minHeight: touch.large,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: space.md,
    backgroundColor: colors.card,
  },
  selectInput: { flexDirection: 'row', alignItems: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  summaryQ: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  answerPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill, marginLeft: space.sm },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    padding: space.md,
    paddingBottom: space.xl,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    backgroundColor: colors.card,
  },
  counter: { position: 'absolute', right: space.md, bottom: space.sm },
  anonCard: { marginTop: space.xl, borderWidth: 2, borderColor: colors.border },
  success: { alignItems: 'center', paddingHorizontal: space.lg },
  burstWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  particle: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  checkCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', ...shadow.raised },
  centerText: { textAlign: 'center' },
  ticketCard: { alignSelf: 'stretch', alignItems: 'center', marginTop: space.xl, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  ticketNumber: { fontSize: 26, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1.5, marginVertical: space.md, fontFamily: Platform.select({ android: 'monospace', ios: 'Menlo' }) },
  nextCard: { alignSelf: 'stretch', marginTop: space.xl, backgroundColor: colors.primaryLight },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  nextNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  fullBtn: { alignSelf: 'stretch', marginTop: space.md },
});
