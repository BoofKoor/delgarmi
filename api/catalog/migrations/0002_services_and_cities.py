"""Loads the four services and the 1354 cities in data/cities.json. No service is switched on
in any city here; the team does that in the panel."""

import json
from pathlib import Path

from django.db import migrations

from catalog.text import normalize_fa

SERVICES = [
    # slug, name, hint, online everywhere
    ('elderly-care', 'مراقبت سالمند', 'همراه و مراقب آموزش‌دیده، ساعتی تا شبانه‌روزی', False),
    ('home-nursing', 'پرستاری در منزل', 'تزریق، سرم، پانسمان و مراقبت بعد از ترخیص', False),
    ('child-care', 'پرستار کودک', 'نگهداری از کودک در خانه، چند ساعت یا تمام روز', False),
    ('therapy', 'روان‌درمانی', 'جلسه‌ی آنلاین یا حضوری با درمانگر دارای پروانه', True),
]
CITIES = Path(__file__).resolve().parent.parent / 'data' / 'cities.json'


def load(apps, schema_editor):
    Service = apps.get_model('catalog', 'Service')
    City = apps.get_model('catalog', 'City')
    Service.objects.bulk_create([
        Service(slug=slug, name=name, hint=hint, online_everywhere=online, order=i)
        for i, (slug, name, hint, online) in enumerate(SERVICES, start=1)
    ])
    rows = json.loads(CITIES.read_text(encoding='utf-8'))
    City.objects.bulk_create([
        City(
            code=r['code'], name=r['name'], province=r['province'], slug=r['slug'], priority=r['priority'],
            search_name=normalize_fa(r['name']), search_province=normalize_fa(r['province']),
        )
        for r in rows
    ], batch_size=500)


def unload(apps, schema_editor):
    apps.get_model('catalog', 'City').objects.all().delete()
    apps.get_model('catalog', 'Service').objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [('catalog', '0001_initial')]
    operations = [migrations.RunPython(load, unload)]
