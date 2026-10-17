"""Queued SMS: written with the change that causes them, sent by the worker afterwards, so a slow or
failing SMS service never holds up a request."""

import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from . import sms
from .models import SmsOutbox

log = logging.getLogger('worker')

MAX_ATTEMPTS = 8
BATCH = 100


def queue(to: str, template: str, params: dict) -> SmsOutbox:
    return SmsOutbox.objects.create(to=to, template=template, params=params)


def retry_delay(attempts: int) -> timedelta:
    """2, 4, 8 … minutes after each failure, never more than an hour."""
    return timedelta(minutes=min(2 ** attempts, 60))


def send_due(now=None) -> int:
    """Sends the queued SMS that are due, one at a time. Returns how many were tried."""
    now = now or timezone.now()
    tried = 0
    while tried < BATCH:
        with transaction.atomic():
            row = (SmsOutbox.objects.select_for_update(skip_locked=True)
                   .filter(status=SmsOutbox.Status.PENDING, next_try_at__lte=now)
                   .order_by('next_try_at', 'pk').first())
            if row is None:
                break
            tried += 1
            row.attempts += 1
            try:
                sms.send(row.to, row.template, row.params)
            except Exception as error:  # a real SMS service fails in many ways; all are retried
                row.last_error = f'{type(error).__name__}: {error}'[:1000]
                if row.attempts >= MAX_ATTEMPTS:
                    row.status = SmsOutbox.Status.FAILED
                    log.error('SMS %s gave up after %s attempts: %s', row.pk, row.attempts, row.last_error)
                else:
                    row.next_try_at = now + retry_delay(row.attempts)
                    log.warning('SMS %s failed (attempt %s): %s', row.pk, row.attempts, row.last_error)
            else:
                row.status = SmsOutbox.Status.SENT
                row.sent_at = timezone.now()
            row.save()
    return tried
