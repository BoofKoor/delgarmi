import json
from pathlib import Path

import pytest

from catalog.form import FORM, answer_rows, asks_start, asks_time_window, in_person
from catalog.models import Service

FORM_FILE = Path(__file__).resolve().parents[1] / 'catalog' / 'form.json'


@pytest.mark.django_db
def test_the_form_endpoint_serves_the_file_as_it_is(client):
    response = client.get('/api/form')
    assert response.status_code == 200
    assert response['Cache-Control'] == 'public, max-age=60'
    assert response.json() == json.loads(FORM_FILE.read_text(encoding='utf-8'))


@pytest.mark.django_db
def test_the_form_has_exactly_the_four_services():
    assert list(FORM['services']) == list(Service.objects.values_list('slug', flat=True))


@pytest.mark.parametrize('slug', list(FORM['services']))
def test_every_question_is_on_exactly_one_screen_and_has_options(slug):
    form = FORM['services'][slug]
    on_screens = [qid for screen in form['screens'] for qid in screen['questions']]
    assert sorted(on_screens) == sorted(form['questions'])
    for qid, q in form['questions'].items():
        if q['control'] == 'counter':
            assert q['min'] <= q['default'] <= q['max'], qid
        else:
            values = [o['value'] for o in q['options']]
            assert values and len(set(values)) == len(values), qid


@pytest.mark.parametrize('slug', list(FORM['services']))
def test_every_condition_names_a_real_question_and_real_options(slug):
    form = FORM['services'][slug]
    for key in ('inPerson', 'start', 'timeWindow', 'urgentWarning'):
        condition = form.get(key)
        if condition in (None, True):
            continue
        options = [o['value'] for o in form['questions'][condition['q']]['options']]
        assert set(condition['in']) <= set(options), (slug, key)


def test_the_conditions_read_as_intended():
    assert in_person('elderly-care', {}) and not asks_time_window('elderly-care', {'type': 'day'})
    assert asks_time_window('elderly-care', {'type': 'hourly'})
    assert not asks_start('home-nursing', {'timing': 'urgent'}) and asks_start('home-nursing', {'timing': 'scheduled'})
    assert not in_person('therapy', {'session': 'online'}) and in_person('therapy', {'session': 'in-person'})
    assert asks_time_window('therapy', {}) and asks_start('therapy', {})


def test_the_panel_reads_answers_in_persian_in_the_forms_order():
    rows = answer_rows('home-nursing', {'gender': 'female', 'tasks': ['injection', 'dressing'], 'order': 'unknown', 'timing': 'urgent'})
    assert rows == [
        ('نوع خدمت', 'تزریق، پانسمان'),
        ('دستور پزشک دارید؟', 'نمی‌دانم'),
        ('زمان', 'فوری'),
        ('پرستار خانم باشد یا آقا؟', 'خانم'),
    ]
    assert answer_rows('child-care', {'count': 3, 'ages': ['under-1']}) == [('تعداد کودکان', '۳'), ('سن کودکان', 'زیر ۱ سال')]
