/**
 * Search keys for Persian names. Must match api/catalog/text.py; both are tested against
 * shared/normalize-fa.json.
 */
const FOLD: Record<string, string> = {
  'ي': 'ی', 'ى': 'ی', 'ئ': 'ی',
  'ك': 'ک',
  'آ': 'ا', 'أ': 'ا', 'إ': 'ا',
  'ة': 'ه', 'ۀ': 'ه',
  'ؤ': 'و',
};
const FOLD_RE = /[يىئكآأإةۀؤ]/g;
// Spaces, zero-width characters and direction marks, lone hamza, tatweel, short-vowel marks.
const DROP_RE = /[\t\n\v\f\r \u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u3000\ufeff\u0621\u0640\u064b-\u065f\u0670]/g;

/** Folds the spellings people type for the same Persian word. For search keys only. */
export function normalizeFa(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(FOLD_RE, (c) => FOLD[c])
    .replace(DROP_RE, '');
}
