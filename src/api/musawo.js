// Typed wrappers over the Musawo API (API Specification v1) with offline fallbacks.
import { api } from './client';
import { storage } from '../utils/storage';
import { PAGE_SIZE } from '../config';

const DAY = 86400000;

const page = (res) => ({
  items: res.data.results ?? res.data,
  hasMore: Boolean(res.data.next),
  count: res.data.count ?? (res.data.length || 0),
});

// Serve from cache when offline; `fromCache` lets screens show an offline banner
const withCache = async (key, maxAgeMs, fetcher) => {
  const cached = await storage.cacheGet(key, maxAgeMs);
  if (cached) return { data: cached.data, fromCache: false };
  try {
    const data = await fetcher();
    storage.cacheSet(key, data);
    return { data, fromCache: false };
  } catch (err) {
    const stale = err.offline && (await storage.cacheGet(key));
    if (stale) return { data: stale.data, fromCache: true };
    throw err;
  }
};

export const ReferenceAPI = {
  districts: () => withCache('districts', 30 * DAY, () => api.get('districts/').then(r => r.data)),
  specialties: () => withCache('specialties', 30 * DAY, () => api.get('specialties/').then(r => r.data)),
};

export const DoctorsAPI = {
  async search({ q, specialtyId, districtId, activeOnly, pageNum = 1 }) {
    const params = {
      q, page: pageNum, limit: PAGE_SIZE,
      specialty_id: specialtyId || undefined,
      district_id: districtId || undefined,
      active_only: activeOnly ? 'true' : undefined,
    };
    const key = JSON.stringify(params);
    try {
      const result = page(await api.get('doctors/search/', { params }));
      if (pageNum === 1) storage.cacheSearch(key, result);
      return { ...result, fromCache: false };
    } catch (err) {
      const cached = err.offline && pageNum === 1 && (await storage.getCachedSearch(key));
      if (cached) return { ...cached.data, hasMore: false, fromCache: true };
      throw err;
    }
  },

  // Returns the doctor, or null when not in the register (NOT_FOUND)
  async verify(regNumber) {
    try {
      const doctor = (await api.get(`doctors/verify/${regNumber}/`)).data;
      storage.cacheSet(`doctor:${doctor.id}`, doctor);
      return doctor;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  // Profile cached for 24 hours (US-1.4)
  get: (id) => withCache(`doctor:${id}`, DAY, () => api.get(`doctors/${id}/`).then(r => r.data)),
};

export const FacilitiesAPI = {
  async list({ q, districtId, types, ownership, pageNum = 1, limit = 20 }) {
    const params = {
      q: q || undefined, page: pageNum, limit,
      district_id: districtId || undefined,
      type: types?.length ? types.join(',') : undefined,
      ownership: ownership || undefined,
    };
    return page(await api.get('facilities/', { params }));
  },
  get: (id) => api.get(`facilities/${id}/`).then(r => r.data),
  doctors: (id) => api.get(`facilities/${id}/doctors/`).then(r => r.data),
  suggest: ({ name, districtId, type }) =>
    api.post('facilities/suggest/', { name, district_id: districtId, type }).then(r => r.data),
};

export const FeedbackAPI = {
  submit: (payload) => api.post('feedback/', payload).then(r => r.data),
  // Returns null when the ticket doesn't exist
  async track(ticket) {
    try {
      return (await api.get(`feedback/${ticket}/`)).data;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },
  mine: () => api.get('feedback/mine/').then(r => r.data),
  rate: (ticket, satisfied) => api.post(`feedback/${ticket}/rate/`, { satisfied }).then(r => r.data),
};

// Remember a submitted ticket locally so "My Complaints" works offline too
export const rememberTicket = (res, facilityName) => {
  if (!res?.ticket_number) return;
  return storage.upsertMyTickets([{
    ticket_number: res.ticket_number,
    status: res.status,
    lastSeenStatus: res.status,
    submitted_at: res.submitted_at,
    facility: { name: facilityName },
  }]);
};

// Send queued offline submissions; returns how many were delivered.
// Single-flight: Home and Track both flush on focus and must not double-submit.
let flushing = null;
export const flushFeedbackQueue = () => {
  if (!flushing) flushing = doFlush().finally(() => { flushing = null; });
  return flushing;
};

const doFlush = async () => {
  const queue = await storage.getFeedbackQueue();
  if (!queue.length) return 0;
  const remaining = [];
  let sent = 0;
  for (const item of queue) {
    try {
      const res = await FeedbackAPI.submit(item.payload);
      await rememberTicket(res, item.facilityName);
      sent += 1;
    } catch (err) {
      // Keep it only if we're still offline; validation failures (e.g. expired date) are dropped
      if (err.offline) remaining.push(item);
    }
  }
  await storage.setFeedbackQueue(remaining);
  return sent;
};

// Refresh "My Complaints" from the server and report which tickets changed status
export const syncMyTickets = async () => {
  const local = await storage.getMyTickets();
  let remote = [];
  try { remote = await FeedbackAPI.mine(); } catch { return { tickets: local, updated: [] }; }
  const seen = Object.fromEntries(local.map(t => [t.ticket_number, t.lastSeenStatus]));
  const tickets = await storage.upsertMyTickets(remote.map(t => ({ ...t, lastSeenStatus: seen[t.ticket_number] ?? t.status })));
  return { tickets, updated: tickets.filter(t => t.lastSeenStatus && t.lastSeenStatus !== t.status) };
};

// Clears the "updated" dot for one of this device's own tickets
export const markTicketSeen = async (ticket) => {
  const mine = await storage.getMyTickets();
  if (!mine.some(t => t.ticket_number === ticket.ticket_number)) return;
  await storage.upsertMyTickets([{ ticket_number: ticket.ticket_number, status: ticket.status, lastSeenStatus: ticket.status }]);
};
