/**
 * Groups an array of objects by the value of a specified key.
 */
export function groupBy<T>(
  arr: T[],
  key: keyof T,
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const groupKey = String(item[key]);
    (acc[groupKey] ??= []).push(item);
    return acc;
  }, {});
}

/**
 * Returns a shallow-copied array sorted by a key in ascending or descending order.
 */
export function sortBy<T>(
  arr: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Returns a new array with duplicate values removed, keeping the first occurrence of each key.
 */
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return arr.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Splits an array into sub-arrays of at most `size` elements.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new RangeError('chunk size must be greater than 0');
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Flattens a two-dimensional array into a single array.
 */
export function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}
