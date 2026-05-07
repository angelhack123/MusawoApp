import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    language: 'en',
    pushNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('userSettings');
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch {}
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const changeLanguage = (lang) => {
    saveSettings({ ...settings, language: lang });
    Alert.alert('Language Changed', `App language set to ${lang === 'en' ? 'English' : 'Luganda'}`);
  };

  const resetAllData = () => {
    Alert.alert(
      'Reset All Data?',
      'This will clear all local data including search history and drafts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All local data has been cleared');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        {/* Preferences Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Language */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDesc}>App display language</Text>
            </View>
            <View style={styles.languageSelector}>
              <TouchableOpacity 
                style={[styles.langBtn, settings.language === 'en' && styles.langBtnActive]}
                onPress={() => changeLanguage('en')}
              >
                <Text style={[styles.langText, settings.language === 'en' && styles.langTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.langBtn, settings.language === 'lg' && styles.langBtnActive]}
                onPress={() => changeLanguage('lg')}
              >
                <Text style={[styles.langText, settings.language === 'lg' && styles.langTextActive]}>LG</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Push Notifications */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Status updates on complaints</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(val) => toggleSetting('pushNotifications')}
              trackColor={{ false: colors.gray[300], true: colors.primary.teal }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* SMS Notifications */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>SMS Notifications</Text>
              <Text style={styles.settingDesc}>Requires phone number • ~UGX 30/SMS</Text>
            </View>
            <Switch
              value={settings.smsNotifications}
              onValueChange={(val) => toggleSetting('smsNotifications')}
              trackColor={{ false: colors.gray[300], true: colors.primary.teal }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>Musawo v1.0 (MVP)</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build Date</Text>
            <Text style={styles.infoValue}>December 2025</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data Policy</Text>
            <TouchableOpacity>
              <Text style={styles.infoLink}>View Privacy Policy →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerBtn} onPress={resetAllData}>
            <Text style={styles.dangerBtnText}>Reset All Local Data</Text>
          </TouchableOpacity>
          
          <Text style={styles.dangerHint}>
            Clears search history, drafts, and preferences. Does not affect server data.
          </Text>
        </View>

        {/* Help & Support */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <TouchableOpacity style={styles.helpItem}>
            <Ionicons name="help-circle" size={20} color={colors.primary.teal} />
            <Text style={styles.helpText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.helpItem}>
            <Ionicons name="mail" size={20} color={colors.primary.teal} />
            <Text style={styles.helpText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.helpItem}>
            <Ionicons name="document-text" size={20} color={colors.primary.teal} />
            <Text style={styles.helpText}>Patient Charter (UG)</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Musawo • Empowering Ugandan Patients</Text>
          <Text style={styles.footerText}>© 2025 GHE Consulting</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.dark,
    marginBottom: 16,
  },
  
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  settingDesc: { fontSize: 13, color: colors.neutral, marginTop: 2 },
  
  languageSelector: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  langBtnActive: { backgroundColor: colors.primary.teal },
  langText: { fontSize: 14, fontWeight: '600', color: colors.neutral },
  langTextActive: { color: '#fff' },
  
  divider: { height: 1, backgroundColor: colors.gray[200], marginVertical: 8 },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 14, color: colors.neutral },
  infoValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  infoLink: { fontSize: 14, color: colors.primary.teal, fontWeight: '500' },
  
  dangerBtn: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dangerBtnText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
  dangerHint: {
    fontSize: 12,
    color: colors.neutral,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  helpText: { flex: 1, fontSize: 15, color: colors.text },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: { fontSize: 12, color: colors.neutral, marginBottom: 4 },
});