// Start date for the dashboard's time-range selector ("week" | "month" | "year").
export function getRangeStart(timeRange, now = new Date()) {
  if (timeRange === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (timeRange === 'year') return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
