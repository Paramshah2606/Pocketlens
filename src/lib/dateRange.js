import { parseDate } from '@/lib/validate';

const DAY_MS = 24 * 60 * 60 * 1000;

// Start of the dashboard's time range ("week" | "month" | "year").
// Entry dates are calendar days stored at UTC midnight, so ranges are computed in UTC
// from the user's own "today" (?today=YYYY-MM-DD from the browser); without it, the
// server's UTC date is used.
export function getRangeStart(timeRange, todayParam) {
  const today = parseDate(todayParam || '') || parseDate(new Date().toISOString().slice(0, 10));
  if (timeRange === 'week') {
    // Week starts on Sunday, matching the dashboard's existing behaviour
    return new Date(today.getTime() - today.getUTCDay() * DAY_MS);
  }
  if (timeRange === 'year') return new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
}

// Exclusive end of the same range: the start of the next week / month / year
export function getRangeEnd(timeRange, todayParam) {
  const start = getRangeStart(timeRange, todayParam);
  if (timeRange === 'week') return new Date(start.getTime() + 7 * DAY_MS);
  if (timeRange === 'year') return new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

// "YYYY-MM-DD" of a UTC-midnight date
export const toDateKey = (date) => date.toISOString().slice(0, 10);
