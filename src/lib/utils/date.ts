/**
 * Normalises a Date or ISO string to a Date object.
 */
function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Formats a date using Intl.DateTimeFormat with short, medium, or long presets.
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale: string = 'en-GB',
): string {
  const d = toDate(date);
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : format === 'medium'
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Returns a relative time string such as "2 hours ago" or "just now" for a given date.
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'en-GB',
): string {
  const d = toDate(date);
  const diffMs = d.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const thresholds: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [2592000, 'day'],
    [31536000, 'month'],
    [Infinity, 'year'],
  ];

  let prev = 1;
  for (const [threshold, unit] of thresholds) {
    if (Math.abs(diffSeconds) < threshold) {
      return rtf.format(Math.round(diffSeconds / prev), unit);
    }
    prev = threshold;
  }
  return rtf.format(Math.round(diffSeconds / 31536000), 'year');
}

/**
 * Parses an ISO 8601 date string into a Date object, throwing if the string is invalid.
 */
export function parseISODate(isoString: string): Date {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    throw new RangeError(`Invalid ISO date string: "${isoString}"`);
  }
  return d;
}

/**
 * Returns true if the given date is in the past.
 */
export function isExpired(date: Date | string): boolean {
  return toDate(date).getTime() < Date.now();
}

/**
 * Returns a new Date that is the given number of days after the input date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns a new Date set to midnight (00:00:00.000) on the same calendar day.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Formats a time range as a human-readable string, e.g. "1 Jan 2024, 09:00 – 17:00".
 */
export function formatTimeRange(
  start: Date,
  end: Date,
  locale: string = 'en-GB',
): string {
  const dateStr = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(start);
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const startTime = new Intl.DateTimeFormat(locale, timeOpts).format(start);
  const endTime = new Intl.DateTimeFormat(locale, timeOpts).format(end);
  return `${dateStr}, ${startTime} – ${endTime}`;
}
