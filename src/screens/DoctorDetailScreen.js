import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Alert } from 'react-native';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorDetailScreen({ route }) {
  const { id } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`doctors/${id}/`).then(res => setDoctor(res.data)).finally(() => setLoading(false)); }, [id]);

  if (loading) return <ActivityIndicator style={styles.center} color="#0ea5e9" size="large" />;
  if (!doctor) return <Text style={styles.center}>Doctor not found</Text>;

  const handleShare = async () => {
    try {
      await Share.share({ message: `👨‍⚕️ Dr. ${doctor.full_name} (${doctor.registration_number}) is ${doctor.status === 'ACTIVE' ? 'LICENSED & ACTIVE ✓' : doctor.status.toUpperCase()} — Verified on Musawo app` });
    } catch { Alert.alert('Share failed'); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{doctor.full_name.charAt(0)}</Text></View>
        <Text style={styles.name}>{doctor.full_name}</Text>
        <StatusBadge status={doctor.status} suspensionDate={doctor.suspension_date} suspensionReason={doctor.suspension_reason} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}><Ionicons name="school" size={18} color="#64748b" /><Text style={styles.label}>Specialty</Text></View>
        <Text style={styles.value}>{doctor.specialty?.name || 'General Practitioner'}</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.row}><Ionicons name="shield-checkmark" size={18} color="#64748b" /><Text style={styles.label}>Council & Reg #</Text></View>
        <Text style={styles.value}>{doctor.council} • {doctor.registration_number}</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.row}><Ionicons name="calendar" size={18} color="#64748b" /><Text style={styles.label}>Licensed Since</Text></View>
        <Text style={styles.value}>{doctor.registration_date ? new Date(doctor.registration_date).toLocaleDateString('en-GB', {month:'long', year:'numeric'}) : 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.row}><Ionicons name="refresh" size={18} color="#64748b" /><Text style={styles.label}>Last Verified</Text></View>
        <Text style={styles.value}>{new Date(doctor.last_verified_at).toLocaleDateString()}</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social" size={20} color="#fff" />
        <Text style={styles.shareText}>Share Verification Status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#0ea5e9' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, color: '#64748b', marginLeft: 6, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#0f172a', marginLeft: 24 },
  shareBtn: { backgroundColor: '#25D366', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, margin: 16, borderRadius: 12, elevation: 2 },
  shareText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
});