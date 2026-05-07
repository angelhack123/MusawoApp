import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('searchHistory');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (error) {}
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem('searchHistory');
    setRecentSearches([]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Ionicons name="information-circle" size={28} color={colors.primary.teal} />
          <Text style={styles.headerTitle}>MUSAWO</Text>
        </View>
        <Text style={styles.headerSubtitle}>Home</Text>
      </View>

      <View style={styles.content}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Musawo</Text>
          <Text style={styles.welcomeText}>
            Empowering patients with verified information and a secure voice.
          </Text>
          <View style={styles.welcomeButtons}>
            <TouchableOpacity 
              style={[styles.welcomeBtn, styles.welcomeBtnPrimary]}
              onPress={() => navigation.navigate('Verify')}
            >
              <Text style={styles.welcomeBtnPrimaryText}>Verify Doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.welcomeBtn, styles.welcomeBtnSecondary]}
              onPress={() => navigation.navigate('Feedback')}
            >
              <Text style={styles.welcomeBtnSecondaryText}>Give Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Track')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="list" size={20} color="#2563EB" />
              </View>
              <Text style={styles.quickActionText}>Track Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="location" size={20} color="#059669" />
              </View>
              <Text style={styles.quickActionText}>Find Facility</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chipContainer}>
            {recentSearches.length === 0 ? (
              <Text style={styles.emptyText}>No recent searches</Text>
            ) : (
              recentSearches.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => navigation.navigate('Verify', { searchQuery: term })}
                >
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeCard: {
    backgroundColor: colors.primary.teal,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  welcomeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  welcomeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeBtnPrimary: {
    backgroundColor: '#fff',
  },
  welcomeBtnPrimaryText: {
    color: colors.primary.teal,
    fontWeight: '600',
    fontSize: 15,
  },
  welcomeBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  welcomeBtnSecondaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.dark,
  },
  clearText: {
    fontSize: 12,
    color: colors.neutral,
    textDecorationLine: 'underline',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyText: {
    color: colors.neutral,
    fontStyle: 'italic',
    fontSize: 14,
  },
});