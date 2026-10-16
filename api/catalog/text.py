"""Search keys for Persian names. Must match web/lib/text.ts; both are tested against
shared/normalize-fa.json. Changing the rules? Add a migration that recomputes City.search_name
and City.search_province, which are stored."""

import re
import unicodedata

_FOLD = str.maketrans({
    'ي': 'ی', 'ى': 'ی', 'ئ': 'ی',
    'ك': 'ک',
    'آ': 'ا', 'أ': 'ا', 'إ': 'ا',
    'ة': 'ه', 'ۀ': 'ه',
    'ؤ': 'و',
})
# Spaces, zero-width characters and direction marks, lone hamza, tatweel, short-vowel marks.
_DROP = re.compile(r'[\t\n\v\f\r \u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u3000\ufeff\u0621\u0640\u064b-\u065f\u0670]')


def normalize_fa(value: str | None) -> str:
    """Folds the spellings people type for the same Persian word. For search keys only."""
    text = unicodedata.normalize('NFKC', str(value or ''))
    return _DROP.sub('', text.translate(_FOLD))
