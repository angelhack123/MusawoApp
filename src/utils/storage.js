// Local persistence. Retention rules come from Data Model §4 and the UI Spec mandates.
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY = 86400000;

const KEYS = {
  SETTINGS: 'm_settings',
  SEARCH_HISTORY: 'm_search_history',
  SEARCH_CACHE_INDEX: 'm_search_cache_index',
  RECENT_FACILITIES: 'm_recent_facilities',
  FEEDBACK_DRAFT: 'm_feedback_draft',
  FEEDBACK_QUEUE: 'm_feedback_queue',
  MY_TICKETS: 'm_my_tickets',
  TRACKED_TICKETS: 'm_tracked_tickets',
  PATIENT_CONTACT: 'm_patient_contact',
  DEVICE_ID: 'device_id',
};

const read = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const write = async (key, value) => {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const DEFAULT_SETTINGS = {
  lang: 'en',
  pushNotif: true,
  smsNotif: false,
  homeDistrict: null,   // { id, name }
  onboarded: false,
  consented: false,     // DPPA consent at first use (Architecture §5.3)
};

export const storage = {
  // Settings
  async getSettings() {
    return { ...DEFAULT_SETTINGS, ...(await read(KEYS.SETTINGS, {})) };
  },
  async saveSettings(settings) {
    await write(KEYS.SETTINGS, settings);
  },

  // Search history: last 5, auto-purge after 30 days (US-1.1)
  async getSearchHistory() {
    const items = await read(KEYS.SEARCH_HISTORY, []);
    const fresh = items.filter(i => Date.now() - i.at < 30 * DAY);
    if (fresh.length !== items.length) await write(KEYS.SEARCH_HISTORY, fresh);
    return fresh;
  },
  async addSearchHistory(term, mode = 'name') {
    const clean = term?.trim();
    if (!clean) return this.getSearchHistory();
    const items = await this.getSearchHistory();
    const updated = [
      { term: clean, mode, at: Date.now() },
      ...items.filter(i => i.term.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 5);
    await write(KEYS.SEARCH_HISTORY, updated);
    return updated;
  },
  async clearSearchHistory() {
    await AsyncStorage.removeItem(KEYS.SEARCH_HISTORY);
  },

  // Generic TTL cache (doctor profiles 24h, reference data 30 days)
  async cacheGet(key, maxAgeMs) {
    const entry = await read(`m_cache:${key}`, null);
    if (!entry) return null;
    if (maxAgeMs && Date.now() - entry.at > maxAgeMs) return null;
    return entry;
  },
  async cacheSet(key, data) {
    await write(`m_cache:${key}`, { data, at: Date.now() });
  },

  // Offline copies of the last 10 doctor searches (UI Spec Mandate 4)
  async cacheSearch(key, data) {
    const index = (await read(KEYS.SEARCH_CACHE_INDEX, [])).filter(k => k !== key);
    index.unshift(key);
    const evicted = index.splice(10);
    await Promise.all(evicted.map(k => AsyncStorage.removeItem(`m_cache:search:${k}`).catch(() => {})));
    await write(KEYS.SEARCH_CACHE_INDEX, index);
    await this.cacheSet(`search:${key}`, data);
  },
  async getCachedSearch(key) {
    return this.cacheGet(`search:${key}`);
  },

  // Recent facilities: last 3 (US-2.2)
  async getRecentFacilities() {
    return read(KEYS.RECENT_FACILITIES, []);
  },
  async addRecentFacility(facility) {
    const recent = await this.getRecentFacilities();
    const updated = [facility, ...recent.filter(f => f.id !== facility.id)].slice(0, 3);
    await write(KEYS.RECENT_FACILITIES, updated);
    return updated;
  },

  // Feedback draft: resumable for 24 hours (US-2.1)
  async getFeedbackDraft() {
    const draft = await read(KEYS.FEEDBACK_DRAFT, null);
    if (!draft) return null;
    if (Date.now() - draft.savedAt > DAY) {
      await AsyncStorage.removeItem(KEYS.FEEDBACK_DRAFT);
      return null;
    }
    return draft;
  },
  async saveFeedbackDraft(draft) {
    await write(KEYS.FEEDBACK_DRAFT, { ...draft, savedAt: Date.now() });
  },
  async clearFeedbackDraft() {
    await AsyncStorage.removeItem(KEYS.FEEDBACK_DRAFT);
  },

  // Submissions waiting for connectivity (UI Spec Mandate 4: queue feedback)
  async getFeedbackQueue() {
    return read(KEYS.FEEDBACK_QUEUE, []);
  },
  async setFeedbackQueue(queue) {
    await write(KEYS.FEEDBACK_QUEUE, queue);
  },

  // Tickets this device submitted (US-3.4) — merged with GET /feedback/mine
  async getMyTickets() {
    return read(KEYS.MY_TICKETS, []);
  },
  async upsertMyTickets(tickets) {
    const current = await this.getMyTickets();
    const byNumber = Object.fromEntries(current.map(t => [t.ticket_number, t]));
    tickets.forEach(t => {
      byNumber[t.ticket_number] = { ...byNumber[t.ticket_number], ...t };
    });
    const merged = Object.values(byNumber).sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''));
    await write(KEYS.MY_TICKETS, merged);
    return merged;
  },

  // Tickets the user looked up on the Track screen (SCR-011 "Recent Tickets")
  async getTrackedTickets() {
    return read(KEYS.TRACKED_TICKETS, []);
  },
  async addTrackedTicket(entry) {
    const list = await this.getTrackedTickets();
    const updated = [{ ...entry, at: Date.now() }, ...list.filter(t => t.ticket_number !== entry.ticket_number)].slice(0, 10);
    await write(KEYS.TRACKED_TICKETS, updated);
    return updated;
  },

  // Name + phone remembered on this phone to pre-fill the next booking
  async getPatientContact() {
    return read(KEYS.PATIENT_CONTACT, null);
  },
  async savePatientContact(contact) {
    await write(KEYS.PATIENT_CONTACT, contact);
  },

  async clearAll() {
    // Keep the device id so this device still matches its tickets on the server
    const deviceId = await AsyncStorage.getItem(KEYS.DEVICE_ID);
    await AsyncStorage.clear();
    if (deviceId) await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId);
  },
};
