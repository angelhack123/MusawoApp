import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import WhatsAppShareButton from '../components/WhatsAppShareButton';


export default function VerifyScreen({ route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
      handleSearch(route.params.searchQuery);
    }
  }, [route.params?.searchQuery]);

// Remove: const MOCK_DOCTORS = [...]
// Replace handleSearch with:

const handleSearch = async (query) => {
  setSearchQuery(query);
  if (searchTimeout.current) clearTimeout(searchTimeout.current);

  searchTimeout.current = setTimeout(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = { search: query, page: 1, limit: 10 };
      if (filterSpecialty) params.specialty = filterSpecialty;
      if (filterDistrict) params.district = filterDistrict;
      if (filterActive) params.status = 'ACTIVE';

      const res = await api.get('/doctors/', { params });
      setResults(res.data.results || res.data);
      
      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('searchHistory') || '[]');
      const updated = [query, ...history.filter(h => h !== query)].slice(0, 5);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updated));
    } catch (err) {
      Alert.alert('Error', 'Failed to load doctors. Check connection.');
    } finally {
      setLoading(false);
    }
  }, 300);
};


  const openDoctorModal = (doctor) => {
    setSelectedDoctor(doctor);
    setModalVisible(true);
  };

  const shareDoctor = async (doctor) => {
    const text = `Dr. ${doctor.full_name} (${doctor.registration_number}) is ${doctor.status.replace('_', ' ').toUpperCase()} ✓ — Verified on Musawo app`;
    try {
      await Clipboard.setStringAsync(text);
      alert('Copied to clipboard!');
    } catch (error) {}
  };

  const renderDoctorCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => openDoctorModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.full_name}</Text>
        <Text style={styles.doctorSub}>{item.specialty?.name || 'General Practice'} • {item.registration_number}</Text>
      </View>
      <StatusBadge status={item.status} size="small" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verify Doctor</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.neutral} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor by name..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.neutral}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>All Specialties</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>All Districts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterActive && styles.filterChipActive]}
            onPress={() => setFilterActive(!filterActive)}
          >
            <Text style={[styles.filterChipText, filterActive && styles.filterChipTextActive]}>
              Active Only
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary.teal} />
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'Type a name or reg number to verify'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderDoctorCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Doctor Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {selectedDoctor && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedDoctor.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalName}>{selectedDoctor.full_name}</Text>
                    <Text style={styles.modalReg}>{selectedDoctor.registration_number} • {selectedDoctor.specialty?.name || 'General Practice'}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <StatusBadge status={selectedDoctor.status} size="large" />
                  </View>
                  
                  {selectedDoctor.registration_date && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Licensed since</Text>
                      <Text style={styles.modalValue}>
                        {new Date(selectedDoctor.registration_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  )}

                  {selectedDoctor.last_verified_at && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Last verified</Text>
                      <Text style={styles.modalValue}>
                        {new Date(selectedDoctor.last_verified_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {selectedDoctor.status === 'SUSPENDED' && (
                    <View style={styles.alertBox}>
                      <Text style={styles.alertText}>
                        Suspended: {selectedDoctor.suspension_reason}
                      </Text>
                      <Text style={styles.alertSub}>Date: {selectedDoctor.suspension_date}</Text>
                    </View>
                  )}
                  
                  {selectedDoctor.status === 'EXPIRED' && (
                    <View style={[styles.alertBox, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.alertText, { color: '#92400E' }]}>
                        License expired. Annual Practising License not renewed.
                      </Text>
                    </View>
                  )}
                </View>

                {selectedDoctor.facilities && selectedDoctor.facilities.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Affiliated Facilities</Text>
                    {selectedDoctor.facilities.map((facility, index) => (
                      <View key={index} style={styles.facilityItem}>
                        <Ionicons name="location" size={16} color={colors.primary.teal} />
                        <Text style={styles.facilityText}>{facility}</Text>
                      </View>
                    ))}
                  </View>
                )}
<View style={styles.modalButtons}>
  <WhatsAppShareButton doctor={selectedDoctor} size="large" style={{ flex: 1 }} />
  <TouchableOpacity 
    style={[styles.modalBtn, styles.modalBtnSecondary]}
    onPress={() => setModalVisible(false)}
  >
    <Text style={styles.modalBtnSecondaryText}>Close</Text>
  </TouchableOpacity>
</View>
</>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.primary.dark,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.teal,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.primary.teal,
  },
  resultsList: {
    padding: 16,
    paddingBottom: 100,
  },
  doctorCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.dark,
    marginBottom: 4,
  },
  doctorSub: {
    fontSize: 12,
    color: colors.neutral,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.teal,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 4,
  },
  modalReg: {
    fontSize: 14,
    color: colors.neutral,
  },
  modalSection: {
    backgroundColor: colors.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.neutral,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.dark,
    marginBottom: 12,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  facilityText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  alertBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  alertSub: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary.teal,
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnSecondary: {
    backgroundColor: colors.gray[100],
  },
  modalBtnSecondaryText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
});