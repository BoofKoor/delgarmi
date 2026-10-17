"""Submitting a request from the site's form, and the requests of a checked number."""

import secrets

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import Family
from accounts.otp import checked_number, claim
from catalog.form import validate
from catalog.models import CityService, Service
from notifications.outbox import queue

from .models import Request, RequestEvent, Status

FORM_SITE = 'فرم سایت'


def _unauthorised() -> Response:
    return Response({'error': 'token'}, status=401)


def _new_code() -> str:
    return str(100000 + secrets.randbelow(900000))


def _create(**fields) -> Request:
    """With a random six-digit code; another one if that code is taken, even at the same moment."""
    for _ in range(20):
        code = _new_code()
        if Request.objects.filter(code=code).exists():
            continue
        try:
            with transaction.atomic():
                return Request.objects.create(code=code, **fields)
        except IntegrityError:
            if not Request.objects.filter(code=code).exists():
                raise  # not the code: something else is wrong
    raise RuntimeError('No free request code after 20 tries.')


@api_view(['POST'])
def create(request):
    checked = checked_number(request)
    if checked is None:
        return _unauthorised()
    mobile = checked.mobile
    cleaned, errors = validate(request.data)
    if errors:
        return Response({'error': 'invalid', 'fields': errors}, status=400)

    service = Service.objects.get(slug=cleaned['service'])
    city = cleaned['city']
    if cleaned['online']:
        status = Status.NEW
    else:
        active = CityService.objects.filter(city=city, service=service, is_active=True).exists()
        status = Status.NEW if active else Status.WAITLIST

    with transaction.atomic():
        if not claim(checked):
            # This check already filed a request. The form checks the number again for another one.
            return _unauthorised()
        family, _ = Family.objects.get_or_create(mobile=mobile, defaults={'name': cleaned['name']})
        if family.name != cleaned['name']:
            family.name = cleaned['name']
            family.save(update_fields=['name', 'updated_at'])
        item = _create(
            family=family, name=cleaned['name'], service=service, city=city,
            neighbourhood=cleaned['neighbourhood'], online=cleaned['online'],
            start_kind=cleaned['start_kind'], start_date=cleaned['start_date'],
            time_window=cleaned['time_window'], answers=cleaned['answers'], status=status,
            best_time=cleaned['best_time'], consent_version=cleaned['consent_version'], consent_at=timezone.now(),
        )
        RequestEvent.objects.create(request=item, old_status='', new_status=status, by_label=FORM_SITE)
        queue(mobile, 'request-new' if status == Status.NEW else 'request-waitlist', {'code': item.code})
    return Response({'code': item.code, 'status': status}, status=201)


def _as_json(item: Request) -> dict:
    return {
        'code': item.code,
        'status': item.status,
        'service': {'slug': item.service.slug, 'name': item.service.name},
        'city': {'name': item.city.name, 'province': item.city.province} if item.city else None,
        'online': item.online,
        'mobile': item.family.mobile,
        'created_at': item.created_at,
        'events': [{'status': e.new_status, 'at': e.at} for e in item.events.all()],
    }


@api_view(['GET'])
def mine(request):
    """The checked number's requests, newest first; with ?code= only that one, if it is theirs."""
    checked = checked_number(request)
    if checked is None:
        return _unauthorised()
    mobile = checked.mobile
    rows = (Request.objects.filter(family__mobile=mobile)
            .select_related('service', 'city', 'family').prefetch_related('events').order_by('-created_at'))
    code = request.query_params.get('code')
    if code is not None:
        rows = rows.filter(code=code)
        if not rows:
            return Response({'error': 'not-found'}, status=404, headers={'Cache-Control': 'no-store'})
    return Response([_as_json(item) for item in rows], headers={'Cache-Control': 'no-store'})
