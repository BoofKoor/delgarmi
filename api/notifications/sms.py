"""Sending one SMS through the backend named by SMS_BACKEND.

Only the 'log' backend exists until an SMS account is connected: it writes the message to the log
and sends nothing. A real backend raises on failure; the caller decides whether to retry.
"""

import logging

from django.conf import settings

from .templates import render

log = logging.getLogger('sms')


def mask(mobile: str) -> str:
    """09123456789 → 0912***6789, so logs never hold a whole number."""
    return f'{mobile[:4]}***{mobile[-4:]}'


def _log_backend(to: str, template: str, params: dict, text: str) -> None:
    if template == 'otp':
        # The owner reads the code from here on the test server: grep OTP.
        log.info('OTP for %s: %s', mask(to), params['code'])
    else:
        log.info('SMS to %s [%s]: %s', mask(to), template, text)


BACKENDS = {'log': _log_backend}


def send(to: str, template: str, params: dict) -> None:
    text = render(template, params)
    BACKENDS[settings.SMS_BACKEND](to, template, params, text)
