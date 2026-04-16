import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidAmount, isValidCurrencyCode } from '@/lib/utils/validation';

describe('isValidEmail', () => {
  it.each([
    ['user@example.com', true],
    ['user+tag@subdomain.example.co.uk', true],
    ['james.okafor@send2.io', true],
    ['user@domain.org', true],
    ['', false],
    ['notanemail', false],
    ['@nodomain.com', false],
    ['noatsign.com', false],
    ['user@', false],
    ['user @example.com', false],
    ['user@example', false],
  ])('isValidEmail("%s") → %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});

describe('isValidAmount', () => {
  it.each([
    [100, true],
    [0.01, true],
    [1_000_000, true],
    [0, false],
    [-1, false],
    [-0.001, false],
    [Infinity, false],
    [NaN, false],
    ['100' as unknown as number, false],
    [null as unknown as number, false],
    [undefined as unknown as number, false],
  ])('isValidAmount(%s) → %s', (amount, expected) => {
    expect(isValidAmount(amount)).toBe(expected);
  });
});

describe('isValidCurrencyCode', () => {
  it.each([
    ['GBP', true],
    ['USD', true],
    ['NGN', true],
    ['EUR', true],
    ['gbp', true],    // case-insensitive
    ['usd', true],
    ['XYZ', false],
    ['', false],
    ['GB', false],    // too short
    ['GBPP', false],  // too long
    ['123', false],
  ])('isValidCurrencyCode("%s") → %s', (code, expected) => {
    expect(isValidCurrencyCode(code)).toBe(expected);
  });
});
