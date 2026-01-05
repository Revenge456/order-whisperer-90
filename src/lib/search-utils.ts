// Utility functions for accent-insensitive search

/**
 * Normalizes a string by removing accents and converting to lowercase
 * This allows for accent-insensitive search
 */
export function normalizeSearch(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if the normalized haystack includes the normalized needle
 */
export function matchesSearch(haystack: string | null | undefined, needle: string): boolean {
  if (!needle) return true;
  return normalizeSearch(haystack).includes(normalizeSearch(needle));
}

/**
 * Filters an array of objects by multiple fields with accent-insensitive search
 */
export function filterBySearch<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  
  const normalizedSearch = normalizeSearch(searchTerm);
  
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return normalizeSearch(value).includes(normalizedSearch);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchTerm);
      }
      return false;
    })
  );
}
