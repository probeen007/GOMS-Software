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
