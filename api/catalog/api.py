"""Read-only endpoints for the site: services, cities, and what is active in a city."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import City, CityService, Service


def _cached(data, seconds: int) -> Response:
    return Response(data, headers={'Cache-Control': f'public, max-age={seconds}'})


@api_view(['GET'])
def services(request):
    return _cached([
        {'slug': s.slug, 'name': s.name, 'hint': s.hint, 'online_everywhere': s.online_everywhere}
        for s in Service.objects.all()
    ], 60)


@api_view(['GET'])
def cities(request):
    """Every city, largest first, with the in-person services active there. The site searches
    this list in the browser, so typing never waits for the network."""
    active: dict[int, list[str]] = {}
    for row in CityService.objects.filter(is_active=True).select_related('service').order_by('service__order'):
        active.setdefault(row.city_id, []).append(row.service.slug)
    return _cached([
        {'code': c.code, 'name': c.name, 'province': c.province, 'slug': c.slug, 'active': active.get(c.pk, [])}
        for c in City.objects.only('pk', 'code', 'name', 'province', 'slug')
    ], 300)


@api_view(['GET'])
def city(request, key: str):
    """One city by its page address (isfahan) or its Statistical Centre code."""
    city = get_object_or_404(City, **({'code': key} if key.isdigit() else {'slug': key}))
    active = set(city.city_services.filter(is_active=True).values_list('service_id', flat=True))
    return _cached({
        'code': city.code, 'name': city.name, 'province': city.province, 'slug': city.slug,
        'services': [
            {'slug': s.slug, 'name': s.name, 'in_person': s.pk in active, 'online': s.online_everywhere}
            for s in Service.objects.all()
        ],
    }, 60)
