from datetime import datetime, timezone as dt_timezone

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from catalog.models import City, CityService, Service
from catalog.text import normalize_fa

pytestmark = pytest.mark.django_db
SERVICE_SLUGS = ['elderly-care', 'home-nursing', 'child-care', 'therapy']


def isfahan() -> City:
    return City.objects.get(slug='isfahan')


def service(slug: str) -> Service:
    return Service.objects.get(slug=slug)


# --- data loaded by the migrations -------------------------------------------------------

def test_migrations_load_every_city_and_the_four_services():
    assert City.objects.count() == 1354
    assert City.objects.exclude(slug=None).count() == 67
    assert City.objects.values('province').distinct().count() == 31
    assert list(Service.objects.values_list('slug', flat=True)) == SERVICE_SLUGS
    assert list(Service.objects.filter(online_everywhere=True).values_list('slug', flat=True)) == ['therapy']


def test_no_service_starts_switched_on_anywhere():
    assert not CityService.objects.exists()


def test_loaded_cities_have_search_keys():
    for name, key in City.objects.values_list('name', 'search_name')[:1354]:
        assert key == normalize_fa(name)


def test_same_named_cities_in_one_province_are_told_apart():
    names = set(City.objects.filter(province='مازندران', name__startswith='گلوگاه').values_list('name', flat=True))
    assert names == {'گلوگاه', 'گلوگاه (بابل)'}


# --- model behaviour ----------------------------------------------------------------------

def test_saving_a_city_recomputes_its_search_keys():
    city = isfahan()
    city.name = 'اصفهان‌ي'
    city.save(update_fields=['name'])
    assert City.objects.get(pk=city.pk).search_name == 'اصفهانی'


def test_a_name_can_appear_once_per_province():
    with pytest.raises(IntegrityError):
        City.objects.create(code='999999999', name='اصفهان', province='اصفهان')


def test_switching_services_keeps_one_row_and_dates_it():
    city, elderly, nursing = isfahan(), service('elderly-care'), service('home-nursing')
    city.set_active_services([elderly, nursing])
    first = CityService.objects.get(city=city, service=elderly)
    assert first.is_active and first.active_since is not None

    city.set_active_services([nursing])
    row = CityService.objects.get(pk=first.pk)
    assert not row.is_active and row.active_since is None
    assert CityService.objects.filter(city=city).count() == 2

    city.set_active_services([elderly, nursing])
    assert CityService.objects.get(pk=first.pk).active_since > first.active_since
    assert [s.slug for s in City.objects.get(pk=city.pk).active_services()] == ['elderly-care', 'home-nursing']


# --- API ----------------------------------------------------------------------------------

def test_services_endpoint_lists_the_four_in_order(client):
    response = client.get('/api/services')
    assert response.status_code == 200
    assert response['Cache-Control'] == 'public, max-age=60'
    data = response.json()
    assert [s['slug'] for s in data] == SERVICE_SLUGS
    assert data[0] == {
        'slug': 'elderly-care', 'name': 'مراقبت سالمند',
        'hint': 'همراه و مراقب آموزش‌دیده، ساعتی تا شبانه‌روزی', 'online_everywhere': False,
    }


def test_cities_endpoint_lists_every_city_largest_first(client):
    response = client.get('/api/cities')
    assert response.status_code == 200
    assert response['Cache-Control'] == 'public, max-age=300'
    data = response.json()
    assert len(data) == 1354
    assert [c['name'] for c in data[:4]] == ['تهران', 'مشهد', 'اصفهان', 'کرج']
    assert data[0]['code'].isdigit()
    assert {k: v for k, v in data[0].items() if k != 'code'} == {'name': 'تهران', 'province': 'تهران', 'slug': 'tehran', 'active': []}
    assert all(c['slug'] is None for c in data[67:])


def test_smaller_cities_follow_persian_alphabetical_order(client):
    names = [c['name'] for c in client.get('/api/cities').json() if c['province'] == 'تهران' and c['slug'] is None]
    # Byte order would put پ after ت and چ after ج.
    assert names.index('پردیس') < names.index('تجریش') < names.index('جوادآباد') < names.index('چهاردانگه')


def test_cities_endpoint_shows_switched_on_services(client):
    isfahan().set_active_services([service('therapy'), service('elderly-care')])
    data = {c['name']: c for c in client.get('/api/cities').json()}
    assert data['اصفهان']['active'] == ['elderly-care', 'therapy']
    assert data['شیراز']['active'] == []


def test_city_endpoint_by_page_address(client):
    isfahan().set_active_services([service('elderly-care')])
    response = client.get('/api/cities/isfahan')
    assert response.status_code == 200
    data = response.json()
    assert (data['name'], data['province'], data['slug']) == ('اصفهان', 'اصفهان', 'isfahan')
    flags = {s['slug']: (s['in_person'], s['online']) for s in data['services']}
    assert flags == {
        'elderly-care': (True, False), 'home-nursing': (False, False),
        'child-care': (False, False), 'therapy': (False, True),
    }


def test_city_endpoint_by_code_for_cities_without_a_page(client):
    city = City.objects.get(name='گلوگاه (بابل)')
    data = client.get(f'/api/cities/{city.code}').json()
    assert (data['name'], data['slug']) == ('گلوگاه (بابل)', None)


@pytest.mark.parametrize('path', ['/api/cities/nowhere', '/api/cities/Isfahan', '/api/cities/000', '/api/cities/'])
def test_unknown_cities_are_not_found(client, path):
    assert client.get(path).status_code == 404


def test_catalog_endpoints_are_read_only(client):
    assert client.post('/api/cities', {}, content_type='application/json').status_code == 405
    assert client.post('/api/services', {}, content_type='application/json').status_code == 405


# --- team panel ---------------------------------------------------------------------------

@pytest.fixture
def panel(client):
    user = get_user_model().objects.create_superuser('mehdi', 'm@example.com', 'a-long-test-password')
    client.force_login(user)
    return client


def url(path: str) -> str:
    return f'/{settings.PANEL_PATH}/catalog/{path}'


def test_panel_search_ignores_arabic_letters_and_spacing(panel):
    page = panel.get(url('city/'), {'q': 'نجف آباد'}).content.decode()
    assert 'نجف‌آباد' in page
    page = panel.get(url('city/'), {'q': 'كرمانشاه'}).content.decode()
    assert '>کرمانشاه<' in page


def test_panel_switches_services_on_from_the_city_form(panel):
    city = isfahan()
    form = panel.get(url(f'city/{city.pk}/change/')).content.decode()
    assert 'خدمت‌های حضوری فعال' in form
    response = panel.post(url(f'city/{city.pk}/change/'), {
        'name': city.name, 'province': city.province, 'slug': city.slug, 'priority': city.priority,
        'active_services': [service('elderly-care').pk, service('child-care').pk],
    })
    assert response.status_code == 302, response.content.decode()[:2000]
    assert [s.slug for s in City.objects.get(pk=city.pk).active_services()] == ['elderly-care', 'child-care']
    listing = panel.get(url('city/'), {'active': 'yes'}).content.decode()
    assert 'مراقبت سالمند، پرستار کودک' in listing
    assert 'شیراز' not in listing


def test_panel_shows_since_when_in_the_jalali_calendar(panel):
    city = isfahan()
    city.set_active_services([service('elderly-care')])
    CityService.objects.filter(city=city).update(active_since=datetime(2026, 10, 16, 12, 0, tzinfo=dt_timezone.utc))
    assert 'مراقبت سالمند: ۲۴ مهر ۱۴۰۵' in panel.get(url(f'city/{city.pk}/change/')).content.decode()


def test_panel_cannot_add_or_delete_services(panel):
    assert panel.get(url('service/add/')).status_code == 403
    elderly = service('elderly-care')
    assert panel.get(url(f'service/{elderly.pk}/delete/')).status_code == 403
    assert panel.get(url(f'service/{elderly.pk}/change/')).status_code == 200
