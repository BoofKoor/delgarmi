/**
 * Folds the spelling variants people type for the same Persian word:
 * Arabic ي/ى and ك, آ/أ/إ, ة/ۀ, plus zero-width non-joiners, spaces and tatweel.
 */
export function normalizeFa(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[‌‍\sـ]/g, '');
}
