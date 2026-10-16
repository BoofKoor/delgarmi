import json
from pathlib import Path

import pytest

from catalog.text import normalize_fa

CASES = json.loads((Path(__file__).resolve().parents[2] / 'shared' / 'normalize-fa.json').read_text(encoding='utf-8'))


def test_the_shared_cases_are_loaded():
    assert len(CASES) > 15


@pytest.mark.parametrize('case', CASES, ids=[c['why'] for c in CASES])
def test_normalize_fa_matches_the_shared_cases(case):
    assert normalize_fa(case['in']) == case['out']


def test_normalize_fa_accepts_none():
    assert normalize_fa(None) == ''
