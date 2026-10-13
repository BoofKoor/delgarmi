import logging
import signal
import time
from pathlib import Path

from django.core.management.base import BaseCommand

log = logging.getLogger('worker')
HEARTBEAT = Path('/tmp/worker-heartbeat')


class Command(BaseCommand):
    help = 'Background worker. Sends queued SMS (milestone 3) and builds hourly panel alerts (milestone 4).'

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
            self.run_jobs()
            HEARTBEAT.write_text(str(time.time()))
            if once:
                break
            deadline = time.monotonic() + interval
            while not stopping and time.monotonic() < deadline:
                time.sleep(0.2)
            if stopping:
                break
        log.info('worker stopped')

    def run_jobs(self) -> None:
        """Jobs arrive with their milestones; the loop and the heartbeat are ready now."""
