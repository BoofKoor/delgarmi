import time
from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone

from notifications import outbox, sms
from notifications.management.commands import run_worker
from notifications.management.commands.run_worker import HEARTBEAT
from notifications.models import SmsOutbox
from notifications.templates import NAMES, TEMPLATES, render

pytestmark = pytest.mark.django_db
MOBILE = '09121234567'


def test_worker_round_writes_a_fresh_heartbeat():
    HEARTBEAT.unlink(missing_ok=True)
    call_command('run_worker', '--once')
    assert time.time() - float(HEARTBEAT.read_text()) < 5


def test_a_failed_round_writes_no_heartbeat(monkeypatch):
    """So the health check turns red while the jobs keep failing."""
    def broken():
        raise RuntimeError('database unreachable')

    monkeypatch.setattr(run_worker, 'send_due', broken)
    HEARTBEAT.unlink(missing_ok=True)
    call_command('run_worker', '--once')
    assert not HEARTBEAT.exists()


# --- texts ----------------------------------------------------------------------------------

def test_the_request_texts_are_the_approved_ones_with_persian_digits():
    assert render('request-new', {'code': '104582'}) == \
        'دلگرمی: درخواست شما با کد ۱۰۴۵۸۲ ثبت شد. همکاران ما برای هماهنگی تماس می‌گیرند.'
    assert render('request-waitlist', {'code': '104582'}) == \
        'دلگرمی: درخواست شما با کد ۱۰۴۵۸۲ در لیست انتظار ثبت شد. وقتی این خدمت در شهرتان فعال شد پیامک می‌گیرید.'


def test_the_code_text_keeps_latin_digits_for_autofill():
    assert render('otp', {'code': '04821'}) == 'کد تأیید دلگرمی: 04821'


def test_every_text_has_a_name_in_the_panel():
    assert set(NAMES) == set(TEMPLATES)


# --- the queue ------------------------------------------------------------------------------

def test_a_due_sms_is_sent_and_marked(caplog):
    caplog.set_level('INFO', logger='sms')
    row = outbox.queue(MOBILE, 'request-new', {'code': '104582'})
    assert outbox.send_due() == 1
    row.refresh_from_db()
    assert (row.status, row.attempts) == ('sent', 1)
    assert row.sent_at is not None
    assert 'SMS to 0912***4567 [request-new]: دلگرمی: درخواست شما با کد ۱۰۴۵۸۲ ثبت شد.' in caplog.text
    assert outbox.send_due() == 0


def test_an_sms_not_yet_due_waits():
    row = outbox.queue(MOBILE, 'request-new', {'code': '104582'})
    SmsOutbox.objects.filter(pk=row.pk).update(next_try_at=timezone.now() + timedelta(minutes=1))
    assert outbox.send_due() == 0


def test_a_failure_is_retried_later_and_given_up_after_eight(monkeypatch):
    def broken(*args):
        raise ConnectionError('provider down')

    monkeypatch.setitem(sms.BACKENDS, 'log', broken)
    row = outbox.queue(MOBILE, 'request-waitlist', {'code': '104582'})
    now = timezone.now()
    waits = []
    for attempt in range(1, 9):
        assert outbox.send_due(now) == 1
        row.refresh_from_db()
        assert row.attempts == attempt
        assert row.last_error == 'ConnectionError: provider down'
        if attempt < 8:
            assert row.status == 'pending'
            assert outbox.send_due(now) == 0  # not again before it is due
            waits.append(round((row.next_try_at - now).total_seconds() / 60))
            now = row.next_try_at
    assert waits == [2, 4, 8, 16, 32, 60, 60]
    assert row.status == 'failed' and row.sent_at is None
    assert outbox.send_due(now + timedelta(days=1)) == 0


def test_one_failure_does_not_stop_the_others(monkeypatch):
    def picky(to, template, params, text):
        if to == MOBILE:
            raise ConnectionError('this number failed')

    monkeypatch.setitem(sms.BACKENDS, 'log', picky)
    failing = outbox.queue(MOBILE, 'request-new', {'code': '111111'})
    fine = outbox.queue('09351112233', 'request-new', {'code': '222222'})
    assert outbox.send_due() == 2
    failing.refresh_from_db()
    fine.refresh_from_db()
    assert (failing.status, fine.status) == ('pending', 'sent')
