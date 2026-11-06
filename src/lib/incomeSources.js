// Income source types, shared by the API (validation) and the UI (labels, icons, colors).
export const INCOME_SOURCES = [
  { id: 'salary', label: 'Salary', icon: '💼', color: '#22c55e' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: '#06b6d4' },
  { id: 'business', label: 'Business', icon: '🏪', color: '#3b82f6' },
  { id: 'investment', label: 'Investment', icon: '📈', color: '#8b5cf6' },
  { id: 'rental', label: 'Rental', icon: '🏠', color: '#f59e0b' },
  { id: 'gift', label: 'Gift', icon: '🎁', color: '#ec4899' },
  { id: 'refund', label: 'Refund', icon: '↩️', color: '#14b8a6' },
  { id: 'other', label: 'Other', icon: '💰', color: '#64748b' },
]

export const INCOME_SOURCE_IDS = INCOME_SOURCES.map((s) => s.id)

export function getIncomeSource(id) {
  return INCOME_SOURCES.find((s) => s.id === id) || INCOME_SOURCES[INCOME_SOURCES.length - 1]
}
