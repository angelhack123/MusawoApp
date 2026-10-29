// Booking endpoints: patient booking (no account) and staff workspaces (token auth).
import { api } from './client';
import { PAGE_SIZE } from '../config';

const page = (res) => ({
  items: res.data.results ?? res.data,
  hasMore: Boolean(res.data.next),
  count: res.data.count ?? (res.data.length || 0),
});
const data = (res) => res.data;

export const BookingAPI = {
  doctors: ({ q, districtId, specialtyId, pageNum = 1 }) => api.get('booking/doctors/', {
    params: { q: q || undefined, district_id: districtId || undefined, specialty_id: specialtyId || undefined, page: pageNum, limit: PAGE_SIZE },
  }).then(page),
  doctor: (id) => api.get(`booking/doctors/${id}/`).then(data),
  // Without `date`: [{date, open_slots}] for the next 14 days; with `date`: [{start, end}]
  slots: (doctorId, facilityId, date) =>
    api.get(`booking/doctors/${doctorId}/slots/`, { params: { facility_id: facilityId, date } }).then(data),
  create: (payload) => api.post('bookings/', payload).then(data),
  mine: () => api.get('bookings/mine/').then(data),
  cancel: (reference, reason) => api.post(`bookings/${reference}/cancel/`, { reason }).then(data),
};

export const StaffAPI = {
  register: (payload) => api.post('auth/register/', payload).then(data),
  login: (email, password) => api.post('auth/login/', { email, password }).then(data),
  logout: () => api.post('auth/logout/'),
  me: () => api.get('auth/me/').then(data),
  pushToken: (token) => api.post('auth/push-token/', { token }).then(data),

  // Doctor
  myFacilities: () => api.get('me/doctor/facilities/').then(data),
  setFee: (linkId, fee) => api.patch(`me/doctor/facilities/${linkId}/`, { consultation_fee: fee }).then(data),
  availability: () => api.get('me/availability/').then(data),
  addAvailability: (payload) => api.post('me/availability/', payload).then(data),
  updateAvailability: (id, payload) => api.patch(`me/availability/${id}/`, payload).then(data),
  deleteAvailability: (id) => api.delete(`me/availability/${id}/`),
  doctorBookings: (scope, pageNum = 1) =>
    api.get('me/doctor/bookings/', { params: { scope, page: pageNum, limit: 20 } }).then(page),
  doctorBooking: (id) => api.get(`me/doctor/bookings/${id}/`).then(data),
  bookingAction: (id, action, reason) => api.post(`me/doctor/bookings/${id}/${action}/`, { reason }).then(data),

  // Facility owner
  ownedFacilities: () => api.get('me/facilities/').then(data),
  ownedFacility: (id) => api.get(`me/facilities/${id}/`).then(data),
  createFacility: (payload) => api.post('me/facilities/', payload).then(data),
  updateFacility: (id, payload) => api.patch(`me/facilities/${id}/`, payload).then(data),
  linkDoctor: (facilityId, registrationNumber) =>
    api.post(`me/facilities/${facilityId}/link-doctor/`, { registration_number: registrationNumber }).then(data),
  unlinkDoctor: (facilityId, doctorId) =>
    api.post(`me/facilities/${facilityId}/unlink-doctor/`, { doctor_id: doctorId }).then(data),
  schedule: (facilityId, date) => api.get(`me/facilities/${facilityId}/schedule/`, { params: { date } }).then(data),

  // Inbox
  notifications: (pageNum = 1) => api.get('me/notifications/', { params: { page: pageNum, limit: 30 } }).then(page),
  markRead: (ids) => api.post('me/notifications/read/', ids ? { ids } : {}).then(data),
};
