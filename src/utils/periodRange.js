// Computes { start, end } (YYYY-MM-DD) for a quick period preset, so
// "weekly/monthly/yearly" filtering doesn't require picking exact dates.
// Week runs Sunday-Saturday to match this shop's Sun-Fri work week.
export function getPeriodRange(period) {
  const now = new Date();
  let start;
  let end;

  if (period === 'week') {
    const day = now.getDay();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  } else {
    return { start: '', end: '' };
  }

  const fmt = (d) => d.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(end) };
}
