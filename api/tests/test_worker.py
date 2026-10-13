import time

from django.core.management import call_command

from notifications.management.commands.run_worker import HEARTBEAT


def test_worker_round_writes_a_fresh_heartbeat():
    HEARTBEAT.unlink(missing_ok=True)
    call_command('run_worker', '--once')
    assert time.time() - float(HEARTBEAT.read_text()) < 5
