import re

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model

from care_requests.models import Request
from catalog.models import City
from notifications.models import SmsOutbox

from .helpers import bearer
from .test_requests import MOBILE, payload

pytestmark = pytest.mark.django_db


@pytest.fixture
def panel(client):
    user = get_user_model().objects.create_superuser('mehdi', 'm@example.com', 'a-long-test-password')
    client.force_login(user)
    return client


def url(path: str) -> str:
    return f'/{settings.PANEL_PATH}/{path}'


@pytest.fixture
def two_requests(client, clock):
    isfahan = City.objects.get(slug='isfahan')
    data = payload('elderly-care', isfahan, answers={'for': 'mother', 'age': '75-84', 'mobility': 'assisted', 'type': 'hourly', 'gender': 'female'})
    elderly = client.post('/api/requests', data, content_type='application/json', **bearer(MOBILE)).json()['code']
    therapy = client.post('/api/requests', payload('therapy', name='علی رضایی'), content_type='application/json', **bearer('09351112233')).json()['code']
    return Request.objects.get(code=elderly), Request.objects.get(code=therapy)


def test_the_request_list_shows_what_the_team_calls_about(panel, two_requests):
    page = panel.get(url('care_requests/request/')).content.decode()
    elderly, therapy = two_requests
    for text in [elderly.code, therapy.code, 'مراقبت سالمند', 'روان‌درمانی', 'اصفهان', 'آنلاین', 'لیست انتظار', 'جدید',
                 'مریم احمدی', 'علی رضایی', MOBILE, '۲۵ مهر ۱۴۰۵، ۱۲:۰۰']:
        assert text in page, text


def test_the_request_list_filters_by_status_and_finds_numbers_typed_in_persian(panel, two_requests):
    elderly, therapy = two_requests
    page = panel.get(url('care_requests/request/'), {'status__exact': 'waitlist'}).content.decode()
    assert elderly.code in page and therapy.code not in page
    page = panel.get(url('care_requests/request/'), {'q': '۰۹۱۲ ۱۲۳ ۴۵۶۷'}).content.decode()
    assert elderly.code in page and therapy.code not in page


def test_a_request_shows_its_answers_and_details_in_persian(panel, two_requests):
    elderly, _ = two_requests
    page = panel.get(url(f'care_requests/request/{elderly.pk}/change/')).content.decode()
    for text in ['<th>برای چه کسی؟</th><td>مادر</td>', '<th>نوع مراقبت</th><td>ساعتی</td>',
                 '<th>مراقب خانم باشد یا آقا؟</th><td>خانم</td>', 'هر چه زودتر', 'صبح (۸ تا ۱۲)', 'هر وقت',
                 'متن نسخه‌ی ۱، ۲۵ مهر ۱۴۰۵، ۱۲:۰۰', 'لیست انتظار (فرم سایت)', 'جلفا', f'href="tel:{MOBILE}"']:
        assert text in page, text


def test_online_therapy_shows_online_in_place_of_a_city(panel, two_requests):
    _, therapy = two_requests
    page = panel.get(url(f'care_requests/request/{therapy.pk}/change/')).content.decode()
    assert re.search(r'<label>شهر:</label>\s*<div class="readonly">آنلاین</div>', page)


def test_requests_cannot_be_added_changed_or_deleted_from_the_panel_yet(panel, two_requests):
    elderly, _ = two_requests
    assert panel.get(url('care_requests/request/add/')).status_code == 403
    assert panel.get(url(f'care_requests/request/{elderly.pk}/delete/')).status_code == 403
    response = panel.post(url(f'care_requests/request/{elderly.pk}/change/'), {'status': 'done'})
    assert response.status_code == 403
    elderly.refresh_from_db()
    assert elderly.status == 'waitlist'


def test_families_and_the_sms_queue_are_listed(panel, two_requests):
    page = panel.get(url('accounts/family/')).content.decode()
    assert 'مریم احمدی' in page and MOBILE in page
    page = panel.get(url('notifications/smsoutbox/')).content.decode()
    elderly, _ = two_requests
    code = elderly.code.translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))
    assert f'دلگرمی: درخواست شما با کد {code} در لیست انتظار ثبت شد.' in page
    assert SmsOutbox.objects.count() == 2
    page = panel.get(url('notifications/smsoutbox/'), {'template': 'request-waitlist'}).content.decode()
    assert 'ثبت در لیست انتظار' in page and elderly.family.mobile in page and '09351112233' not in page


def test_codes_for_checking_numbers_are_not_in_the_panel(panel):
    assert panel.get(url('accounts/otpcode/')).status_code == 404
