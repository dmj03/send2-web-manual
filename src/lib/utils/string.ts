/**
 * Capitalises the first character of a string.
 */
export function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Truncates a string to maxLength characters, appending an ellipsis if truncated.
 */
export function truncate(
  s: string,
  maxLength: number,
  ellipsis: string = '…',
): string {
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Converts a string to a URL-safe slug by lowercasing, replacing spaces, and removing special characters.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a string to Title Case, capitalising the first letter of each word.
 */
export function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (word) => capitalize(word.toLowerCase()));
}

/**
 * Strips all HTML tags from a string, returning plain text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Wraps occurrences of query (case-insensitive) in the text with HTML `<mark>` tags.
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Returns the singular or plural form of a word based on count.
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const pluralForm = plural ?? `${singular}s`;
  return count === 1 ? singular : pluralForm;
}
