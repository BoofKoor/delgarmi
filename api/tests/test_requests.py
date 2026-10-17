from datetime import date, datetime, timedelta, timezone as dt_timezone

import pytest
from django.core import signing

from accounts.models import Family, OtpCode
from accounts.otp import TOKEN_SALT, issue_token
from care_requests import api as requests_api
from care_requests.models import Request, RequestEvent
from catalog.models import City, Service
from notifications.models import SmsOutbox

from .helpers import bearer, checked_code

pytestmark = pytest.mark.django_db
MOBILE = '09121234567'
OTHER = '09351112233'
TODAY = date(2026, 10, 17)  # the clock fixture: noon in Tehran


@pytest.fixture
def isfahan() -> City:
    return City.objects.get(slug='isfahan')


def switch_on(city: City, *slugs: str) -> None:
    city.set_active_services(Service.objects.filter(slug__in=slugs))


def payload(service: str, city: City | str | None = None, **changes) -> dict:
    answers = {
        'elderly-care': {'for': 'mother', 'age': '75-84', 'mobility': 'assisted', 'type': 'hourly', 'gender': 'any'},
        'home-nursing': {'tasks': ['dressing', 'injection'], 'order': 'yes', 'timing': 'scheduled', 'gender': 'female'},
        'child-care': {'count': 2, 'ages': ['1-3', '3-6'], 'hours': 'few', 'gender': 'female'},
        'therapy': {'session': 'online', 'for': 'self', 'gender': 'any'},
    }[service]
    data = {
        'service': service, 'answers': answers, 'city': city.code if isinstance(city, City) else city, 'neighbourhood': 'جلفا',
        'start': {'kind': 'asap', 'date': None}, 'time_window': 'morning',
        'name': 'مریم احمدی', 'best_time': 'any', 'consent': True,
    }
    data.update(changes)
    return data


def answers(service: str, **changes) -> dict:
    return {**payload(service)['answers'], **changes}


def submit(client, data, mobile=MOBILE):
    return client.post('/api/requests', data, content_type='application/json', **bearer(mobile))


def fields(response) -> dict:
    assert response.status_code == 400, response.content
    assert response.json()['error'] == 'invalid'
    return response.json()['fields']


# --- a request is stored ----------------------------------------------------------------------

@pytest.mark.parametrize('service', ['elderly-care', 'home-nursing', 'child-care'])
def test_each_in_person_service_is_stored_with_its_answers(client, clock, isfahan, service):
    response = submit(client, payload(service, isfahan))
    assert response.status_code == 201, response.content
    item = Request.objects.get(code=response.json()['code'])
    assert item.service.slug == service
    assert item.city == isfahan and item.online is False and item.neighbourhood == 'جلفا'
    assert item.answers == payload(service)['answers'] | ({'tasks': ['injection', 'dressing']} if service == 'home-nursing' else {})
    assert (item.start_kind, item.start_date) == ('asap', None)
    assert item.time_window == 'morning'
    assert (item.name, item.best_time, item.consent_version) == ('مریم احمدی', 'any', '1')
    assert item.consent_at == clock.now
    assert item.family.mobile == MOBILE


def test_online_therapy_needs_no_city_and_keeps_none(client, clock, isfahan):
    response = submit(client, payload('therapy', isfahan, start={'kind': 'tomorrow', 'date': None}, time_window='night'))
    assert response.status_code == 201
    assert response.json()['status'] == 'new'
    item = Request.objects.get()
    assert item.online is True and item.city is None and item.neighbourhood == ''
    assert (item.start_kind, item.start_date, item.time_window) == ('tomorrow', TODAY + timedelta(days=1), 'night')
    assert submit(client, payload('therapy', city=None, neighbourhood='')).status_code == 201


def test_the_code_is_six_digits(client, clock, isfahan):
    code = submit(client, payload('elderly-care', isfahan)).json()['code']
    assert len(code) == 6 and code.isascii() and code.isdigit() and code[0] != '0'


def test_a_taken_code_is_never_given_twice(client, clock, isfahan, monkeypatch):
    first = submit(client, payload('elderly-care', isfahan)).json()['code']
    picks = [int(first) - 100000, 4567]
    monkeypatch.setattr(requests_api.secrets, 'randbelow', lambda n: picks.pop(0))
    assert submit(client, payload('elderly-care', isfahan)).json()['code'] == '104567'


# --- waitlist or not ------------------------------------------------------------------------

def test_a_city_without_the_service_puts_the_request_on_the_waitlist(client, clock, isfahan):
    switch_on(isfahan, 'home-nursing')
    response = submit(client, payload('elderly-care', isfahan))
    assert response.json()['status'] == 'waitlist'
    assert Request.objects.get().status == 'waitlist'


def test_a_city_with_the_service_switched_on_gets_new(client, clock, isfahan):
    switch_on(isfahan, 'elderly-care')
    assert submit(client, payload('elderly-care', isfahan)).json()['status'] == 'new'


def test_a_service_switched_off_again_waitlists_again(client, clock, isfahan):
    switch_on(isfahan, 'child-care')
    switch_on(isfahan)
    assert submit(client, payload('child-care', isfahan)).json()['status'] == 'waitlist'


def test_in_person_therapy_follows_the_city_too(client, clock, isfahan):
    data = payload('therapy', isfahan, answers=answers('therapy', session='in-person'))
    assert submit(client, data).json()['status'] == 'waitlist'
    assert Request.objects.get().online is False
    switch_on(isfahan, 'therapy')
    assert submit(client, data).json()['status'] == 'new'


# --- what comes with it -------------------------------------------------------------------------

def test_the_first_history_line_says_the_site_form(client, clock, isfahan):
    submit(client, payload('elderly-care', isfahan))
    event = RequestEvent.objects.get()
    assert (event.old_status, event.new_status, event.by, event.by_label) == ('', 'waitlist', None, 'فرم سایت')


@pytest.mark.parametrize('active, template', [(True, 'request-new'), (False, 'request-waitlist')])
def test_an_sms_is_queued_with_the_matching_text(client, clock, isfahan, active, template):
    if active:
        switch_on(isfahan, 'elderly-care')
    code = submit(client, payload('elderly-care', isfahan)).json()['code']
    sms = SmsOutbox.objects.get()
    assert (sms.to, sms.template, sms.params, sms.status) == (MOBILE, template, {'code': code}, 'pending')


def test_nothing_is_kept_when_part_of_it_fails(client, clock, isfahan, monkeypatch):
    def broken(*args, **kwargs):
        raise RuntimeError('queue unavailable')

    monkeypatch.setattr(requests_api, 'queue', broken)
    with pytest.raises(RuntimeError):
        submit(client, payload('elderly-care', isfahan))
    assert not Request.objects.exists() and not Family.objects.exists() and not RequestEvent.objects.exists()


def test_one_family_per_number_and_each_request_keeps_its_own_name(client, clock, isfahan):
    submit(client, payload('elderly-care', isfahan))
    submit(client, payload('child-care', isfahan, name='علی احمدی'))
    family = Family.objects.get()
    assert family.name == 'علی احمدی'
    assert sorted(family.requests.values_list('name', flat=True)) == ['علی احمدی', 'مریم احمدی']


# --- one check, one request -----------------------------------------------------------------

def test_one_number_check_files_one_request(client, clock, isfahan):
    header = bearer(MOBILE)
    first = client.post('/api/requests', payload('elderly-care', isfahan), content_type='application/json', **header)
    assert first.status_code == 201
    again = client.post('/api/requests', payload('child-care', isfahan), content_type='application/json', **header)
    assert again.status_code == 401
    assert again.json() == {'error': 'token'}
    assert Request.objects.count() == 1 and SmsOutbox.objects.count() == 1
    # The same token still shows the family its request (the «ثبت شد» page needs that).
    assert client.get('/api/requests/mine', **header).status_code == 200


def test_a_refused_request_does_not_spend_the_check(client, clock, isfahan):
    header = bearer(MOBILE)
    refused = client.post('/api/requests', payload('elderly-care', isfahan, consent=False), content_type='application/json', **header)
    assert refused.status_code == 400
    assert client.post('/api/requests', payload('elderly-care', isfahan), content_type='application/json', **header).status_code == 201


def test_a_check_that_failed_part_way_can_be_used_again(client, clock, isfahan, monkeypatch):
    header = bearer(MOBILE)
    with monkeypatch.context() as patch:
        patch.setattr(requests_api, 'queue', lambda *args: (_ for _ in ()).throw(RuntimeError('queue unavailable')))
        with pytest.raises(RuntimeError):
            client.post('/api/requests', payload('elderly-care', isfahan), content_type='application/json', **header)
    assert client.post('/api/requests', payload('elderly-care', isfahan), content_type='application/json', **header).status_code == 201


def test_a_token_for_another_numbers_check_is_refused(client, clock, isfahan):
    other_check = checked_code(OTHER)
    forged = signing.TimestampSigner(salt=TOKEN_SALT).sign(f'{MOBILE}.{other_check.pk}')
    response = client.post('/api/requests', payload('elderly-care', isfahan), content_type='application/json',
                           HTTP_AUTHORIZATION=f'Bearer {forged}')
    assert response.status_code == 401
    assert not Request.objects.exists()


def test_a_code_never_entered_correctly_files_nothing(client, clock, isfahan):
    sent_only = checked_code(MOBILE)
    OtpCode.objects.filter(pk=sent_only.pk).update(used_at=None)
    token = issue_token(sent_only)
    response = client.post('/api/requests', payload('elderly-care', isfahan), content_type='application/json',
                           HTTP_AUTHORIZATION=f'Bearer {token}')
    assert response.status_code == 401


# --- checks ---------------------------------------------------------------------------------

def test_a_token_is_needed_before_anything_is_checked(client):
    response = client.post('/api/requests', {}, content_type='application/json')
    assert response.status_code == 401
    assert response.json() == {'error': 'token'}


def test_service_is_required_and_one_of_the_four(client, clock):
    assert fields(submit(client, {})) == {'service': 'required'}
    assert fields(submit(client, {**payload('elderly-care'), 'service': 'cleaning'})) == {'service': 'choice'}
    assert fields(submit(client, [1, 2])) == {'service': 'required'}


def test_every_question_must_be_answered(client, clock, isfahan):
    errors = fields(submit(client, payload('elderly-care', isfahan, answers={})))
    assert errors == {f'answers.{q}': 'required' for q in ['for', 'age', 'mobility', 'type', 'gender']}


def test_an_answer_must_be_one_of_the_options(client, clock, isfahan):
    data = payload('elderly-care', isfahan, answers=answers('elderly-care', age='120', gender=['any']))
    assert fields(submit(client, data)) == {'answers.age': 'choice', 'answers.gender': 'choice'}


def test_a_question_the_service_does_not_have_is_refused(client, clock, isfahan):
    data = payload('elderly-care', isfahan, answers=answers('elderly-care', topic='anxiety'))
    assert fields(submit(client, data)) == {'answers.topic': 'unknown'}


def test_many_choice_questions_need_one_or_more_distinct_options(client, clock, isfahan):
    for tasks, reason in [([], 'required'), (['injection', 'injection'], 'choice'), (['injection', 'massage'], 'choice'), ('injection', 'choice')]:
        data = payload('home-nursing', isfahan, answers=answers('home-nursing', tasks=tasks))
        assert fields(submit(client, data)) == {'answers.tasks': reason}, tasks


@pytest.mark.parametrize('count, ok', [(1, True), (6, True), (0, False), (7, False), (True, False), ('2', False), (2.5, False)])
def test_the_number_of_children_is_one_to_six(client, clock, isfahan, count, ok):
    response = submit(client, payload('child-care', isfahan, answers=answers('child-care', count=count)))
    if ok:
        assert response.status_code == 201
        assert Request.objects.get().answers['count'] == count
    else:
        assert fields(response) == {'answers.count': 'range'}


def test_a_city_is_needed_in_person_and_must_exist(client, clock, isfahan):
    assert fields(submit(client, payload('elderly-care', None))) == {'city': 'required'}
    assert fields(submit(client, payload('elderly-care', city='999999999999'))) == {'city': 'choice'}
    assert fields(submit(client, payload('elderly-care', city=isfahan.code.translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))))) == {'city': 'choice'}


def test_the_neighbourhood_is_optional_and_short(client, clock, isfahan):
    assert fields(submit(client, payload('elderly-care', isfahan, neighbourhood='ب' * 61))) == {'neighbourhood': 'length'}
    assert submit(client, payload('elderly-care', isfahan, neighbourhood='  ' + 'ب' * 60 + '  ')).status_code == 201
    assert submit(client, payload('elderly-care', isfahan, neighbourhood='')).status_code == 201
    assert submit(client, payload('elderly-care', isfahan, neighbourhood=None)).status_code == 201


def test_the_time_window_is_asked_only_for_hourly_care(client, clock, isfahan):
    assert fields(submit(client, payload('elderly-care', isfahan, time_window=None))) == {'time_window': 'required'}
    assert fields(submit(client, payload('elderly-care', isfahan, time_window='dawn'))) == {'time_window': 'choice'}
    data = payload('elderly-care', isfahan, answers=answers('elderly-care', type='live-in'), time_window='dawn')
    assert submit(client, data).status_code == 201
    assert Request.objects.get().time_window == ''


def test_urgent_nursing_asks_no_start_day_or_hours(client, clock, isfahan):
    data = payload('home-nursing', isfahan, answers=answers('home-nursing', timing='urgent'),
                   start={'kind': 'someday'}, time_window='dawn')
    assert submit(client, data).status_code == 201
    item = Request.objects.get()
    assert (item.start_kind, item.start_date, item.time_window) == ('', None, '')


def test_scheduled_nursing_needs_a_start(client, clock, isfahan):
    assert fields(submit(client, payload('home-nursing', isfahan, start=None))) == {'start': 'required'}
    assert fields(submit(client, payload('home-nursing', isfahan, start={'kind': 'someday'}))) == {'start': 'choice'}


@pytest.mark.parametrize('day, ok', [
    ('2026-10-17', True),    # today
    ('2027-01-15', True),    # today + 90
    ('2027-01-16', False),   # today + 91
    ('2026-10-16', False),   # yesterday
    ('1405-07-30', False),   # a Shamsi date written as if it were Gregorian
    ('2026-02-30', False),   # no such day
    ('20261020', False),
    (None, False),
])
def test_a_start_day_is_from_today_to_ninety_days_on(client, clock, isfahan, day, ok):
    response = submit(client, payload('elderly-care', isfahan, start={'kind': 'date', 'date': day}))
    if ok:
        assert response.status_code == 201
        assert Request.objects.get().start_date == date.fromisoformat(day)
    else:
        assert fields(response) == {'start': 'date'}


def test_today_and_tomorrow_are_tehran_days(client, clock, isfahan):
    clock.now = datetime(2026, 10, 17, 21, 0, tzinfo=dt_timezone.utc)  # 00:30 on 18 October in Tehran
    assert fields(submit(client, payload('elderly-care', isfahan, start={'kind': 'date', 'date': '2026-10-17'}))) == {'start': 'date'}
    submit(client, payload('elderly-care', isfahan, start={'kind': 'tomorrow', 'date': None}))
    assert Request.objects.get().start_date == date(2026, 10, 19)


def test_the_name_is_two_to_eighty_characters(client, clock, isfahan):
    assert fields(submit(client, payload('elderly-care', isfahan, name='  '))) == {'name': 'required'}
    assert fields(submit(client, payload('elderly-care', isfahan, name='م'))) == {'name': 'length'}
    assert fields(submit(client, payload('elderly-care', isfahan, name='م' * 81))) == {'name': 'length'}
    assert submit(client, payload('elderly-care', isfahan, name='  مریم   احمدی ')).status_code == 201
    assert Request.objects.get().name == 'مریم احمدی'


def test_the_call_time_is_one_of_the_options(client, clock, isfahan):
    assert fields(submit(client, payload('elderly-care', isfahan, best_time=None))) == {'best_time': 'required'}
    assert fields(submit(client, payload('elderly-care', isfahan, best_time='midnight'))) == {'best_time': 'choice'}


@pytest.mark.parametrize('consent', [False, None, 'true', 1])
def test_without_consent_nothing_is_stored(client, clock, isfahan, consent):
    assert fields(submit(client, payload('elderly-care', isfahan, consent=consent))) == {'consent': 'required'}
    assert not Request.objects.exists()


# --- the family's own requests --------------------------------------------------------------------

def test_mine_lists_only_this_numbers_requests_newest_first(client, clock, isfahan):
    switch_on(isfahan, 'elderly-care')
    first = submit(client, payload('elderly-care', isfahan)).json()['code']
    clock.advance(minutes=5)
    second = submit(client, payload('therapy')).json()['code']
    submit(client, payload('child-care', isfahan), mobile=OTHER)
    response = client.get('/api/requests/mine', **bearer(MOBILE))
    assert response.status_code == 200
    assert response['Cache-Control'] == 'no-store'
    body = response.json()
    assert [r['code'] for r in body] == [second, first]
    assert body[1] == {
        'code': first, 'status': 'new',
        'service': {'slug': 'elderly-care', 'name': 'مراقبت سالمند'},
        'city': {'name': isfahan.name, 'province': isfahan.province},
        'online': False, 'mobile': MOBILE, 'created_at': '2026-10-17T08:30:00Z',
        'events': [{'status': 'new', 'at': '2026-10-17T08:30:00Z'}],
    }
    assert body[0]['city'] is None and body[0]['online'] is True


def test_mine_with_a_code_gives_that_request_only_to_its_number(client, clock, isfahan):
    code = submit(client, payload('elderly-care', isfahan)).json()['code']
    own = client.get('/api/requests/mine', {'code': code}, **bearer(MOBILE))
    assert [r['code'] for r in own.json()] == [code]
    for mobile, asked in [(OTHER, code), (MOBILE, '999999')]:
        response = client.get('/api/requests/mine', {'code': asked}, **bearer(mobile))
        assert response.status_code == 404
        assert response.json() == {'error': 'not-found'}
        assert response['Cache-Control'] == 'no-store'


def test_mine_needs_a_token(client):
    assert client.get('/api/requests/mine', {'code': '123456'}).status_code == 401
