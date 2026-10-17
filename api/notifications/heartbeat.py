"""Where the worker leaves its heartbeat. Nothing here may import Django: the Docker health check
(notifications/healthcheck.py) reads it with a bare Python."""

from pathlib import Path

HEARTBEAT = Path('/tmp/worker-heartbeat')
