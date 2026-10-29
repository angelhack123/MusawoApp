// Status presentation: colour + icon + text, never colour alone (UI Spec Mandate 2).
import { colors } from '../theme';

export const DOCTOR_STATUS = {
  ACTIVE: { key: 'active', icon: 'checkmark-circle', bg: colors.successBg, fg: colors.successText, accent: colors.success },
  SUSPENDED: { key: 'suspended', icon: 'warning', bg: colors.dangerBg, fg: colors.dangerText, accent: colors.danger },
  EXPIRED: { key: 'expired', icon: 'time', bg: colors.warningBg, fg: colors.warningText, accent: colors.warning },
  DECEASED: { key: 'deceased', icon: 'remove-circle', bg: colors.neutralBg, fg: colors.neutralText, accent: colors.neutral },
  NOT_FOUND: { key: 'notFound', icon: 'help-circle', bg: colors.neutralBg, fg: colors.neutralText, accent: colors.neutral },
};

export const doctorStatus = (status) => DOCTOR_STATUS[status] || DOCTOR_STATUS.NOT_FOUND;

export const FEEDBACK_STATUS = {
  RECEIVED: { key: 'received', icon: 'mail-open', color: colors.primary, bg: colors.primaryLight },
  UNDER_REVIEW: { key: 'underReview', icon: 'search', color: colors.info, bg: colors.infoBg },
  ESCALATED: { key: 'escalated', icon: 'arrow-up-circle', color: colors.warningText, bg: colors.warningBg },
  RESOLVED: { key: 'resolved', icon: 'checkmark-done-circle', color: colors.successText, bg: colors.successBg },
  CLOSED: { key: 'closed', icon: 'lock-closed', color: colors.neutralText, bg: colors.neutralBg },
};

export const feedbackStatus = (status) => FEEDBACK_STATUS[status] || FEEDBACK_STATUS.RECEIVED;

// Facility type groups for the finder filter (US-4.1: Hospital, Health Centre, Clinic, Pharmacy)
export const FACILITY_GROUPS = [
  { key: 'hospital', icon: 'business', types: ['NATIONAL_REFERRAL', 'REGIONAL_REFERRAL', 'GENERAL_HOSPITAL'] },
  { key: 'healthCentre', icon: 'medkit', types: ['HC_IV', 'HC_III', 'HC_II'] },
  { key: 'clinic', icon: 'pulse', types: ['CLINIC'] },
  { key: 'pharmacy', icon: 'flask', types: ['PHARMACY'] },
];

export const FACILITY_TYPES = [
  'NATIONAL_REFERRAL', 'REGIONAL_REFERRAL', 'GENERAL_HOSPITAL', 'HC_IV', 'HC_III', 'HC_II', 'CLINIC', 'PHARMACY',
];

export const facilityIcon = (type) =>
  (FACILITY_GROUPS.find(g => g.types.includes(type)) || FACILITY_GROUPS[0]).icon;

export const BOOKING_STATUS = {
  REQUESTED: { key: 'requested', icon: 'hourglass', color: colors.warningText, bg: colors.warningBg },
  ACCEPTED: { key: 'accepted', icon: 'checkmark-circle', color: colors.successText, bg: colors.successBg },
  DECLINED: { key: 'declined', icon: 'close-circle', color: colors.dangerText, bg: colors.dangerBg },
  CANCELLED: { key: 'cancelled', icon: 'remove-circle', color: colors.neutralText, bg: colors.neutralBg },
  COMPLETED: { key: 'completed', icon: 'checkmark-done-circle', color: colors.primaryDark, bg: colors.primaryLight },
};

export const bookingStatus = (status) => BOOKING_STATUS[status] || BOOKING_STATUS.REQUESTED;
