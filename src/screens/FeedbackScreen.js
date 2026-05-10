import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { api } from '../api/client';
import CalendarPicker from '../components/CalendarPicker';

const MOCK_FACILITIES = [
  { id: 'f1', name: 'Mulago National Referral Hospital', type: 'Hospital', district: 'Kampala', score: 3.8 },
  { id: 'f2', name: 'Nsambya Hospital', type: 'Hospital', district: 'Kampala', score: 4.2 },
  { id: 'f3', name: 'St. Francis Hospital Nsambya', type: 'Health Centre IV', district: 'Kampala', score: 4.0 },
  { id: 'f4', name: 'Entebbe Health Centre III', type: 'Health Centre III', district: 'Entebbe', score: 3.5 },
  { id: 'f5', name: 'Jinja Regional Hospital', type: 'Hospital', district: 'Jinja', score: 3.2 },
];

const QUESTIONS = [
  { id: 'q1_introduced', q: 'Did the healthcare provider introduce themselves by name?', type: 'yn', right: 'Patient Charter: You have the right to know the identity of those treating you.' },
  { id: 'q2_explained', q: 'Did they explain your diagnosis in words you understood?', type: 'ynna', right: 'Right to clear communication and understandable medical information.' },
  { id: 'q3_sideeffects', q: 'Did they explain any side effects of your treatment?', type: 'ynna', right: 'Right to informed consent and awareness of treatment risks.' },
  { id: 'q4_payment', q: 'Were you asked for any payment outside the official bill?', type: 'yn', right: 'Right to transparent billing. (Triggers automatic flag)' },
  { id: 'q5_rating', q: 'Overall, how would you rate your experience?', type: 'stars', right: 'Your rating helps improve care quality for all Ugandans.' },
];

export default function FeedbackScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [facilityQuery, setFacilityQuery] = useState('');
  const [facilityResults, setFacilityResults] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [recentFacilities, setRecentFacilities] = useState([]);
  const [visitDate, setVisitDate] = useState(new Date());
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', desc: '' });

  useEffect(() => {
    loadRecentFacilities();
    loadDraft();
  }, []);

  const loadRecentFacilities = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentFacilities');
      if (stored) setRecentFacilities(JSON.parse(stored));
    } catch {}
  };

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem('feedbackDraft');
      if (draft) {
        const data = JSON.parse(draft);
        if (Date.now() - data.savedAt < 86400000) {
          if (data.facility) setSelectedFacility(data.facility);
          if (data.visitDate) setVisitDate(new Date(data.visitDate));
          if (data.answers) setAnswers(data.answers);
          if (data.comment) setComment(data.comment);
          if (data.anonymous !== undefined) setAnonymous(data.anonymous);
          if (data.step) setStep(data.step);
        }
      }
    } catch {}
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem('feedbackDraft', JSON.stringify({
        facility: selectedFacility,
        visitDate: visitDate.toISOString(),
        answers,
        comment,
        anonymous,
        step,
        savedAt: Date.now(),
      }));
    } catch {}
  };

  const searchFacilities = async (query) => {
    setFacilityQuery(query);
    if (query.length >= 2) {
      try {
        const res = await api.get('/facilities/', { params: { search: query } });
        setFacilityResults(res.data.results || res.data);
      } catch {
        setFacilityResults([]);
      }
    } else {
      setFacilityResults([]);
    }
  };

  const selectFacility = async (facility) => {
    setSelectedFacility(facility);
    const recent = [facility, ...recentFacilities.filter(f => f.id !== facility.id)].slice(0, 3);
    setRecentFacilities(recent);
    await AsyncStorage.setItem('recentFacilities', JSON.stringify(recent));
    saveDraft();
  };

  const selectAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    saveDraft();
  };

  const isQuickMatch = (label, date) => {
    const today = new Date();
    const d = new Date(date);
    if (label === 'Today') return d.toDateString() === today.toDateString();
    if (label === 'Yesterday') {
      const y = new Date(); y.setDate(y.getDate() - 1);
      return d.toDateString() === y.toDateString();
    }
    if (label === 'This Week') {
      const w = new Date(); w.setDate(w.getDate() - 7);
      return d.toDateString() === w.toDateString();
    }
    return false;
  };

  const showInfo = (title, desc) => {
    setInfoModal({ visible: true, title, desc });
  };

  const canProceed = () => {
    if (step === 1) return selectedFacility !== null && selectedFacility !== undefined;
    if (step === 2) return visitDate !== null;
    if (step === 3) return Object.keys(answers).length >= 3;
    return true;
  };

  const nextStep = () => {
    if (canProceed()) {
      setStep(prev => prev + 1);
      saveDraft();
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

// In submitFeedback():
const submitFeedback = async () => {
  if (!selectedFacility || !visitDate) {
    Alert.alert('Incomplete', 'Please select facility and date');
    return;
  }

  setLoading(true);
  try {
    const payload = {
      facility: selectedFacility?.id || selectedFacility,
      visit_date: visitDate.toISOString().split('T')[0],
      is_anonymous: anonymous,
      q1_introduced: answers.q1_introduced,
      q2_explained: answers.q2_explained,
      q3_side_effects: answers.q3_side_effects,
      q4_unofficial_payment: answers.q4_payment,
      q5_overall_rating: answers.q5_rating,
      comment: comment || null,
    };

    const res = await api.post('/feedback/', payload);
    setTicketNumber(res.data.ticket_number || null);
    setSubmitted(true);
    await AsyncStorage.removeItem('feedbackDraft');
  } catch (err) {
    Alert.alert('Submission Failed', err.message || 'Check connection and try again.');
  } finally {
    setLoading(false);
  }
};

  const copyTicket = async () => {
    if (ticketNumber) {
      try {
        await Clipboard.setStringAsync(ticketNumber);
        Alert.alert('Copied', 'Ticket number saved to clipboard');
      } catch {}
    }
  };

  const exitConfirm = () => {
    Alert.alert(
      'Exit Feedback?',
      'Your progress will be saved for 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => navigation.goBack() },
      ]
    );
  };

  // Render Step 1: Facility Selection
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Select Facility</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.neutral} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search facility name..."
          value={facilityQuery}
          onChangeText={searchFacilities}
          placeholderTextColor={colors.neutral}
        />
      </View>
      
      {recentFacilities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent</Text>
          {recentFacilities.map(facility => (
            <TouchableOpacity
              key={facility.id}
              style={[styles.facilityOption, selectedFacility?.id === facility.id && styles.facilityOptionSelected]}
              onPress={() => selectFacility(facility)}
            >
              <View>
                <Text style={styles.facilityName}>{facility.name}</Text>
                <Text style={styles.facilitySub}>{facility.type || facility.facility_type}</Text>
              </View>
              {selectedFacility?.id === facility.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary.teal} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Search Results</Text>
        {facilityResults.length === 0 ? (
          <Text style={styles.emptyText}>Type to search facilities...</Text>
        ) : (
          facilityResults.map(facility => (
            <TouchableOpacity
              key={facility.id}
              style={[styles.facilityOption, selectedFacility?.id === facility.id && styles.facilityOptionSelected]}
              onPress={() => selectFacility(facility)}
            >
              <View>
                <Text style={styles.facilityName}>{facility.name}</Text>
                <Text style={styles.facilitySub}>{facility.district} • {facility.type || facility.facility_type}</Text>
              </View>
              {selectedFacility?.id === facility.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary.teal} />
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity 
        style={styles.manualBtn}
        onPress={() => Alert.alert('Manual Entry', 'Feature coming soon. Please search or select a recent facility.')}
      >
        <Text style={styles.manualText}>Can't find facility? Add manually</Text>
      </TouchableOpacity>
    </View>
  );

  // Render Step 2: Visit Date
  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>When did you visit?</Text>

      <View style={styles.quickDates}>
        {['Today', 'Yesterday', 'This Week'].map(label => (
          <TouchableOpacity
            key={label}
            style={[styles.quickDateBtn, visitDate && isQuickMatch(label, visitDate) && styles.quickDateBtnActive]}
            onPress={() => {
              const d = new Date();
              if (label === 'Yesterday') d.setDate(d.getDate() - 1);
              if (label === 'This Week') d.setDate(d.getDate() - 7);
              setVisitDate(d);
              saveDraft();
            }}
          >
            <Text style={[styles.quickDateText, visitDate && isQuickMatch(label, visitDate) && styles.quickDateTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <CalendarPicker
        value={visitDate}
        onChange={(date) => { setVisitDate(date); saveDraft(); }}
        maxDate={new Date()}
        minDate={new Date(Date.now() - 30 * 86400000)}
      />

      <Text style={styles.dateHint}>Only visits within the last 30 days are accepted.</Text>
    </View>
  );

  // Render Step 3: Questions
  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Your Experience</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Questions derived from the Uganda Patient Charter. Answer honestly.
        </Text>
      </View>

      {QUESTIONS.map((q, index) => (
        <View key={q.id} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>Q{index + 1}: {q.q}</Text>
            <TouchableOpacity onPress={() => showInfo('Patient Right', q.right)}>
              <Ionicons name="information-circle" size={20} color={colors.primary.teal} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.answerOptions}>
            {q.type === 'stars' ? (
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.star, answers[q.id] >= n && styles.starActive]}
                    onPress={() => selectAnswer(q.id, n)}
                  >
                    <Text style={answers[q.id] >= n ? styles.starTextActive : styles.starText}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.btnRow}>
                {(q.type === 'ynna' ? ['Yes', 'No', 'N/A'] : ['Yes', 'No']).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.answerBtn,
                      answers[q.id] === opt && styles.answerBtnActive,
                    ]}
                    onPress={() => selectAnswer(q.id, opt)}
                  >
                    <Text style={answers[q.id] === opt ? styles.answerTextActive : styles.answerText}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  // Render Step 4: Final Details
  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Final Details</Text>
      
      <View style={styles.textAreaWrap}>
        <TextInput
          style={styles.textArea}
          placeholder="Tell us more about your experience (optional)"
          maxLength={500}
          value={comment}
          onChangeText={(text) => { setComment(text); saveDraft(); }}
          multiline
          placeholderTextColor={colors.neutral}
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      <TouchableOpacity 
        style={styles.anonToggle}
        onPress={() => { setAnonymous(!anonymous); saveDraft(); }}
      >
        <View style={[styles.toggleTrack, anonymous && styles.toggleTrackActive]}>
          <View style={[styles.toggleDot, anonymous && styles.toggleDotActive]} />
        </View>
        <View style={styles.anonInfo}>
          <Text style={styles.anonTitle}>Submit Anonymously</Text>
          <Text style={styles.anonDesc}>
            {anonymous 
              ? "Your identity will not be shared with the facility or anyone else." 
              : "You will receive a ticket number to track your complaint's progress."}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitBtn, (!canProceed() || loading) && styles.submitBtnDisabled]}
        onPress={submitFeedback}
        disabled={!canProceed() || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Submit Feedback</Text>
        }
      </TouchableOpacity>
    </View>
  );

  // Render Success Screen
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={40} color={colors.success} />
      </View>
      <Text style={styles.successTitle}>Thank You!</Text>
      <Text style={styles.successDesc}>
        Your feedback helps improve healthcare for all Ugandans.
      </Text>
      
      {ticketNumber && !anonymous && (
        <View style={styles.ticketBox}>
          <Text style={styles.ticketLabel}>Your Ticket Number</Text>
          <Text style={styles.ticketNum}>{ticketNumber}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={copyTicket}>
            <Text style={styles.copyText}>📋 Copy to Clipboard</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>What happens next?</Text>
        <Text style={styles.nextStepsText}>• Our team reviews your feedback within 48 hours</Text>
        <Text style={styles.nextStepsText}>• Facilities are notified of constructive feedback</Text>
        <Text style={styles.nextStepsText}>• Official payments (Q4) are auto-escalated to UMDPC</Text>
      </View>

      <TouchableOpacity 
        style={styles.homeBtn}
        onPress={() => {
          setSubmitted(false);
          setStep(1);
          setAnswers({});
          setComment('');
          setSelectedFacility(null);
          navigation.navigate('Home');
        }}
      >
        <Text style={styles.homeText}>Return Home</Text>
      </TouchableOpacity>
    </View>
  );

  if (submitted) {
    return renderSuccess();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Give Feedback</Text>
        <TouchableOpacity onPress={exitConfirm}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(n => (
          <View 
            key={n} 
            style={[
              styles.progressDot,
              n < step && styles.progressDotDone,
              n === step && styles.progressDotActive,
            ]} 
          />
        ))}
      </View>
      <Text style={styles.stepIndicator}>Step {step} of 4</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navButtons}>
        {step > 1 && (
          <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
            <Text style={styles.prevText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 4 && (
          <TouchableOpacity 
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            onPress={nextStep}
            disabled={!canProceed()}
          >
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info Modal */}
      <Modal
        visible={infoModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal({ visible: false, title: '', desc: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{infoModal.title}</Text>
            <Text style={styles.modalDesc}>{infoModal.desc}</Text>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setInfoModal({ visible: false, title: '', desc: '' })}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary.dark,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  exitText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.card,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray[300],
  },
  progressDotActive: {
    width: 24,
    borderRadius: 5,
    backgroundColor: colors.primary.teal,
  },
  progressDotDone: {
    backgroundColor: colors.primary.teal,
  },
  stepIndicator: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.neutral,
    marginBottom: 8,
  },
  
  content: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 16,
  },
  
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    color: colors.neutral,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  
  facilityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  facilityOptionSelected: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.teal,
  },
  facilityName: { fontSize: 15, fontWeight: '600', color: colors.text },
  facilitySub: { fontSize: 12, color: colors.neutral, marginTop: 2 },
  
  manualBtn: { padding: 12, alignItems: 'center' },
  manualText: { color: colors.primary.teal, fontWeight: '600', fontSize: 14 },
  emptyText: { color: colors.neutral, fontStyle: 'italic', textAlign: 'center', padding: 16 },
  
  quickDates: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickDateBtn: {
    flex: 1,
    backgroundColor: colors.gray[100],
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickDateBtnActive: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.teal,
  },
  quickDateText: { fontSize: 13, fontWeight: '500', color: colors.text },
  quickDateTextActive: { color: colors.primary.teal, fontWeight: '700' },
  
  dateHint: { fontSize: 12, color: colors.danger, marginTop: 10 },
  
  infoBox: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: { fontSize: 13, color: colors.neutral },
  
  questionCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionText: { fontSize: 15, fontWeight: '500', color: colors.text, flex: 1, marginRight: 8 },
  
  answerOptions: { marginTop: 8 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  starActive: { backgroundColor: colors.warning },
  starText: { fontSize: 20, color: colors.warning },
  starTextActive: { fontSize: 20, color: '#fff' },
  
  btnRow: { flexDirection: 'row', gap: 8 },
  answerBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  answerBtnActive: { backgroundColor: colors.primary.teal },
  answerText: { color: colors.text, fontWeight: '600' },
  answerTextActive: { color: '#fff', fontWeight: '600' },
  
  textAreaWrap: { position: 'relative', marginBottom: 16 },
  textArea: {
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: colors.neutral,
  },
  
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[300],
    padding: 2,
    marginRight: 12,
  },
  toggleTrackActive: { backgroundColor: colors.success },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  toggleDotActive: { transform: [{ translateX: 20 }] },
  anonInfo: { flex: 1 },
  anonTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  anonDesc: { fontSize: 13, color: colors.neutral, marginTop: 4 },
  
  submitBtn: {
    backgroundColor: colors.primary.teal,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.gray[300] },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  prevBtn: {
    flex: 1,
    padding: 14,
    marginRight: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    alignItems: 'center',
  },
  prevText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  nextBtn: {
    flex: 1,
    padding: 14,
    marginLeft: 8,
    backgroundColor: colors.primary.teal,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: colors.gray[300] },
  nextText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    maxWidth: 300,
    width: '100%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary.dark, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: colors.neutral, marginBottom: 16, lineHeight: 20 },
  modalClose: {
    backgroundColor: colors.primary.teal,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: '600' },
  
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 16,
    color: colors.neutral,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  ticketBox: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  ticketLabel: { fontSize: 14, color: colors.neutral, marginBottom: 4 },
  ticketNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.teal,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  copyBtn: {
    backgroundColor: colors.primary.light,
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  copyText: { fontWeight: '600', color: colors.primary.teal },
  
  nextSteps: {
    backgroundColor: colors.primary.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
    maxWidth: 320,
  },
  nextStepsTitle: { fontWeight: 'bold', color: colors.primary.dark, marginBottom: 8 },
  nextStepsText: { fontSize: 14, color: colors.neutral, marginBottom: 4 },
  
  homeBtn: {
    backgroundColor: colors.primary.dark,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  homeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});