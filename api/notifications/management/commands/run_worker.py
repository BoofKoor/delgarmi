import logging
import signal
import time
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import close_old_connections

from notifications.outbox import send_due

log = logging.getLogger('worker')
HEARTBEAT = Path('/tmp/worker-heartbeat')


class Command(BaseCommand):
    help = 'Background worker. Sends queued SMS; hourly panel alerts arrive with milestone 4.'

    def add_arguments(self, parser):
        parser.add_argument('--interval', type=float, default=5.0, help='Seconds between rounds.')
        parser.add_argument('--once', action='store_true', help='Run one round and exit.')

    def handle(self, *args, interval: float, once: bool, **options):
        stopping = False

        def stop(signum, frame):
            nonlocal stopping
            stopping = True

        signal.signal(signal.SIGTERM, stop)
        signal.signal(signal.SIGINT, stop)
        log.info('worker started')
        while True:
            # The heartbeat is written only after a round that worked, so the health check turns
            # red when the jobs keep failing (for example while the database is unreachable).
            try:
                self.run_jobs()
            except Exception:
                log.exception('worker round failed')
            else:
                HEARTBEAT.write_text(str(time.time()))
            if once:
                break
            deadline = time.monotonic() + interval
            while not stopping and time.monotonic() < deadline:
                time.sleep(0.2)
            if stopping:
                break
            # As after each web request: drop a connection that broke or is too old, so a database
            # restart does not leave the worker failing.
            close_old_connections()
        log.info('worker stopped')

    def run_jobs(self) -> None:
        send_due()
