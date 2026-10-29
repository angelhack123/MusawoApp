// US-4.1: search facilities by name, filter by district/type; select up to 3 to compare (US-4.4).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, space } from '../theme';
import { useAppState } from '../state/AppState';
import { FacilitiesAPI, ReferenceAPI } from '../api/musawo';
import { FACILITY_GROUPS } from '../utils/status';
import AppBar from '../components/AppBar';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { SelectSheet } from '../components/Sheet';
import { FacilityCard } from '../components/Cards';
import { Button, Chip, IconButton, Txt } from '../components/ui';

const MAX_COMPARE = 3;

export default function FacilitiesScreen({ navigation }) {
  const { t, settings } = useAppState();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(null);
  const [district, setDistrict] = useState(settings.homeDistrict);
  const [districts, setDistricts] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [items, setItems] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const requestId = useRef(0);

  useEffect(() => { ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {}); }, []);

  const fetchPage = useCallback(async (nextPage) => {
    const id = ++requestId.current;
    nextPage === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await FacilitiesAPI.list({
        q: query.trim() || undefined,
        districtId: district?.id,
        types: FACILITY_GROUPS.find(g => g.key === group)?.types,
        pageNum: nextPage,
      });
      if (id !== requestId.current) return;
      setItems(prev => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPageNum(nextPage);
      setError(null);
    } catch (err) {
      if (id === requestId.current) setError(err.offline ? t('common.offline') : err.message);
    } finally {
      if (id === requestId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [query, district, group, t]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPage(1), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchPage]);

  const toggleSelect = (facility) => {
    setSelected(prev => prev.some(f => f.id === facility.id)
      ? prev.filter(f => f.id !== facility.id)
      : prev.length < MAX_COMPARE ? [...prev, facility] : prev);
  };

  const exitCompare = () => { setCompareMode(false); setSelected([]); };

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={f => f.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: compareMode ? 120 : space.xxl }}
        ListHeaderComponent={
          <>
            <AppBar
              title={t('facilities.title')}
              subtitle={t('facilities.subtitle')}
              onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
              right={<IconButton icon={compareMode ? 'close' : 'git-compare'} onPress={compareMode ? exitCompare : () => setCompareMode(true)} label={t('facilities.compare')} />}
            >
              <SearchInput value={query} onChangeText={setQuery} placeholder={t('facilities.searchPlaceholder')} style={{ marginTop: space.md }} />
            </AppBar>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              <Chip icon="location" label={district?.name || t('filters.allDistricts')} selected={!!district} onPress={() => setSheet(true)}
                onRemove={district ? () => setDistrict(null) : undefined} />
              {FACILITY_GROUPS.map(g => (
                <Chip key={g.key} icon={g.icon} label={t(`facilities.groups.${g.key}`)} selected={group === g.key}
                  onPress={() => setGroup(group === g.key ? null : g.key)} />
              ))}
            </ScrollView>
            {compareMode && (
              <Txt variant="label" color={colors.primaryDark} style={styles.compareHint}>{t('facilities.compareHint', { max: MAX_COMPARE })}</Txt>
            )}
            {loading && <View style={styles.pad}><SkeletonList count={4} /></View>}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <FacilityCard
              facility={item}
              selectable={compareMode}
              selected={selected.some(f => f.id === item.id)}
              onPress={() => (compareMode ? toggleSelect(item) : navigation.navigate('FacilityProfile', { id: item.id, facility: item }))}
            />
          </View>
        )}
        ListEmptyComponent={loading ? null : error ? (
          <EmptyState icon="cloud-offline" tone="danger" title={t('common.errorTitle')} message={error} actionLabel={t('common.retry')} onAction={() => fetchPage(1)} />
        ) : (
          <EmptyState icon="business" title={t('facilities.emptyTitle')} message={t('facilities.empty')} />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (hasMore && !loadingMore && !loading) fetchPage(pageNum + 1); }}
        ListFooterComponent={loadingMore ? <View style={styles.pad}><SkeletonList count={1} /></View> : null}
      />

      {compareMode && (
        <View style={[styles.compareBar, { paddingBottom: insets.bottom + space.md }]}>
          <Txt variant="label" style={{ flex: 1, fontWeight: '700' }}>{t('facilities.selected', { count: selected.length, max: MAX_COMPARE })}</Txt>
          <Button
            title={t('facilities.compareNow')}
            icon="git-compare"
            disabled={selected.length < 2}
            onPress={() => navigation.navigate('CompareFacilities', { facilities: selected })}
          />
        </View>
      )}

      <SelectSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={t('filters.district')}
        searchPlaceholder={t('filters.searchDistrict')}
        allLabel={t('filters.allDistricts')}
        options={districts.map(d => ({ value: d.id, label: d.name, group: t(`regions.${d.region}`) }))}
        selected={district?.id}
        onSelect={(id) => setDistrict(id ? districts.find(d => d.id === id) : null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: space.lg },
  filters: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  compareHint: { paddingHorizontal: space.lg, marginBottom: space.sm },
  compareBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.lg, paddingTop: space.md,
    backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    ...shadow.raised,
  },
});
