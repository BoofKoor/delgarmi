import json
import time
from datetime import timedelta
from pathlib import Path

import psycopg
import pytest
from django.core import signing
from django.db import OperationalError, connection
from django.test import override_settings

from accounts import otp
from accounts.models import OtpCode
from accounts.otp import TOKEN_SALT, client_ip, hash_code, normalize_mobile
from notifications import sms

from .helpers import bearer, checked_code

pytestmark = pytest.mark.django_db

CASES = json.loads((Path(__file__).resolve().parents[2] / 'shared' / 'mobile.json').read_text(encoding='utf-8'))
MOBILE = '09121234567'
FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')


def send(client, mobile=MOBILE, ip='203.0.113.7'):
    return client.post('/api/otp/send', {'mobile': mobile}, content_type='application/json', HTTP_X_REAL_IP=ip)


def verify(client, code, mobile=MOBILE):
    return client.post('/api/otp/verify', {'mobile': mobile, 'code': code}, content_type='application/json')


def codes(monkeypatch, *numbers):
    """The next codes the API makes, in order."""
    queue = list(numbers)
    monkeypatch.setattr(otp.secrets, 'randbelow', lambda n: queue.pop(0))


# --- numbers --------------------------------------------------------------------------------

def test_the_shared_cases_are_loaded():
    assert len(CASES) > 10


@pytest.mark.parametrize('case', CASES, ids=[c['why'] for c in CASES])
def test_normalize_mobile_matches_the_shared_cases(case):
    assert normalize_mobile(case['in']) == case['out']


def test_normalize_mobile_refuses_what_is_not_text():
    for value in (None, 9123456789, ['09123456789'], {'mobile': MOBILE}):
        assert normalize_mobile(value) is None


def test_the_ip_is_the_one_nginx_saw(rf):
    assert client_ip(rf.post('/', HTTP_X_REAL_IP='203.0.113.1', REMOTE_ADDR='172.18.0.5')) == '203.0.113.1'
    assert client_ip(rf.post('/', REMOTE_ADDR='127.0.0.1')) == '127.0.0.1'
    assert client_ip(rf.post('/', HTTP_X_REAL_IP='not-an-ip', REMOTE_ADDR='127.0.0.1')) == '127.0.0.1'


# --- sending a code -------------------------------------------------------------------------

def test_a_code_is_sent_and_only_a_keyed_hash_of_it_is_stored(client, clock, sms_log, monkeypatch):
    codes(monkeypatch, 48213)
    response = send(client, '۰۹۱۲ ۱۲۳ ۴۵۶۷')
    assert response.status_code == 200
    assert response.json() == {'sent': True, 'mobile': MOBILE, 'resend_after': 120, 'expires_in': 120}
    assert sms_log(MOBILE) == '48213'
    row = OtpCode.objects.get()
    assert all('48213' not in str(getattr(row, f.attname)) for f in OtpCode._meta.concrete_fields)
    assert row.code_hash == hash_code(MOBILE, '48213')
    # Keyed with the secret key: a copy of the database alone does not give the code away.
    with override_settings(SECRET_KEY='another-key'):
        assert hash_code(MOBILE, '48213') != row.code_hash
    assert row.ip == '203.0.113.7'
    # The log never holds the whole number.
    assert MOBILE not in sms_log.caplog.text


def test_codes_have_five_digits_including_leading_zeros(client, clock, sms_log, monkeypatch):
    codes(monkeypatch, 7)
    send(client)
    assert sms_log(MOBILE) == '00007'


def test_a_wrong_number_is_refused(client):
    for bad in ['', '0912', 'abc', '08123456789', None]:
        response = send(client, bad)
        assert response.status_code == 400, bad
        assert response.json() == {'error': 'mobile'}
    assert client.post('/api/otp/send', [MOBILE], content_type='application/json').json() == {'error': 'mobile'}
    assert not OtpCode.objects.exists()


def test_the_next_code_waits_two_minutes(client, clock, sms_log):
    assert send(client).status_code == 200
    clock.advance(seconds=100)
    response = send(client)
    assert response.status_code == 429
    assert response.json() == {'error': 'wait', 'retry_after': 20}
    assert response['Retry-After'] == '20'
    clock.advance(seconds=20)
    assert send(client).status_code == 200


def test_five_codes_an_hour_for_one_number(client, clock, sms_log):
    for _ in range(5):
        assert send(client).status_code == 200
        clock.advance(seconds=121)
    response = send(client)
    assert response.status_code == 429
    # Free again when the first of the five is an hour old.
    assert response.json() == {'error': 'too-many', 'retry_after': 3600 - 5 * 121}
    clock.advance(seconds=3600 - 5 * 121)
    assert send(client).status_code == 200


def test_the_longest_of_two_waits_is_given(client, clock, sms_log):
    start = clock.now
    for at in (0, 900, 1800, 2700, 3500):
        clock.now = start + timedelta(seconds=at)
        assert send(client).status_code == 200
    clock.now = start + timedelta(seconds=3560)
    # The hour frees a code in 40 s, but the last one was sent 60 s ago: wait 60 s, once.
    assert send(client).json() == {'error': 'wait', 'retry_after': 60}


def test_twenty_codes_an_hour_from_one_address(client, clock, sms_log):
    for i in range(20):
        assert send(client, f'0912000{i:04d}', ip='198.51.100.9').status_code == 200
    response = send(client, '09129999999', ip='198.51.100.9')
    assert response.status_code == 429
    assert response.json() == {'error': 'too-many-ip', 'retry_after': 3600}
    assert send(client, '09129999999', ip='198.51.100.10').status_code == 200


def test_a_code_that_could_not_be_sent_counts_for_nothing(client, clock, sms_log, monkeypatch):
    def broken(*args):
        raise ConnectionError('SMS service unreachable')

    with monkeypatch.context() as patch:
        patch.setitem(sms.BACKENDS, 'log', broken)
        response = send(client)
    assert response.status_code == 502
    assert response.json() == {'error': 'sms-failed'}
    assert not OtpCode.objects.exists()
    assert send(client).status_code == 200  # at once, no wait


# --- checking it ----------------------------------------------------------------------------

def test_the_right_code_gives_a_token_and_is_used_up(client, clock, sms_log):
    send(client)
    code = sms_log(MOBILE)
    response = verify(client, code)
    assert response.status_code == 200
    body = response.json()
    assert body['expires_in'] == 1800
    row = OtpCode.objects.get()
    assert signing.TimestampSigner(salt=TOKEN_SALT).unsign(body['token'], max_age=1800) == f'{MOBILE}.{row.pk}'
    assert row.used_at == clock.now
    assert verify(client, code).json() == {'error': 'expired'}


def test_the_code_may_be_typed_in_persian_digits(client, clock, sms_log):
    send(client)
    assert verify(client, sms_log(MOBILE).translate(FA)).status_code == 200


def test_a_wrong_code_says_how_many_tries_are_left_and_the_fifth_voids_it(client, clock, sms_log, monkeypatch):
    codes(monkeypatch, 11111)
    send(client)
    for left in (4, 3, 2, 1):
        response = verify(client, '22222')
        assert response.status_code == 400
        assert response.json() == {'error': 'wrong', 'attempts_left': left}
    assert verify(client, '22222').json() == {'error': 'voided'}
    assert verify(client, '11111').json() == {'error': 'expired'}


def test_a_code_lasts_two_minutes(client, clock, sms_log):
    send(client)
    code = sms_log(MOBILE)
    clock.advance(seconds=121)
    assert verify(client, code).json() == {'error': 'expired'}


def test_a_code_works_until_its_two_minutes_are_up(client, clock, sms_log):
    send(client)
    clock.advance(seconds=119)
    assert verify(client, sms_log(MOBILE)).status_code == 200


def test_a_new_code_replaces_the_one_before(client, clock, sms_log, monkeypatch, settings):
    settings.OTP_TTL = 600  # so the first one has not simply expired
    codes(monkeypatch, 11111, 22222)
    send(client)
    clock.advance(seconds=121)
    send(client)
    assert verify(client, '11111').json() == {'error': 'wrong', 'attempts_left': 4}
    assert verify(client, '22222').status_code == 200


def test_no_code_sent_means_expired(client):
    assert verify(client, '12345').json() == {'error': 'expired'}


def test_a_code_for_one_number_does_not_check_another(client, clock, sms_log):
    send(client)
    send(client, '09127654321')
    assert verify(client, sms_log(MOBILE), mobile='09127654321').json()['error'] == 'wrong'


# --- the token ------------------------------------------------------------------------------

class OldSigner(signing.TimestampSigner):
    def timestamp(self):
        return signing.b62_encode(int(time.time()) - 1801)


def test_the_token_lasts_half_an_hour(client):
    assert client.get('/api/requests/mine', **bearer(MOBILE)).status_code == 200
    old = OldSigner(salt=TOKEN_SALT).sign(f'{MOBILE}.{checked_code(MOBILE).pk}')
    assert client.get('/api/requests/mine', HTTP_AUTHORIZATION=f'Bearer {old}').status_code == 401


@pytest.mark.parametrize('header', [
    None,
    '',
    'Bearer ',
    f'Basic {MOBILE}',
    f'Bearer {MOBILE}',
    f'Bearer {signing.TimestampSigner(salt="something-else").sign(MOBILE)}',
])
def test_a_missing_or_forged_token_is_refused(client, header):
    extra = {} if header is None else {'HTTP_AUTHORIZATION': header}
    response = client.get('/api/requests/mine', **extra)
    assert response.status_code == 401
    assert response.json() == {'error': 'token'}


@pytest.mark.parametrize('value', ['admin', 'admin.1', MOBILE, f'{MOBILE}.', f'{MOBILE}.x1', f'{MOBILE}.۱'])
def test_a_token_names_a_mobile_number_and_the_code_that_checked_it(client, value):
    token = signing.TimestampSigner(salt=TOKEN_SALT).sign(value)
    assert client.get('/api/requests/mine', HTTP_AUTHORIZATION=f'Bearer {token}').status_code == 401


# --- two at the same moment -------------------------------------------------------------------

@pytest.fixture
def other_session():
    """A second database session, as a second web worker would have."""
    params = connection.settings_dict
    session = psycopg.connect(host=params['HOST'], port=params['PORT'], dbname=params['NAME'],
                              user=params['USER'], password=params['PASSWORD'], autocommit=True)
    with connection.cursor() as cursor:
        cursor.execute("SET lock_timeout = '300ms'")  # waiting for a lock fails fast here
    yield session
    session.close()


@pytest.mark.parametrize('namespace, key, ip', [(1, MOBILE, None), (2, '203.0.113.7', '203.0.113.7')])
def test_while_another_worker_issues_a_code_for_the_number_or_address_this_one_waits(other_session, namespace, key, ip):
    other_session.execute('SELECT pg_advisory_lock(%s, hashtext(%s))', [namespace, key])
    with pytest.raises(OperationalError, match='lock timeout'):
        otp.issue_code(MOBILE if namespace == 2 else key, ip)
    other_session.execute('SELECT pg_advisory_unlock(%s, hashtext(%s))', [namespace, key])
    assert isinstance(otp.issue_code(MOBILE, ip), tuple)
