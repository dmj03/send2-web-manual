/**
 * Returns a shallow copy of `obj` with the specified keys removed.
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Returns a new object containing only the specified keys from `obj`.
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce<Pick<T, K>>((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

/**
 * Recursively merges `source` into a shallow copy of `target`, with source values taking precedence.
 */
export function deepMerge<T extends object>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const srcVal = source[key as keyof T];
    const tgtVal = result[key as keyof T];
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key as keyof T] = deepMerge(
        tgtVal as object,
        srcVal as object,
      ) as T[keyof T];
    } else if (srcVal !== undefined) {
      result[key as keyof T] = srcVal as T[keyof T];
    }
  }
  return result;
}

/**
 * Returns true if the object has no own enumerable keys.
 */
export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Returns a shallow copy of the object with all keys whose value is `undefined` removed.
 */
export function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
