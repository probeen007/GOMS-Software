// Bounds for user-supplied dates, kept comfortably inside the Bikram Sambat
// conversion table's supported range (1975-2099 BS, ~1918-04-13 to
// 2043-04-12 AD) so formatNepaliDate/formatNepaliDateTime can never throw
// on a value that already passed input validation.
export const MIN_SUPPORTED_AD_YEAR = 1919;
export const MAX_SUPPORTED_AD_YEAR = 2042;

export function isWithinSupportedDateRange(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getUTCFullYear();
  return year >= MIN_SUPPORTED_AD_YEAR && year <= MAX_SUPPORTED_AD_YEAR;
}

// Builds a Mongo { $gte, $lte } filter from optional startDate/endDate query
// strings (YYYY-MM-DD), used anywhere a list/export endpoint offers a
// weekly/monthly/yearly/custom date-range filter on createdAt.
export function buildDateRangeFilter(startDate, endDate) {
  let start = null;
  let end = null;

  if (startDate) {
    start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return { error: 'Invalid start date' };
    start.setHours(0, 0, 0, 0);
  }

  if (endDate) {
    end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return { error: 'Invalid end date' };
    end.setHours(23, 59, 59, 999);
  }

  if ((start && !isWithinSupportedDateRange(start)) || (end && !isWithinSupportedDateRange(end))) {
    return { error: 'Selected date range is outside the supported date range' };
  }

  const filter = {};
  if (start) filter.$gte = start;
  if (end) filter.$lte = end;
  return { filter };
}
