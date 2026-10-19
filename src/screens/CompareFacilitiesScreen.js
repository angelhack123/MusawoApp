// US-4.4: side-by-side comparison of up to 3 facilities; best value per row highlighted.
import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { useAppState } from '../state/AppState';
import AppBar from '../components/AppBar';
import { Card, Txt } from '../components/ui';
import { SCORE_ROWS } from './FacilityProfileScreen';

const LABEL_WIDTH = 116;

export default function CompareFacilitiesScreen({ navigation, route }) {
  const t = useAppState().t;
  const { width } = useWindowDimensions();
  const facilities = route.params.facilities;
  const colWidth = Math.max(130, (width - space.lg * 2 - LABEL_WIDTH) / facilities.length);

  const rows = [
    { label: t('compare.type'), value: f => f.type_display || f.type },
    { label: t('facility.district'), value: f => f.district?.name || f.district },
    { label: t('compare.overall'), numeric: f => f.agency_score?.avg_overall_rating, format: v => `★ ${v.toFixed(1)}` },
    ...SCORE_ROWS.map(r => ({ label: t(r.labelKey), numeric: f => f.agency_score?.[r.key], format: v => `${Math.round(v)}%` })),
    { label: t('compare.reports'), value: f => String(f.agency_score?.total_feedback_count ?? '—') },
  ];

  return (
    <View style={styles.container}>
      <AppBar title={t('compare.title')} subtitle={t('compare.subtitle')} onBack={() => navigation.goBack()} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.row, styles.headRow]}>
                <View style={[styles.labelCell, { width: LABEL_WIDTH }]} />
                {facilities.map(f => (
                  <View key={f.id} style={[styles.cell, { width: colWidth }]}>
                    <Txt variant="label" color={colors.white} style={{ fontWeight: '700', textAlign: 'center' }} numberOfLines={3}>{f.name}</Txt>
                  </View>
                ))}
              </View>
              {rows.map((row, i) => {
                const nums = row.numeric ? facilities.map(row.numeric) : [];
                const best = nums.some(n => n != null) ? Math.max(...nums.filter(n => n != null)) : null;
                return (
                  <View key={row.label} style={[styles.row, i % 2 === 1 && { backgroundColor: colors.bg }]}>
                    <View style={[styles.labelCell, { width: LABEL_WIDTH }]}>
                      <Txt variant="label" color={colors.textSecondary} style={{ fontWeight: '700' }}>{row.label}</Txt>
                    </View>
                    {facilities.map((f, j) => {
                      const n = row.numeric?.(f);
                      const isBest = best != null && n === best && facilities.length > 1;
                      return (
                        <View key={f.id} style={[styles.cell, { width: colWidth }, isBest && styles.bestCell]}>
                          {isBest ? <Ionicons name="trophy" size={14} color={colors.successText} style={{ marginBottom: 2 }} /> : null}
                          <Txt variant="label" color={isBest ? colors.successText : colors.text} style={{ textAlign: 'center', fontWeight: isBest ? '800' : '500' }}>
                            {row.numeric ? (n == null ? t('compare.noData') : row.format(n)) : row.value(f) || '—'}
                          </Txt>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Card>
        <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: space.md }}>{t('compare.footnote')}</Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headRow: { backgroundColor: colors.primaryDark, minHeight: 72 },
  labelCell: { justifyContent: 'center', paddingHorizontal: space.md },
  cell: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm, paddingVertical: space.sm },
  bestCell: { backgroundColor: colors.successBg, borderRadius: radius.sm },
});
