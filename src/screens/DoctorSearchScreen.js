import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useNavigation } from '@react-navigation/native';
import { addToSearchHistory, getSearchHistory } from '../utils/storage';

export default function DoctorSearchScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState('name'); // 'name' | 'reg'
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debounceTimer = useRef(null);

  useEffect(() => { getSearchHistory().then(setHistory); }, []);

  const handleSearch = (text) => {
    setQuery(text);
    if (mode === 'name' && text.length >= 3) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchDoctors(text, 1), 300);
    } else if (mode === 'reg' && text.length >= 5) {
      fetchByReg(text);
    }
  };

  const fetchDoctors = async (q, pageNum) => {
    setLoading(true);
    try {
      const res = await api.get(`doctors/?search=${q}&page=${pageNum}&limit=10`);
      const results = res.data.results || res.data;
      setDoctors(pageNum === 1 ? results : [...doctors, ...results]);
      setHasMore(results.length === 10);
      if (pageNum === 1) addToSearchHistory(q).then(setHistory);
    } catch { Alert.alert('Error', 'Failed to load doctors'); } finally { setLoading(false); }
  };

  const fetchByReg = async (raw) => {
    const formatted = raw.match(/^MDC\//i) ? raw : `MDC/${raw}`;
    setLoading(true);
    try {
      const res = await api.get(`doctors/?registration_number=${formatted}`);
      const results = res.data.results || res.data;
      setDoctors(results);
      setHasMore(false);
    } catch { setDoctors([]); } finally { setLoading(false); }
  };

  const loadMore = () => {
    if (hasMore && !loading && mode === 'name') fetchDoctors(query, page + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggle, mode === 'name' && styles.toggleActive]} onPress={() => setMode('name')}>
          <Text style={[styles.toggleText, mode === 'name' && styles.toggleTextActive]}>Search by Name</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggle, mode === 'reg' && styles.toggleActive]} onPress={() => setMode('reg')}>
          <Text style={[styles.toggleText, mode === 'reg' && styles.toggleTextActive]}>Registration #</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder={mode === 'name' ? "Enter doctor name (min 3 chars)..." : "Enter MDC/12345..."} value={query} onChangeText={handleSearch} />
      
      {mode === 'name' && history.length > 0 && (
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Recent:</Text>
          {history.map((h, i) => (
            <TouchableOpacity key={i} style={styles.historyChip} onPress={() => handleSearch(h)}>
              <Text style={styles.historyChipText}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && <ActivityIndicator style={styles.loader} color="#0ea5e9" />}
      <FlatList data={doctors} keyExtractor={item => item.id} renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DoctorDetail', { id: item.id })}>
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.sub}>{item.specialty?.name || 'General Practice'} • {item.registration_number}</Text>
          </View>
          <StatusBadge status={item.status} />
        </TouchableOpacity>
      )} onEndReached={loadMore} onEndReachedThreshold={0.5} ListFooterComponent={loading && <ActivityIndicator />} ListEmptyComponent={query.length >= (mode === 'name' ? 3 : 5) && <Text style={styles.empty}>No doctors found</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  toggleRow: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#e2e8f0', borderRadius: 10, padding: 4 },
  toggle: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { color: '#475569', fontWeight: '600' },
  toggleTextActive: { color: '#0ea5e9' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 12, elevation: 1 },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  historyLabel: { color: '#64748b', marginRight: 6, alignSelf: 'center' },
  historyChip: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 6, marginBottom: 6 },
  historyChipText: { color: '#0369a1', fontSize: 13 },
  loader: { marginVertical: 8 },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, elevation: 1 },
  cardInfo: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 3 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15 },
});