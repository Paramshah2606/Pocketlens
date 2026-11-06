// Client-side date helpers. Entries store a calendar day ("YYYY-MM-DD", saved at UTC
// midnight), so "today" must come from the user's local clock, not toISOString() (UTC),
// which is yesterday's date in India before 5:30 AM.

const pad = (n) => String(n).padStart(2, "0")

// "YYYY-MM-DD" for the user's local day
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// "YYYY-MM" for the user's local month
export function localMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

// "YYYY-MM-DD" of a stored entry date (stored at UTC midnight)
export function entryDateKey(value) {
  return new Date(value).toISOString().slice(0, 10)
}
