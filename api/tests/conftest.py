import re
from datetime import datetime, timedelta, timezone as dt_timezone

import pytest
from django.utils import timezone


class Clock:
    """Stands in for django.utils.timezone.now, so waits and expiry are tested without sleeping."""

    def __init__(self, start: datetime):
        self.now = start

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **delta) -> None:
        self.now += timedelta(**delta)


@pytest.fixture
def clock(monkeypatch) -> Clock:
    # Noon in Tehran on 25 Mehr 1405 (17 October 2026).
    fake = Clock(datetime(2026, 10, 17, 8, 30, tzinfo=dt_timezone.utc))
    monkeypatch.setattr(timezone, 'now', fake)
    return fake


@pytest.fixture
def sms_log(caplog):
    """What the 'log' SMS backend wrote: the code is read from there, as on the test server."""
    caplog.set_level('INFO', logger='sms')

    def last_code(mobile: str) -> str:
        masked = re.escape(f'{mobile[:4]}***{mobile[-4:]}')
        found = re.findall(rf'OTP for {masked}: (\d+)', caplog.text)
        assert found, f'no code was sent to {mobile}'
        return found[-1]

    last_code.caplog = caplog
    return last_code
