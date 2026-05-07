import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SEARCH_HISTORY: 'm_search_history',
  FEEDBACK_DRAFT: 'm_feedback_draft',
  SETTINGS: 'm_settings',
  RECENT_FACILITIES: 'm_recent_facilities',
};

export const storage = {
  // Search History (last 5, auto-purge 30 days)
  async addToSearchHistory(term) {
    if (!term?.trim()) return [];
    try {
      const history = JSON.parse(await AsyncStorage.getItem(KEYS.SEARCH_HISTORY) || '[]');
      const updated = [term.trim(), ...history.filter(t => t !== term)].slice(0, 5);
      await AsyncStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
      return updated;
    } catch { return []; }
  },
  async getSearchHistory() {
    try { return JSON.parse(await AsyncStorage.getItem(KEYS.SEARCH_HISTORY) || '[]'); } catch { return []; }
  },
  async clearSearchHistory() {
    await AsyncStorage.removeItem(KEYS.SEARCH_HISTORY);
  },

  // Feedback Draft (resume within 24h)
  async saveFeedbackDraft(draft) {
    await AsyncStorage.setItem(KEYS.FEEDBACK_DRAFT, JSON.stringify({ ...draft, savedAt: Date.now() }));
  },
  async getFeedbackDraft() {
    try {
      const raw = await AsyncStorage.getItem(KEYS.FEEDBACK_DRAFT);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      // Expire after 24 hours
      if (Date.now() - draft.savedAt > 86400000) {
        await AsyncStorage.removeItem(KEYS.FEEDBACK_DRAFT);
        return null;
      }
      return draft;
    } catch { return null; }
  },
  async clearFeedbackDraft() {
    await AsyncStorage.removeItem(KEYS.FEEDBACK_DRAFT);
  },

  // Settings
  async getSettings() {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : { lang: 'en', pushNotif: true, smsNotif: false };
    } catch { return { lang: 'en', pushNotif: true, smsNotif: false }; }
  },
  async updateSettings(updates) {
    const current = await this.getSettings();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...updates }));
  },

  // Recent Facilities (last 3)
  async addToRecentFacilities(facility) {
    try {
      const recent = JSON.parse(await AsyncStorage.getItem(KEYS.RECENT_FACILITIES) || '[]');
      const updated = [facility, ...recent.filter(f => f.id !== facility.id)].slice(0, 3);
      await AsyncStorage.setItem(KEYS.RECENT_FACILITIES, JSON.stringify(updated));
    } catch {}
  },
  async getRecentFacilities() {
    try { return JSON.parse(await AsyncStorage.getItem(KEYS.RECENT_FACILITIES) || '[]'); } catch { return []; }
  },
};