// Date-only API values ("2025-12-15") are local calendar dates, not UTC instants.
export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
};

const pad = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD in local time (US-2.3); toISOString() would shift dates in EAT (UTC+3)
export const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fmt = (value, options) => {
  const d = parseDate(value);
  return d && !isNaN(d) ? d.toLocaleDateString('en-GB', options) : null;
};

export const formatDate = (value) => fmt(value, { day: 'numeric', month: 'short', year: 'numeric' });
export const formatMonthYear = (value) => fmt(value, { month: 'long', year: 'numeric' });
export const formatLongDate = (value) => fmt(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const formatDateTime = (value) => {
  const d = parseDate(value);
  if (!d || isNaN(d)) return null;
  return `${formatDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const sameDay = (a, b) => a && b && toISODate(a) === toISODate(b);

export const daysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

// "Dr. John Mukasa" -> "JM"
export const initials = (name = '') =>
  name.replace(/^(dr|prof)\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

export const withTitle = (name = '') => (/^(dr|prof)\.?\s/i.test(name) ? name : `Dr. ${name}`);

// "09:30" in the phone's local time
export const formatTime = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "Tue, 4 Nov · 09:30"
export const formatSlot = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return '';
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTime(d)}`;
};

// 50000 -> "UGX 50,000"
export const formatUGX = (amount) =>
  amount == null ? null : `UGX ${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
