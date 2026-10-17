import os
import subprocess
import sys
from pathlib import Path

from django.conf import settings
from django.utils import timezone

API_DIR = Path(__file__).resolve().parent.parent


def load_settings(**overrides):
    """Import the production settings in a fresh interpreter with the given environment."""
    env = {k: v for k, v in os.environ.items() if k not in ('DJANGO_SECRET_KEY', 'PANEL_PATH', 'DJANGO_DEBUG')}
    env.update(overrides)
    return subprocess.run([sys.executable, '-c', 'import config.settings'], cwd=API_DIR, env=env, capture_output=True, text=True)


def test_production_settings_load_with_the_required_values():
    result = load_settings(DJANGO_SECRET_KEY='x' * 50, PANEL_PATH='panel-abc123')
    assert result.returncode == 0, result.stderr


def test_secret_key_is_required_outside_debug():
    result = load_settings(PANEL_PATH='panel-abc123')
    assert result.returncode != 0
    assert 'DJANGO_SECRET_KEY is required' in result.stderr


def test_panel_path_cannot_be_admin_or_too_short():
    for bad in ('admin', 'abc', 'Panel_Path'):
        result = load_settings(DJANGO_SECRET_KEY='x' * 50, PANEL_PATH=bad)
        assert result.returncode != 0, bad
        assert 'PANEL_PATH must be' in result.stderr


def test_times_are_stored_in_utc_and_shown_in_tehran_time():
    assert settings.USE_TZ is True
    assert settings.TIME_ZONE == 'Asia/Tehran'
    now = timezone.now()
    assert now.utcoffset().total_seconds() == 0
    assert timezone.localtime(now).utcoffset().total_seconds() == 3.5 * 3600


def test_cookies_are_https_only():
    assert settings.SESSION_COOKIE_SECURE is True
    assert settings.CSRF_COOKIE_SECURE is True


def test_an_unknown_sms_backend_stops_the_start():
    result = load_settings(DJANGO_SECRET_KEY='x' * 50, PANEL_PATH='panel-abc123', SMS_BACKEND='kavenegar')
    assert result.returncode != 0
    assert 'SMS_BACKEND must be one of: log' in result.stderr


def test_sms_go_to_the_log_until_an_account_is_connected():
    assert settings.SMS_BACKEND == 'log'
