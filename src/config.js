import Constants from 'expo-constants';

export const API_URL = 'https://musawobackend1-production.up.railway.app/api';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// Business rules shared with the backend (User Stories, API Spec)
export const MIN_SEARCH_CHARS = 3;
export const PAGE_SIZE = 10;
export const FEEDBACK_WINDOW_DAYS = 30;
export const COMMENT_MAX = 500;
export const TICKET_RE = /^MSW-\d{4}-\d{6}$/;
export const REG_NUMBER_RE = /^(MDC\/)?\d{4,6}$/i;

// TODO(GHE): fill in before release; the Contact screen shows whatever is set here
export const SUPPORT_CONTACT = {
  organisation: 'GHE Consulting',
  email: 'akisuule@ghe-insights.com',
  phone: '0753212693',
};
