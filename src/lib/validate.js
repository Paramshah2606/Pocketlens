import mongoose from 'mongoose';

// Input validation helpers for API routes. Request bodies are untrusted JSON, so every
// value used in a database query must be checked for type first — otherwise an object
// like { "$ne": null } would be treated as a MongoDB operator (NoSQL injection).

// Returns a trimmed string, or null when the value is not a non-empty string within max length
export function cleanString(value, { max = 200, allowEmpty = false } = {}) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!allowEmpty && !trimmed) return null;
  if (trimmed.length > max) return null;
  return trimmed;
}

// Optional text field: undefined/null/"" → "" ; non-string or too long → null (invalid)
export function optionalString(value, { max = 200 } = {}) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > max ? null : trimmed;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  const email = cleanString(value, { max: 254 });
  if (!email) return null;
  const lower = email.toLowerCase();
  return EMAIL_RE.test(lower) ? lower : null;
}

// Case-insensitive email lookup (older accounts may have been stored with capitals)
export const EMAIL_COLLATION = { locale: 'en', strength: 2 };

export function isObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value);
}

// Money amount: positive, finite, at most 2 decimals, below 10 billion
export function parseAmount(value) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n >= 1e10) return null;
  return Math.round(n * 100) / 100;
}

// Calendar date. "YYYY-MM-DD" is stored as UTC midnight so the day never shifts
// with the server's or user's timezone. Full ISO strings are accepted as-is.
export function parseDate(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;
  return date;
}

export function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function clientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || '').trim().slice(0, 64);
}
