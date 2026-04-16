import { describe, it, expect } from 'vitest';
import { slugify, truncate, capitalize, toTitleCase, pluralize } from '@/lib/utils/string';

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  trimmed  ', 'trimmed'],
    ['Hello, World!', 'hello-world'],
    ['Multiple   Spaces', 'multiple-spaces'],
    ['résumé café', 'resume-cafe'],
    ['snake_case_string', 'snakecasestring'],
    ['already-slugged', 'already-slugged'],
    ['100% Pure & Clean', '100-pure-clean'],
  ])('slugify("%s") → "%s"', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('truncate', () => {
  it('does not truncate when string is within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis when over limit', () => {
    expect(truncate('Hello World', 8)).toBe('Hello W…');
  });

  it('truncates exactly at limit', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });

  it('supports custom ellipsis string', () => {
    expect(truncate('Hello World', 8, '...')).toBe('Hello...');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it.each([
    ['A very long sentence that needs to be cut off', 20, 'A very long sentence…'],
    ['Short', 100, 'Short'],
  ])('truncate(%s, %s) → "%s"', (s, max, expected) => {
    expect(truncate(s, max)).toBe(expected);
  });
});

describe('capitalize', () => {
  it.each([
    ['hello', 'Hello'],
    ['world', 'World'],
    ['ALREADY', 'ALREADY'],
    ['already capitalized', 'Already capitalized'],
    ['', ''],
    ['a', 'A'],
  ])('capitalize("%s") → "%s"', (input, expected) => {
    expect(capitalize(input)).toBe(expected);
  });
});

describe('toTitleCase', () => {
  it.each([
    ['hello world', 'Hello World'],
    ['the quick brown fox', 'The Quick Brown Fox'],
    ['already Title Case', 'Already Title Case'],
    ['single', 'Single'],
    ['  leading space', '  Leading Space'],
  ])('toTitleCase("%s") → "%s"', (input, expected) => {
    expect(toTitleCase(input)).toBe(expected);
  });
});

describe('pluralize', () => {
  it.each([
    [1, 'item', undefined, 'item'],
    [0, 'item', undefined, 'items'],
    [2, 'item', undefined, 'items'],
    [1, 'child', 'children', 'child'],
    [2, 'child', 'children', 'children'],
    [100, 'result', undefined, 'results'],
    [-1, 'item', undefined, 'items'],
  ])('pluralize(%s, "%s", %s) → "%s"', (count, singular, plural, expected) => {
    expect(pluralize(count, singular, plural)).toBe(expected);
  });
});
