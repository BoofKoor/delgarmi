"""The two calls that check a mobile number (the form's last step)."""

import logging

from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

from notifications import sms

from . import otp

log = logging.getLogger('accounts')


def body(request) -> dict:
    return request.data if isinstance(request.data, dict) else {}


def error(code: str, status: int, **details) -> Response:
    headers = {'Retry-After': str(details['retry_after'])} if 'retry_after' in details else None
    return Response({'error': code, **details}, status=status, headers=headers)


@api_view(['POST'])
def send_code(request):
    mobile = otp.normalize_mobile(body(request).get('mobile'))
    if mobile is None:
        return error('mobile', 400)
    issued = otp.issue_code(mobile, otp.client_ip(request))
    if isinstance(issued, otp.Refused):
        return error(issued.error, 429, retry_after=issued.retry_after)
    row, code = issued
    try:
        sms.send(mobile, 'otp', {'code': code})
    except Exception:
        # Never delivered, so it counts toward no limit: the visitor may simply try again.
        log.exception('OTP SMS to %s failed', sms.mask(mobile))
        row.delete()
        return error('sms-failed', 502)
    return Response({'sent': True, 'mobile': mobile, 'resend_after': settings.OTP_RESEND_AFTER, 'expires_in': settings.OTP_TTL})


@api_view(['POST'])
def verify_code(request):
    data = body(request)
    mobile = otp.normalize_mobile(data.get('mobile'))
    if mobile is None:
        return error('mobile', 400)
    result, details = otp.check_code(mobile, data.get('code'))
    if result != 'ok':
        return error(result, 400, **details)
    return Response({'token': otp.issue_token(details), 'expires_in': settings.OTP_TOKEN_TTL})
