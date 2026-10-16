import json
from datetime import date, datetime, timedelta, timezone as dt_timezone
from pathlib import Path

import pytest

from common.jalali import format_jalali, to_jalali

VECTORS = json.loads((Path(__file__).resolve().parents[2] / 'shared' / 'jalali.json').read_text())


@pytest.mark.parametrize('case', VECTORS, ids=['-'.join(map(str, c['gregorian'])) for c in VECTORS])
def test_to_jalali_matches_the_site(case):
    assert list(to_jalali(date(*case['gregorian']))) == case['jalali']


def test_every_day_follows_the_one_before_for_ten_years():
    day, previous = date(2020, 1, 1), to_jalali(date(2019, 12, 31))
    while day < date(2030, 1, 1):
        current = to_jalali(day)
        py, pm, pd = previous
        if current[2] != 1:
            assert current == (py, pm, pd + 1)
        else:
            assert pd in (29, 30, 31) and (current[:2] == (py, pm + 1) or current[:2] == (py + 1, 1))
            assert pd == (31 if pm <= 6 else 30 if pm <= 11 else pd)
        previous, day = current, day + timedelta(days=1)


def test_format_uses_persian_digits_and_tehran_time():
    assert format_jalali(date(2026, 10, 16)) == '۲۴ مهر ۱۴۰۵'
    # 22:00 UTC on 16 Oct is already 17 Oct in Tehran (UTC+3:30).
    assert format_jalali(datetime(2026, 10, 16, 22, 0, tzinfo=dt_timezone.utc)) == '۲۵ مهر ۱۴۰۵'
