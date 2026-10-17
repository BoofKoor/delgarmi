import os
import subprocess
import sys
import time
from pathlib import Path

from notifications.heartbeat import HEARTBEAT

API_DIR = Path(__file__).resolve().parent.parent


def healthcheck() -> int:
    """As Docker runs it in the worker container: a bare Python, Django not started."""
    env = {k: v for k, v in os.environ.items() if k != 'DJANGO_SETTINGS_MODULE'}
    return subprocess.run([sys.executable, '-m', 'notifications.healthcheck'], cwd=API_DIR, env=env,
                          capture_output=True, text=True).returncode


def test_a_fresh_heartbeat_is_healthy():
    HEARTBEAT.write_text(str(time.time()))
    assert healthcheck() == 0


def test_an_old_or_missing_heartbeat_is_not():
    HEARTBEAT.write_text(str(time.time() - 61))
    assert healthcheck() == 1
    HEARTBEAT.unlink()
    assert healthcheck() == 1
