"""Docker health check for the worker: healthy while the heartbeat is younger than a minute."""

import sys
import time

from notifications.management.commands.run_worker import HEARTBEAT

try:
    age = time.time() - float(HEARTBEAT.read_text())
except (OSError, ValueError):
    sys.exit(1)
sys.exit(0 if age < 60 else 1)
