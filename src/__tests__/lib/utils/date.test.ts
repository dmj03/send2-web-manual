import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate, formatRelativeTime, isExpired } from '@/lib/utils/date';

// Fixed reference point for all time-sensitive tests
const NOW = new Date('2025-06-15T12:00:00.000Z');

afterEach(() => {
  vi.useRealTimers();
});

describe('formatDate', () => {
  it.each([
    ['2025-01-31T00:00:00.000Z', 'short', 'en-GB', '31/01/2025'],
    ['2025-01-31T00:00:00.000Z', 'medium', 'en-GB', '31 Jan 2025'],
    ['2025-03-08T00:00:00.000Z', 'short', 'en-GB', '08/03/2025'],
    ['2024-12-25T00:00:00.000Z', 'medium', 'en-GB', '25 Dec 2024'],
  ] as const)(
    '%s format="%s" locale="%s" → "%s"',
    (iso, format, locale, expected) => {
      expect(formatDate(iso, format, locale)).toBe(expected);
    },
  );

  it('defaults to medium format', () => {
    expect(formatDate('2025-06-01T00:00:00.000Z')).toMatch(/\d{1,2} \w+ \d{4}/);
  });

  it('accepts a Date object', () => {
    expect(formatDate(new Date('2025-01-31T00:00:00.000Z'), 'short', 'en-GB')).toBe(
      '31/01/2025',
    );
  });

  it('long format includes weekday and full month', () => {
    const result = formatDate('2025-06-15T00:00:00.000Z', 'long', 'en-GB');
    expect(result).toContain('June');
    expect(result).toContain('2025');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" or similar for 30 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const thirtySecondsAgo = new Date(NOW.getTime() - 30_000);
    const result = formatRelativeTime(thirtySecondsAgo);
    // Intl.RelativeTimeFormat with numeric:'auto' uses "30 seconds ago"
    expect(result).toMatch(/seconds? ago/i);
  });

  it('formats 2 hours ago correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const twoHoursAgo = new Date(NOW.getTime() - 2 * 3600 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toMatch(/2 hours? ago/i);
  });

  it('formats 3 days ago correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const threeDaysAgo = new Date(NOW.getTime() - 3 * 86400 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toMatch(/3 days? ago/i);
  });

  it('formats 5 minutes in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const fiveMinsAhead = new Date(NOW.getTime() + 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinsAhead)).toMatch(/in 5 minutes?/i);
  });

  it('accepts ISO string', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const iso = new Date(NOW.getTime() - 3600 * 1000).toISOString();
    expect(formatRelativeTime(iso)).toMatch(/hour/i);
  });
});

describe('isExpired', () => {
  it.each([
    ['2020-01-01T00:00:00.000Z', true],
    ['2000-06-01T00:00:00.000Z', true],
  ])('past date %s → expired', (iso, expected) => {
    expect(isExpired(iso)).toBe(expected);
  });

  it('future date is not expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const future = new Date(NOW.getTime() + 86400 * 1000).toISOString();
    expect(isExpired(future)).toBe(false);
  });

  it('accepts a Date object', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(isExpired(new Date(NOW.getTime() - 1))).toBe(true);
    expect(isExpired(new Date(NOW.getTime() + 60_000))).toBe(false);
  });
});
