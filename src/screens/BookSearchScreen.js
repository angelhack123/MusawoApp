// Patient: find a doctor to book by location (district), specialty or name.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { useAppState } from '../state/AppState';
import { BookingAPI } from '../api/booking';
import { ReferenceAPI } from '../api/musawo';
import AppBar from '../components/AppBar';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { SkeletonList } from '../components/Skeleton';
import { SelectSheet } from '../components/Sheet';
import { FeeTag } from '../components/BookingParts';
import { specialtyName } from '../components/Cards';
import { Avatar, Button, Card, Chip, IconButton, Txt } from '../components/ui';

function BookableDoctorCard({ doctor, onPress }) {
  const { t, settings } = useAppState();
  return (
    <Card onPress={onPress} style={styles.card} accessibilityLabel={doctor.full_name}>
      <View style={styles.cardTop}>
        <Avatar name={doctor.full_name} photoUrl={doctor.photo_url} size={56} />
        <View style={{ flex: 1, marginLeft: space.md }}>
          <Txt variant="h3" numberOfLines={2}>{doctor.full_name}</Txt>
          <Txt variant="body" color={colors.textSecondary} numberOfLines={1}>
            {specialtyName(doctor.specialty, settings.lang, t('doctor.generalPractitioner'))}
          </Txt>
          <StatusBadge status={doctor.status} size="sm" style={{ marginTop: space.xs }} />
        </View>
      </View>
      <View style={styles.facilities}>
        {doctor.facilities.map(f => (
          <View key={f.id} style={styles.facilityRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Txt variant="label" style={{ flex: 1, marginLeft: 6, fontWeight: '500' }} numberOfLines={1}>
              {f.name}{f.district ? ` · ${f.district}` : ''}
            </Txt>
            <FeeTag amount={f.consultation_fee} />
          </View>
        ))}
      </View>
      <Button title={t('book.chooseTime')} icon="calendar" onPress={onPress} style={{ marginTop: space.md }} />
    </Card>
  );
}

export default function BookSearchScreen({ navigation }) {
  const { t, settings } = useAppState();
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState(settings.homeDistrict);
  const [specialty, setSpecialty] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [items, setItems] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    ReferenceAPI.districts().then(r => setDistricts(r.data)).catch(() => {});
    ReferenceAPI.specialties().then(r => setSpecialties(r.data)).catch(() => {});
  }, []);

  const load = useCallback(async (nextPage = 1) => {
    const id = ++requestId.current;
    if (nextPage === 1) setLoading(true);
    try {
      const res = await BookingAPI.doctors({ q: query.trim(), districtId: district?.id, specialtyId: specialty?.id, pageNum: nextPage });
      if (id !== requestId.current) return;
      setItems(prev => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPageNum(nextPage);
      setError(null);
    } catch (err) {
      if (id === requestId.current) setError(err.offline ? t('common.offline') : err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query, district, specialty, t]);

  useEffect(() => {
    const timer = setTimeout(() => load(1), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={d => d.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: space.xxl }}
        ListHeaderComponent={
          <>
            <AppBar
              title={t('book.title')}
              subtitle={t('book.subtitle')}
              right={<IconButton icon="calendar-outline" onPress={() => navigation.navigate('MyBookings')} label={t('book.myBookings')} />}
            >
              <SearchInput value={query} onChangeText={setQuery} placeholder={t('book.searchPlaceholder')} style={{ marginTop: space.md }} />
            </AppBar>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              <Chip icon="location" label={district?.name || t('filters.allDistricts')} selected={!!district}
                onPress={() => setSheet('district')} onRemove={district ? () => setDistrict(null) : undefined} />
              <Chip icon="school" label={specialty?.name || t('filters.allSpecialties')} selected={!!specialty}
                onPress={() => setSheet('specialty')} onRemove={specialty ? () => setSpecialty(null) : undefined} />
            </ScrollView>
            <Button variant="text" icon="calendar-outline" title={t('book.myBookings')} onPress={() => navigation.navigate('MyBookings')}
              style={{ alignSelf: 'flex-start', marginLeft: space.md }} />
            {loading && <View style={styles.pad}><SkeletonList count={3} /></View>}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <BookableDoctorCard doctor={item} onPress={() => navigation.navigate('BookDoctor', { doctor: item })} />
          </View>
        )}
        ListEmptyComponent={loading ? null : error ? (
          <EmptyState icon="cloud-offline" tone="danger" title={t('common.errorTitle')} message={error} actionLabel={t('common.retry')} onAction={() => load(1)} />
        ) : (
          <EmptyState icon="calendar" title={t('book.emptyTitle')}
            message={district ? t('book.emptyDistrict', { district: district.name }) : t('book.empty')}
            actionLabel={district ? t('book.allDistricts') : undefined} onAction={() => setDistrict(null)} />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (hasMore && !loading) load(pageNum + 1); }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: space.lg },
  filters: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs },
  card: { marginBottom: space.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  facilities: { marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: space.sm },
  facilityRow: { flexDirection: 'row', alignItems: 'center' },
});
