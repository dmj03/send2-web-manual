import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatExchangeRate,
  parseCurrencyInput,
  roundToDecimalPlaces,
} from '@/lib/utils/currency';

describe('formatCurrency', () => {
  it.each([
    [1234.56, 'GBP', 'en-GB', '£1,234.56'],
    [1000, 'USD', 'en-US', '$1,000.00'],
    [0, 'EUR', 'en-GB', '€0.00'],
    [0.5, 'GBP', 'en-GB', '£0.50'],
    [1_000_000, 'NGN', 'en-GB', '₦1,000,000.00'],
    [99.99, 'GBP', 'en-GB', '£99.99'],
  ])(
    'formats %s %s (%s) → %s',
    (amount, currency, locale, expected) => {
      expect(formatCurrency(amount, currency, locale)).toBe(expected);
    },
  );

  it('defaults locale to en-GB', () => {
    expect(formatCurrency(100, 'GBP')).toBe('£100.00');
  });
});

describe('formatExchangeRate', () => {
  it.each([
    [1.2345, 'GBP', 'USD', '1 GBP = 1.2345 USD'],
    [1668.78, 'GBP', 'NGN', '1 GBP = 1668.7800 NGN'],
    [1.0, 'USD', 'USD', '1 USD = 1.0000 USD'],
    [0.0001, 'JPY', 'VND', '1 JPY = 0.0001 VND'],
  ])('rate %s %s→%s → "%s"', (rate, from, to, expected) => {
    expect(formatExchangeRate(rate, from, to)).toBe(expected);
  });

  it('uppercases currency codes', () => {
    expect(formatExchangeRate(1.27, 'gbp', 'usd')).toBe('1 GBP = 1.2700 USD');
  });
});

describe('parseCurrencyInput', () => {
  it.each([
    ['£1,234.56', 1234.56],
    ['$500', 500],
    ['1000', 1000],
    ['0.99', 0.99],
    ['-100', -100],
    ['1,000,000', 1000000],
  ])('parses "%s" → %s', (input, expected) => {
    expect(parseCurrencyInput(input)).toBe(expected);
  });

  it.each([
    ['', null],
    ['abc', null],
    ['--', null],
    ['-', null],
    ['   ', null],
  ])('returns null for invalid "%s"', (input, expected) => {
    expect(parseCurrencyInput(input)).toBe(expected);
  });
});

describe('roundToDecimalPlaces', () => {
  it.each([
    [1.005, 2, 1.01],
    [1.2345, 2, 1.23],
    [1.2355, 2, 1.24],
    [1.0, 0, 1],
    [1234.5678, 3, 1234.568],
    [0.1 + 0.2, 1, 0.3],
    [9.999, 2, 10],
    [-1.005, 2, -1],
  ])('round(%s, %s) → %s', (value, places, expected) => {
    expect(roundToDecimalPlaces(value, places)).toBe(expected);
  });
});
