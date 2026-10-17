"""Checking a mobile number: a code by SMS, then a signed token that says the number was checked.

The rules (lengths, waits, limits) are in config/settings.py. The code is never stored or logged
by this module; only a keyed hash of it is kept, compared in constant time.
"""

import ipaddress
import math
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

from django.conf import settings
from django.core import signing
from django.db import connection, transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac

from .models import OtpCode

_LATIN = str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')
MOBILE = re.compile(r'09[0-9]{9}')
TOKEN_SALT = 'delgarmi.otp-token'

# Advisory-lock namespaces: one lock per number and one per IP while a code is being issued.
_LOCK_MOBILE = 1
_LOCK_IP = 2


def latin_digits(value: str) -> str:
    return value.translate(_LATIN)


def normalize_mobile(raw) -> str | None:
    """The ways people type an Iranian mobile number → 09123456789, or None. The same rules as
    normalizeMobile in web/lib/form.ts; both are tested against shared/mobile.json."""
    if not isinstance(raw, str):
        return None
    s = re.sub(r'[^0-9+]', '', latin_digits(raw))
    if s.startswith('+98'):
        s = '0' + s[3:]
    elif s.startswith('0098'):
        s = '0' + s[4:]
    elif len(s) == 12 and s.startswith('98'):
        s = '0' + s[2:]
    elif len(s) == 10 and s.startswith('9'):
        s = '0' + s
    return s if MOBILE.fullmatch(s) else None


def client_ip(request) -> str | None:
    """nginx puts the visitor's address in X-Real-IP (it replaces whatever the visitor sent, and the
    API is reachable only through nginx). Without it, as in local runs, the direct peer."""
    for value in (request.META.get('HTTP_X_REAL_IP'), request.META.get('REMOTE_ADDR')):
        try:
            return str(ipaddress.ip_address((value or '').strip()))
        except ValueError:
            continue
    return None


def hash_code(mobile: str, code: str) -> str:
    return salted_hmac('delgarmi.otp', f'{mobile}:{code}', algorithm='sha256').hexdigest()


def _lock(namespace: int, key: str) -> None:
    """Held until the transaction ends, so two requests at the same moment cannot both pass a limit."""
    with connection.cursor() as cursor:
        cursor.execute('SELECT pg_advisory_xact_lock(%s, hashtext(%s))', [namespace, key])


def _seconds_until(moment: datetime, now: datetime) -> int:
    return max(1, math.ceil((moment - now).total_seconds()))


@dataclass
class Refused:
    error: str          # wait | too-many | too-many-ip
    retry_after: int    # seconds


def issue_code(mobile: str, ip: str | None) -> tuple[OtpCode, str] | Refused:
    """A new code for this number, or why not yet. The caller sends the code by SMS."""
    now = timezone.now()
    hour = timedelta(hours=1)
    with transaction.atomic():
        _lock(_LOCK_MOBILE, mobile)
        if ip:
            _lock(_LOCK_IP, ip)
        sent = list(OtpCode.objects.filter(mobile=mobile, created_at__gt=now - hour)
                    .order_by('created_at').values_list('created_at', flat=True))
        refusals = []
        if sent and now < sent[-1] + timedelta(seconds=settings.OTP_RESEND_AFTER):
            refusals.append(Refused('wait', _seconds_until(sent[-1] + timedelta(seconds=settings.OTP_RESEND_AFTER), now)))
        if len(sent) >= settings.OTP_MAX_PER_HOUR:
            # Free again once enough of them are an hour old.
            refusals.append(Refused('too-many', _seconds_until(sent[-settings.OTP_MAX_PER_HOUR] + hour, now)))
        if ip:
            from_ip = list(OtpCode.objects.filter(ip=ip, created_at__gt=now - hour)
                           .order_by('created_at').values_list('created_at', flat=True))
            if len(from_ip) >= settings.OTP_MAX_PER_HOUR_IP:
                refusals.append(Refused('too-many-ip', _seconds_until(from_ip[-settings.OTP_MAX_PER_HOUR_IP] + hour, now)))
        if refusals:
            # One wait, the longest, so the visitor is not sent from one countdown to the next.
            return max(refusals, key=lambda r: r.retry_after)
        OtpCode.objects.filter(mobile=mobile, used_at=None, voided=False, expires_at__gt=now).update(voided=True)
        code = f'{secrets.randbelow(10 ** settings.OTP_LENGTH):0{settings.OTP_LENGTH}d}'
        row = OtpCode.objects.create(
            mobile=mobile, code_hash=hash_code(mobile, code), ip=ip,
            created_at=now, expires_at=now + timedelta(seconds=settings.OTP_TTL),
        )
    return row, code


def check_code(mobile: str, code) -> tuple[str, dict | OtpCode]:
    """('ok', the code's row, now used up), or (error, details): expired | wrong | voided."""
    code = re.sub(r'[^0-9]', '', latin_digits(code)) if isinstance(code, str) else ''
    now = timezone.now()
    with transaction.atomic():
        row = (OtpCode.objects.select_for_update()
               .filter(mobile=mobile, used_at=None, voided=False, expires_at__gt=now)
               .order_by('-created_at').first())
        if row is None:
            return 'expired', {}
        if not constant_time_compare(row.code_hash, hash_code(mobile, code)):
            row.attempts += 1
            row.voided = row.attempts >= settings.OTP_MAX_ATTEMPTS
            row.save(update_fields=['attempts', 'voided'])
            if row.voided:
                return 'voided', {}
            return 'wrong', {'attempts_left': settings.OTP_MAX_ATTEMPTS - row.attempts}
        row.used_at = now
        row.save(update_fields=['used_at'])
    return 'ok', row


@dataclass
class Checked:
    mobile: str
    code_id: int    # the OtpCode that checked it; a request claims it, so one token submits once


def issue_token(row: OtpCode) -> str:
    return signing.TimestampSigner(salt=TOKEN_SALT).sign(f'{row.mobile}.{row.pk}')


def checked_number(request) -> Checked | None:
    """What an `Authorization: Bearer <token>` header proves, or None (missing, forged, old)."""
    scheme, _, token = request.META.get('HTTP_AUTHORIZATION', '').partition(' ')
    if scheme.lower() != 'bearer' or not token.strip():
        return None
    try:
        value = signing.TimestampSigner(salt=TOKEN_SALT).unsign(token.strip(), max_age=settings.OTP_TOKEN_TTL)
    except signing.BadSignature:  # also an expired one
        return None
    mobile, _, code_id = value.partition('.')
    if not MOBILE.fullmatch(mobile) or not code_id.isascii() or not code_id.isdigit():
        return None
    return Checked(mobile, int(code_id))


def claim(checked: Checked) -> bool:
    """Marks the check as spent on a request. False when it already was (a second submit, or two at
    once: the row lock makes the second wait and then find it spent). Call inside the transaction
    that creates the request, so a failure gives the check back."""
    return OtpCode.objects.filter(
        pk=checked.code_id, mobile=checked.mobile, used_at__isnull=False, submitted_at=None,
    ).update(submitted_at=timezone.now()) == 1
