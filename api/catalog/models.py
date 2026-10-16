"""Services, cities, and which in-person service is active in which city."""

from django.db import models
from django.db.models import F
from django.db.models.functions import Collate
from django.utils import timezone

from .text import normalize_fa

# Persian alphabetical order (پ after ب, گ after ک); PostgreSQL ships this ICU collation.
PERSIAN = 'fa-x-icu'


def persian(field: str) -> Collate:
    return Collate(F(field), PERSIAN)


class Service(models.Model):
    slug = models.SlugField('نشانی', max_length=40, unique=True, help_text='بخش آخر نشانی صفحه‌ی خدمت، مثلاً elderly-care')
    name = models.CharField('نام', max_length=60)
    hint = models.CharField('توضیح کوتاه', max_length=120, help_text='یک خط زیر نام خدمت در فرم و کارت‌ها')
    online_everywhere = models.BooleanField(
        'آنلاین در همه‌ی شهرها', default=False,
        help_text='اگر روشن باشد، این خدمت در هر شهری به‌صورت آنلاین گرفته می‌شود؛ جلسه‌ی حضوری هنوز به فعال بودن شهر بستگی دارد.',
    )
    order = models.PositiveSmallIntegerField('ترتیب', default=0)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'خدمت'
        verbose_name_plural = 'خدمت‌ها'

    def __str__(self) -> str:
        return self.name


class City(models.Model):
    code = models.CharField('کد آمار', max_length=12, unique=True, help_text='کد شهر در داده‌ی مرکز آمار ایران')
    name = models.CharField('نام', max_length=60)
    province = models.CharField('استان', max_length=40)
    slug = models.SlugField(
        'نشانی صفحه', max_length=40, unique=True, null=True, blank=True,
        help_text='فقط شهرهایی که این خانه پر است صفحه‌ی خودشان را دارند، مثلاً isfahan برای /cities/isfahan.',
    )
    priority = models.PositiveSmallIntegerField(
        'اولویت', null=True, blank=True,
        help_text='عدد کمتر یعنی بالاتر در نتیجه‌های جست‌وجو؛ شهرهای بزرگ از پیش عدد دارند.',
    )
    # Written on save, so the panel search ignores ي/ی, ك/ک and spacing differences.
    search_name = models.CharField(max_length=60, editable=False, db_index=True)
    search_province = models.CharField(max_length=40, editable=False)
    services = models.ManyToManyField(Service, through='CityService', related_name='cities')

    class Meta:
        ordering = [F('priority').asc(nulls_last=True), persian('province'), persian('name')]
        verbose_name = 'شهر'
        verbose_name_plural = 'شهرها'
        constraints = [
            models.UniqueConstraint(fields=['name', 'province'], name='city_name_unique_in_province'),
        ]

    def __str__(self) -> str:
        return f'{self.name} ({self.province})'

    def active_services(self) -> list['Service']:
        return [cs.service for cs in self.city_services.all() if cs.is_active]

    def set_active_services(self, services) -> None:
        """Switches exactly these in-person services on here; switching off keeps the row."""
        wanted = {s.pk for s in services}
        rows = {cs.service_id: cs for cs in CityService.objects.filter(city=self)}
        for service_id in wanted - rows.keys():
            CityService.objects.create(city=self, service_id=service_id, is_active=True)
        for service_id, row in rows.items():
            if row.is_active != (service_id in wanted):
                row.is_active = service_id in wanted
                row.save()

    def save(self, *args, **kwargs):
        self.search_name = normalize_fa(self.name)
        self.search_province = normalize_fa(self.province)
        update_fields = kwargs.get('update_fields')
        if update_fields is not None and {'name', 'province'} & set(update_fields):
            kwargs['update_fields'] = {*update_fields, 'search_name', 'search_province'}
        super().save(*args, **kwargs)


class CityService(models.Model):
    """An in-person service in a city. A row exists once the service was switched on there."""

    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='city_services', verbose_name='شهر')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='city_services', verbose_name='خدمت')
    is_active = models.BooleanField('فعال', default=True)
    active_since = models.DateTimeField('فعال از', null=True, blank=True)

    class Meta:
        verbose_name = 'خدمت فعال در شهر'
        verbose_name_plural = 'خدمت‌های فعال در شهرها'
        constraints = [
            models.UniqueConstraint(fields=['city', 'service'], name='one_row_per_city_and_service'),
        ]

    def __str__(self) -> str:
        return f'{self.service} در {self.city.name}'

    def save(self, *args, **kwargs):
        if self.is_active and self.active_since is None:
            self.active_since = timezone.now()
        elif not self.is_active:
            self.active_since = None
        super().save(*args, **kwargs)
