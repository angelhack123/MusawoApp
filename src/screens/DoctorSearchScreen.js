// SCR-004: search by name (US-1.1) or registration number (US-1.2), with filters (US-1.5).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme';
import { useAppState } from '../state/AppState';
import { DoctorsAPI, ReferenceAPI } from '../api/musawo';
import { storage } from '../utils/storage';
import { MIN_SEARCH_CHARS, REG_NUMBER_RE } from '../config';
import AppBar from '../components/AppBar';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';
import { SelectSheet } from '../components/Sheet';
import { DoctorCard } from '../components/Cards';
import { Banner, Button, Chip, Txt } from '../components/ui';

// "12345" -> "MDC/12345"; keeps an existing prefix (US-1.2 auto-format)
const formatReg = (raw) => {
  const clean = raw.trim().toUpperCase().replace(/\s+/g, '');
  return /^\d+$/.test(clean) ? `MDC/${clean}` : clean;
};

export default function DoctorSearchScreen({ navigation, route }) {
  const { t, settings } = useAppState();
  const [mode, setMode] = useState('name');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regNotFound, setRegNotFound] = useState(null);
  const [history, setHistory] = useState([]);

  // Filters persist for the session because this tab stays mounted (US-1.5)
  const [showFilters, setShowFilters] = useState(false);
  const [specialty, setSpecialty] = useState(null);
  const [district, setDistrict] = useState(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sheet, setSheet] = useState(null);
  const debounce = useRef(null);
  const requestId = useRef(0);

  useEffect(() => {
    ReferenceAPI.specialties().then(r => setSpecialties(r.data)).catch(() => {});
    ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { storage.getSearchHistory().then(setHistory); }, []));

  const runSearch = useCallback(async (q, nextPage = 1) => {
    const id = ++requestId.current;
    nextPage === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const res = await DoctorsAPI.search({
        q, pageNum: nextPage, activeOnly,
        specialtyId: specialty?.id, districtId: district?.id,
      });
      if (id !== requestId.current) return;  // a newer search superseded this one
      setResults(prev => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setCount(res.count);
      setHasMore(res.hasMore);
      setPageNum(nextPage);
      setOffline(res.fromCache);
      setSearched(true);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.offline ? t('common.offlineNoCache') : err.message);
      if (nextPage === 1) setResults([]);
    } finally {
      if (id === requestId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [activeOnly, specialty, district, t]);

  // Debounced name search (300ms, min 3 chars)
  useEffect(() => {
    if (mode !== 'name') return;
    clearTimeout(debounce.current);
    if (query.trim().length < MIN_SEARCH_CHARS) {
      requestId.current++;
      setResults([]); setSearched(false); setLoading(false); setError(null);
      return;
    }
    debounce.current = setTimeout(() => runSearch(query.trim()), 300);
    return () => clearTimeout(debounce.current);
  }, [query, mode, runSearch]);

  // Deep-link from Home "recent searches"
  useEffect(() => {
    const p = route.params;
    if (!p?.query) return;
    setMode(p.mode === 'reg' ? 'reg' : 'name');
    setQuery(p.query);
    if (p.mode === 'reg') verifyReg(p.query);
  }, [route.params?.at]);

  const verifyReg = async (raw = query) => {
    Keyboard.dismiss();
    const reg = formatReg(raw);
    setRegNotFound(null);
    if (!REG_NUMBER_RE.test(reg)) {
      setRegError(t('verify.regInvalid'));
      return;
    }
    setRegError(null);
    setLoading(true);
    try {
      const doctor = await DoctorsAPI.verify(reg);
      storage.addSearchHistory(reg, 'reg').then(setHistory);
      if (doctor) navigation.navigate('DoctorProfile', { id: doctor.id, doctor });
      else setRegNotFound(reg);
    } catch (err) {
      setRegError(err.offline ? t('common.offline') : err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDoctor = (doctor) => {
    if (mode === 'name') storage.addSearchHistory(query, 'name').then(setHistory);
    navigation.navigate('DoctorProfile', { id: doctor.id, doctor });
  };

  const switchMode = (m) => {
    setMode(m); setQuery(''); setResults([]); setSearched(false);
    setRegError(null); setRegNotFound(null); setError(null);
  };

  const clearFilters = () => { setSpecialty(null); setDistrict(null); setActiveOnly(false); };
  const filterCount = [specialty, district, activeOnly || null].filter(Boolean).length;

  const header = (
    <AppBar title={t('verify.title')} subtitle={t('verify.subtitle')}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {['name', 'reg'].map(m => (
          <Pressable key={m} onPress={() => switchMode(m)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}>
            <Ionicons name={m === 'name' ? 'person' : 'card'} size={18} color={mode === m ? colors.white : 'rgba(255,255,255,0.65)'} />
            <Txt variant="label" color={mode === m ? colors.white : 'rgba(255,255,255,0.65)'} style={{ marginLeft: 6, fontWeight: '700' }}>
              {t(m === 'name' ? 'verify.byName' : 'verify.byReg')}
            </Txt>
            {mode === m && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>
      <SearchInput
        value={query}
        onChangeText={(v) => { setQuery(mode === 'reg' ? v.toUpperCase() : v); setRegError(null); setRegNotFound(null); }}
        placeholder={t(mode === 'name' ? 'verify.namePlaceholder' : 'verify.regPlaceholder')}
        icon={mode === 'name' ? 'search' : 'card-outline'}
        autoCapitalize={mode === 'reg' ? 'characters' : 'words'}
        onSubmitEditing={() => (mode === 'reg' ? verifyReg() : storage.addSearchHistory(query, 'name').then(setHistory))}
        error={regError}
        style={{ marginTop: space.md }}
      />
      {mode === 'reg' && /^\d{4,6}$/.test(query.trim()) ? (
        <Txt variant="caption" color={colors.primaryMuted} style={{ marginTop: 6 }}>{t('verify.willSearch', { reg: formatReg(query) })}</Txt>
      ) : null}
    </AppBar>
  );

  const controls = mode === 'name' ? (
    <View style={styles.controls}>
      <View style={styles.filterRow}>
        <Chip
          icon="options"
          label={filterCount ? t('filters.titleCount', { count: filterCount }) : t('filters.title')}
          selected={showFilters || filterCount > 0}
          onPress={() => setShowFilters(s => !s)}
        />
        {searched && !loading ? (
          <Txt variant="caption" color={colors.textSecondary} style={{ marginLeft: 'auto', marginBottom: space.sm }}>
            {t('verify.resultCount', { count })}
          </Txt>
        ) : null}
      </View>
      {showFilters && (
        <View style={styles.filterPanel}>
          <FilterSelect icon="school" label={t('filters.specialty')} value={specialty?.name || t('filters.allSpecialties')} onPress={() => setSheet('specialty')} />
          <FilterSelect icon="location" label={t('filters.district')} value={district?.name || t('filters.allDistricts')} onPress={() => setSheet('district')} />
          <View style={styles.switchRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Txt variant="body" style={{ flex: 1, marginLeft: space.sm }}>{t('filters.activeOnly')}</Txt>
            <Switch value={activeOnly} onValueChange={setActiveOnly} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
          </View>
          {filterCount > 0 && <Button variant="text" title={t('filters.clear')} onPress={clearFilters} icon="close-circle" />}
        </View>
      )}
    </View>
  ) : null;

  const emptyContent = () => {
    if (loading) return <SkeletonList count={3} />;
    if (error) return <EmptyState icon="cloud-offline" tone="danger" title={t('common.errorTitle')} message={error} actionLabel={t('common.retry')} onAction={() => runSearch(query.trim())} />;
    if (mode === 'reg') {
      if (regNotFound) {
        return (
          <EmptyState
            icon="help-circle"
            title={t('verify.regNotFoundTitle')}
            message={t('verify.regNotFoundBody', { reg: regNotFound })}
            actionLabel={t('verify.searchByNameInstead')}
            onAction={() => switchMode('name')}
          />
        );
      }
      return (
        <View>
          <EmptyState icon="card" title={t('verify.regIntroTitle')} message={t('verify.regIntroBody')} />
          <Button title={t('verify.verifyButton')} onPress={() => verifyReg()} disabled={!query.trim()} size="lg" icon="shield-checkmark" />
        </View>
      );
    }
    if (searched) {
      return <EmptyState icon="person-remove" title={t('verify.noResultsTitle')} message={t('verify.noResults', { query: query.trim() })} />;
    }
    return (
      <View>
        <EmptyState icon="search" title={t('verify.introTitle')} message={query ? t('verify.minChars') : t('verify.intro')} />
        {history.length > 0 && (
          <View>
            <Txt variant="label" color={colors.textSecondary} style={{ marginBottom: space.sm, fontWeight: '700' }}>{t('home.recentSearches')}</Txt>
            <View style={styles.historyWrap}>
              {history.map(h => (
                <Chip key={h.term} icon={h.mode === 'reg' ? 'card' : 'time'} label={h.term}
                  onPress={() => { switchMode(h.mode); setQuery(h.term); if (h.mode === 'reg') verifyReg(h.term); }} />
              ))}
            </View>
            <Button variant="text" title={t('verify.clearHistory')} onPress={() => storage.clearSearchHistory().then(() => setHistory([]))} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={mode === 'name' && !loading ? results : []}
        keyExtractor={d => d.id}
        ListHeaderComponent={
          <>
            {header}
            <View style={styles.listPad}>
              {controls}
              {offline && <Banner tone="offline" text={t('common.showingSaved')} style={{ marginBottom: space.md }} />}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.listPad}><DoctorCard doctor={item} onPress={() => openDoctor(item)} /></View>
        )}
        ListEmptyComponent={<View style={styles.listPad}>{emptyContent()}</View>}
        ListFooterComponent={hasMore && mode === 'name' && !loading ? (
          <View style={styles.listPad}>
            <Button title={t('verify.loadMore')} variant="secondary" loading={loadingMore} onPress={() => runSearch(query.trim(), pageNum + 1)} icon="chevron-down" />
          </View>
        ) : null}
        contentContainerStyle={{ paddingBottom: space.xxl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <SelectSheet
        visible={sheet === 'specialty'}
        onClose={() => setSheet(null)}
        title={t('filters.specialty')}
        searchPlaceholder={t('filters.searchSpecialty')}
        allLabel={t('filters.allSpecialties')}
        options={specialties.map(s => ({ value: s.id, label: (settings.lang === 'lg' && s.display_name_lg) || s.name }))}
        selected={specialty?.id}
        onSelect={(id) => setSpecialty(id ? specialties.find(s => s.id === id) : null)}
      />
      <SelectSheet
        visible={sheet === 'district'}
        onClose={() => setSheet(null)}
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

function FilterSelect({ icon, label, value, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.select} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: space.sm }}>
        <Txt variant="caption" color={colors.textSecondary}>{label}</Txt>
        <Txt variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{value}</Txt>
      </View>
      <Ionicons name="chevron-down" size={20} color={colors.neutral} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', marginTop: space.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' },
  tab: { flex: 1, minHeight: touch.min, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tabUnderline: { position: 'absolute', bottom: -1, left: '15%', right: '15%', height: 3, borderRadius: 2, backgroundColor: colors.white },
  listPad: { paddingHorizontal: space.lg },
  controls: { paddingTop: space.lg },
  filterRow: { flexDirection: 'row', alignItems: 'center' },
  filterPanel: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, marginBottom: space.md, borderWidth: 1, borderColor: colors.border },
  select: { minHeight: touch.large, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: space.md, marginBottom: space.sm },
  switchRow: { minHeight: touch.min, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  historyWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
