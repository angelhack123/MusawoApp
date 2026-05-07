import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import * as Clipboard from 'expo-clipboard';

const trackTicket = async () => {
  const ticket = ticketInput.trim().toUpperCase();
  if (!ticket.match(/^MSW-\d{4}-\d{6}$/)) {
    Alert.alert('Invalid Format', 'Use format: MSW-YYYY-NNNNNN');
    return;
  }

  setLoading(true);
  try {
    const res = await api.get(`/feedback/?ticket_number=${ticket}`);
    const data = res.data.results?.[0] || res.data;
    if (data) {
      setActiveComplaint(data);
      setShowHistory(false);
    } else {
      Alert.alert('Not Found', 'Ticket not found. Check number and try again.');
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to track complaint.');
  } finally {
    setLoading(false);
  }
};

export default function TrackScreen() {
  const [ticketInput, setTicketInput] = useState('');
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  const trackTicket = () => {
    const ticket = ticketInput.trim().toUpperCase();
    const complaint = MOCK_COMPLAINTS.find(c => c.ticket === ticket);
    
    if (!complaint) {
      Alert.alert('Ticket Not Found', 'Please check the format (MSW-YYYY-NNNNNN) and try again.');
      setActiveComplaint(null);
      return;
    }
    
    setActiveComplaint(complaint);
    setShowHistory(false);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'RESOLVED': return { bg: '#DCFCE7', text: colors.success, border: '#86EFAC' };
      case 'UNDER_REVIEW': return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' };
      case 'ESCALATED': return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
      default: return { bg: colors.gray[100], text: colors.neutral, border: colors.gray[300] };
    }
  };

  const getStatusLabel = (status) => status.replace('_', ' ');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Complaint</Text>
      </View>

      <View style={styles.content}>
        {/* Search Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Track Complaint</Text>
          <View style={styles.inputBox}>
            <Ionicons name="ticket" size={20} color={colors.neutral} style={styles.inputIcon} />
            <TextInput
              style={styles.ticketInput}
              placeholder="MSW-YYYY-NNNNNN"
              value={ticketInput}
              onChangeText={(text) => setTicketInput(text.toUpperCase())}
              placeholderTextColor={colors.neutral}
              maxLength={18}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity style={styles.trackBtn} onPress={trackTicket}>
            <Text style={styles.trackBtnText}>Check Status</Text>
          </TouchableOpacity>
        </View>

        {/* Active Complaint Timeline */}
        {activeComplaint && (
          <View style={styles.card}>
            <View style={styles.timelineHeader}>
              <Text style={styles.ticketNum}>{activeComplaint.ticket}</Text>
              <Text style={styles.facilityName}>{activeComplaint.facility}</Text>
              <Text style={styles.submittedDate}>Submitted: {activeComplaint.date}</Text>
            </View>

            <View style={styles.timeline}>
              {activeComplaint.timeline.map((step, index) => {
                const isLast = index === activeComplaint.timeline.length - 1;
                const statusStyle = getStatusStyle(step.status);
                
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: isLast ? colors.primary.teal : colors.gray[300] }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStatus}>{getStatusLabel(step.status)}</Text>
                      <Text style={styles.timelineDate}>{step.date}</Text>
                      {isLast && activeComplaint.resolution && (
                        <View style={styles.resolutionBox}>
                          <Text style={styles.resolutionLabel}>Action Taken:</Text>
                          <Text style={styles.resolutionText}>{activeComplaint.resolution}</Text>
                          <Text style={styles.resolvedDate}>Resolved: {activeComplaint.dateResolved}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {activeComplaint.status === 'RESOLVED' && (
              <View style={styles.rateSection}>
                <Text style={styles.rateQuestion}>Was this resolution satisfactory?</Text>
                <View style={styles.rateButtons}>
                  <TouchableOpacity style={styles.rateBtn}>
                    <Text style={styles.rateBtnText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.rateBtn, styles.rateBtnNo]}>
                    <Text style={styles.rateBtnText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Complaint History */}
        {showHistory && !activeComplaint && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Your History</Text>
            {MOCK_COMPLAINTS.length === 0 ? (
              <Text style={styles.emptyText}>You haven't submitted any trackable feedback yet.</Text>
            ) : (
              MOCK_COMPLAINTS.map(complaint => {
                const statusStyle = getStatusStyle(complaint.status);
                return (
                  <TouchableOpacity
                    key={complaint.ticket}
                    style={styles.historyItem}
                    onPress={() => {
                      setTicketInput(complaint.ticket);
                      setActiveComplaint(complaint);
                      setShowHistory(false);
                    }}
                  >
                    <View>
                      <Text style={styles.historyFacility}>{complaint.facility}</Text>
                      <Text style={styles.historyMeta}>{complaint.date} • {complaint.ticket}</Text>
                    </View>
                    <View style={[styles.historyStatus, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.historyStatusText, { color: statusStyle.text }]}>
                        {getStatusLabel(complaint.status)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>How Tracking Works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary.teal} />
              <Text style={styles.infoText}>Anonymous feedback is reviewed weekly</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary.teal} />
              <Text style={styles.infoText}>Ticketed complaints are escalated to facility supervisors</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary.teal} />
              <Text style={styles.infoText}>You'll be notified when the status changes</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary.dark,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  content: { padding: 16, paddingBottom: 100 },
  
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary.dark, marginBottom: 12 },
  
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  inputIcon: { marginRight: 12 },
  ticketInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'monospace',
  },
  
  trackBtn: {
    backgroundColor: colors.primary.teal,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  timelineHeader: { marginBottom: 20 },
  ticketNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.teal,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  facilityName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  submittedDate: { fontSize: 13, color: colors.neutral },
  
  timeline: { borderLeftWidth: 2, borderLeftColor: colors.gray[200], marginLeft: 10, paddingLeft: 20 },
  timelineItem: { flexDirection: 'row', marginBottom: 24, position: 'relative' },
  timelineDot: {
    position: 'absolute',
    left: -29,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineContent: { flex: 1 },
  timelineStatus: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  timelineDate: { fontSize: 12, color: colors.neutral },
  
  resolutionBox: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  resolutionLabel: { fontSize: 12, fontWeight: '600', color: colors.success, marginBottom: 4 },
  resolutionText: { fontSize: 13, color: colors.text, marginBottom: 4 },
  resolvedDate: { fontSize: 12, color: colors.neutral },
  
  rateSection: {
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  rateQuestion: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
  rateButtons: { flexDirection: 'row', gap: 12 },
  rateBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary.teal,
    alignItems: 'center',
  },
  rateBtnNo: { backgroundColor: colors.gray[200] },
  rateBtnText: { color: '#fff', fontWeight: '600' },
  
  historySection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary.dark, marginBottom: 12 },
  emptyText: { color: colors.neutral, fontStyle: 'italic', textAlign: 'center', padding: 24 },
  
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  historyFacility: { fontSize: 15, fontWeight: '600', color: colors.text },
  historyMeta: { fontSize: 12, color: colors.neutral, marginTop: 2 },
  historyStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyStatusText: { fontSize: 11, fontWeight: '600' },
  
  infoCard: { backgroundColor: colors.primary.light, borderColor: colors.primary.teal },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary.dark, marginBottom: 12 },
  infoList: { gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { fontSize: 14, color: colors.text, flex: 1 },
});