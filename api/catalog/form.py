"""The request form's definition (form.json): served to the site as it is (GET /api/form), and the
rules every submitted request is checked against. The site and the API read the same file, so a
question changes in one place."""

import json
import re
from datetime import date, timedelta
from pathlib import Path

from django.utils import timezone

from .models import City

FORM = json.loads(Path(__file__).with_name('form.json').read_text(encoding='utf-8'))
_CODE = re.compile(r'[0-9]{1,12}')
_ISO_DAY = re.compile(r'[0-9]{4}-[0-9]{2}-[0-9]{2}')


def values(options: list[dict]) -> list[str]:
    return [o['value'] for o in options]


def label(options: list[dict], value) -> str:
    return next((o['label'] for o in options if o['value'] == value), str(value))


def _holds(condition, answers: dict, absent: bool) -> bool:
    """A condition from form.json: absent, true, or {"q": question, "in": [answers]}."""
    if condition is None:
        return absent
    if condition is True:
        return True
    answer = answers.get(condition['q'])
    return isinstance(answer, str) and answer in condition['in']


def in_person(service: str, answers: dict) -> bool:
    return _holds(FORM['services'][service].get('inPerson'), answers, True)


def asks_start(service: str, answers: dict) -> bool:
    return _holds(FORM['services'][service].get('start'), answers, True)


def asks_time_window(service: str, answers: dict) -> bool:
    return _holds(FORM['services'][service].get('timeWindow'), answers, False)


def _blank(value) -> bool:
    return value is None or value == '' or value == []


def _text(value) -> str | None:
    """Trimmed, inner runs of spaces made one; None when it is not text at all."""
    if value is None:
        return ''
    return ' '.join(value.split()) if isinstance(value, str) else None


def check_answers(service: str, raw) -> tuple[dict, dict]:
    """Every question of the service must be answered with one of its options."""
    questions = FORM['services'][service]['questions']
    raw = raw if isinstance(raw, dict) else {}
    answers, errors = {}, {}
    for key in raw:
        if key not in questions:
            errors[f'answers.{key}'] = 'unknown'
    for qid, q in questions.items():
        value, field = raw.get(qid), f'answers.{qid}'
        if _blank(value):
            errors[field] = 'required'
        elif q['control'] == 'counter':
            # bool is an int in Python; true is not a number of children.
            if type(value) is int and q['min'] <= value <= q['max']:
                answers[qid] = value
            else:
                errors[field] = 'range'
        elif q.get('multiple'):
            allowed = values(q['options'])
            if (isinstance(value, list) and all(isinstance(v, str) and v in allowed for v in value)
                    and len(set(value)) == len(value)):
                answers[qid] = [v for v in allowed if v in value]  # the form's order
            else:
                errors[field] = 'choice'
        elif isinstance(value, str) and value in values(q['options']):
            answers[qid] = value
        else:
            errors[field] = 'choice'
    return answers, errors


def validate(payload) -> tuple[dict, dict]:
    """A submitted request → (cleaned, errors). Errors name the field and the reason:
    required, choice, range, length, unknown or date. Answers that do not apply (a city for an
    online session, a start day for urgent nursing) are dropped, not stored."""
    data = payload if isinstance(payload, dict) else {}
    service = data.get('service')
    if _blank(service):
        return {}, {'service': 'required'}
    if not isinstance(service, str) or service not in FORM['services']:
        return {}, {'service': 'choice'}

    answers, errors = check_answers(service, data.get('answers'))
    place, contact = FORM['place'], FORM['contact']
    cleaned = {
        'service': service, 'answers': answers, 'online': not in_person(service, answers),
        'city': None, 'neighbourhood': '', 'start_kind': '', 'start_date': None, 'time_window': '',
    }

    if not cleaned['online']:
        code = data.get('city')
        if _blank(code):
            errors['city'] = 'required'
        else:
            city = City.objects.filter(code=code).first() if isinstance(code, str) and _CODE.fullmatch(code) else None
            if city is None:
                errors['city'] = 'choice'
            cleaned['city'] = city
        hood = _text(data.get('neighbourhood'))
        if hood is None or len(hood) > place['neighbourhood']['max']:
            errors['neighbourhood'] = 'length'
        else:
            cleaned['neighbourhood'] = hood

    if asks_start(service, answers):
        start = data.get('start') if isinstance(data.get('start'), dict) else {}
        kind, today = start.get('kind'), timezone.localdate()  # Tehran
        if _blank(kind):
            errors['start'] = 'required'
        elif kind == 'asap':
            cleaned['start_kind'] = 'asap'
        elif kind == 'tomorrow':
            cleaned['start_kind'], cleaned['start_date'] = 'tomorrow', today + timedelta(days=1)
        elif kind == 'date':
            day = _day(start.get('date'))
            if day is None or not today <= day <= today + timedelta(days=place['start']['maxDays']):
                errors['start'] = 'date'
            else:
                cleaned['start_kind'], cleaned['start_date'] = 'date', day
        else:
            errors['start'] = 'choice'

    if asks_time_window(service, answers):
        window = data.get('time_window')
        if _blank(window):
            errors['time_window'] = 'required'
        elif window not in values(place['timeWindow']['options']):
            errors['time_window'] = 'choice'
        else:
            cleaned['time_window'] = window

    name = _text(data.get('name'))
    if not name:
        errors['name'] = 'required'
    elif not 2 <= len(name) <= contact['name']['max']:
        errors['name'] = 'length'
    else:
        cleaned['name'] = name

    best = data.get('best_time')
    if _blank(best):
        errors['best_time'] = 'required'
    elif best not in values(contact['bestTime']['options']):
        errors['best_time'] = 'choice'
    else:
        cleaned['best_time'] = best

    if data.get('consent') is not True:
        errors['consent'] = 'required'
    cleaned['consent_version'] = contact['consent']['version']
    return cleaned, errors


def _day(raw) -> date | None:
    """'2026-10-25' → that day; another format or a day that does not exist (2026-02-30) → None."""
    if not isinstance(raw, str) or not _ISO_DAY.fullmatch(raw):
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return None


def answer_rows(service: str, answers: dict) -> list[tuple[str, str]]:
    """(question, answer) in Persian, in the form's order, for the team panel."""
    form = FORM['services'].get(service)
    if form is None:
        return [(key, str(value)) for key, value in answers.items()]
    rows = []
    for screen in form['screens']:
        for qid in screen['questions']:
            if qid not in answers:
                continue
            q, value = form['questions'][qid], answers[qid]
            if q['control'] == 'counter':
                text = str(value).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))
            elif isinstance(value, list):
                text = '، '.join(label(q['options'], v) for v in value)
            else:
                text = label(q['options'], value)
            rows.append((q['label'], text))
    return rows
