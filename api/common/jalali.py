"""Jalali (Shamsi) dates for the panel. Same algorithm as web/lib/jalali.ts (jalaali-js);
both are tested against shared/jalali.json."""

from datetime import date, datetime

from django.utils import timezone

BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]
MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
_FA_DIGITS = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')


def _div(a: int, b: int) -> int:
    """Division that truncates toward zero, as in the JavaScript original."""
    q = abs(a) // abs(b)
    return q if (a >= 0) == (b >= 0) else -q


def _mod(a: int, b: int) -> int:
    return a - _div(a, b) * b


def _jal_cal(jy: int) -> tuple[int, int]:
    """Returns (leap, march): leap is 0 in a leap year; Nowruz falls on March `march`."""
    leap_j = -14
    jp = BREAKS[0]
    jump = 0
    for jm in BREAKS[1:]:
        jump = jm - jp
        if jy < jm:
            break
        leap_j += _div(jump, 33) * 8 + _div(_mod(jump, 33), 4)
        jp = jm
    n = jy - jp
    leap_j += _div(n, 33) * 8 + _div(_mod(n, 33) + 3, 4)
    if _mod(jump, 33) == 4 and jump - n == 4:
        leap_j += 1
    gy = jy + 621
    leap_g = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150
    march = 20 + leap_j - leap_g
    if jump - n < 6:
        n = n - jump + _div(jump + 4, 33) * 33
    leap = _mod(_mod(n + 1, 33) - 1, 4)
    return (4 if leap == -1 else leap), march


def to_jalali(day: date) -> tuple[int, int, int]:
    """Gregorian date → (year, month, day) in the Jalali calendar."""
    jy = day.year - 621
    leap, march = _jal_cal(jy)
    k = day.toordinal() - date(day.year, 3, march).toordinal()
    if k >= 0:
        if k <= 185:
            return jy, 1 + k // 31, k % 31 + 1
        k -= 186
    else:
        jy -= 1
        k += 179
        if leap == 1:
            k += 1
    return jy, 7 + k // 30, k % 30 + 1


def format_jalali(value: date | datetime) -> str:
    """۲۴ مهر ۱۴۰۵ — a datetime is read in Tehran time first."""
    if isinstance(value, datetime):
        value = timezone.localtime(value).date()
    jy, jm, jd = to_jalali(value)
    return f'{jd} {MONTHS[jm - 1]} {jy}'.translate(_FA_DIGITS)


def format_jalali_time(value: datetime) -> str:
    """۲۵ مهر ۱۴۰۵، ۱۴:۰۵ — in Tehran time."""
    local = timezone.localtime(value)
    return f'{format_jalali(local)}، {local:%H:%M}'.translate(_FA_DIGITS)
