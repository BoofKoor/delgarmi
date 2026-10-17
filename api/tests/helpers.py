from datetime import timedelta

from django.utils import timezone

from accounts.models import OtpCode
from accounts.otp import issue_token


def checked_code(mobile: str) -> OtpCode:
    """A code this number has just entered correctly, as /api/otp/verify leaves it."""
    now = timezone.now()
    return OtpCode.objects.create(mobile=mobile, code_hash='0' * 64, created_at=now,
                                  expires_at=now + timedelta(minutes=2), used_at=now)


def bearer(mobile: str) -> dict:
    """The header a freshly checked number sends (test client keyword arguments)."""
    return {'HTTP_AUTHORIZATION': f'Bearer {issue_token(checked_code(mobile))}'}
