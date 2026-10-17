"""Requests from the site's form and the history of their status. Calls and referrals: milestone 4."""

from django.conf import settings
from django.db import models


class Status(models.TextChoices):
    """The same names as web/lib/statuses.ts: the family, the SMS and the team see one word."""

    NEW = 'new', 'جدید'
    CALLING = 'calling', 'در حال تماس'
    MATCHING = 'matching', 'در حال پیدا کردن مرکز'
    INTRODUCED = 'introduced', 'معرفی به مرکز'
    IN_SERVICE = 'in-service', 'در حال ارائه‌ی خدمت'
    DONE = 'done', 'پایان یافته'
    WAITLIST = 'waitlist', 'لیست انتظار'
    CANCELLED = 'cancelled', 'لغو شده'


class StartKind(models.TextChoices):
    ASAP = 'asap', 'هر چه زودتر'
    TOMORROW = 'tomorrow', 'فردا'
    DATE = 'date', 'روز مشخص'


class Request(models.Model):
    code = models.CharField('کد پیگیری', max_length=6, unique=True)
    family = models.ForeignKey('accounts.Family', on_delete=models.PROTECT, related_name='requests', verbose_name='خانواده')
    name = models.CharField('نام تماس‌گیرنده', max_length=80, help_text='همان که در این درخواست نوشته شد')
    service = models.ForeignKey('catalog.Service', on_delete=models.PROTECT, related_name='requests', verbose_name='خدمت')
    city = models.ForeignKey(
        'catalog.City', on_delete=models.PROTECT, null=True, blank=True, related_name='requests',
        verbose_name='شهر', help_text='خالی یعنی جلسه‌ی آنلاین',
    )
    neighbourhood = models.CharField('محله', max_length=60, blank=True)
    online = models.BooleanField('آنلاین', default=False)
    start_kind = models.CharField('شروع', max_length=10, choices=StartKind.choices, blank=True,
                                  help_text='خالی وقتی پرسیده نمی‌شود (پرستاری فوری)')
    start_date = models.DateField('روز شروع', null=True, blank=True)
    time_window = models.CharField('ساعت مناسب', max_length=20, blank=True)
    answers = models.JSONField('پاسخ‌ها', default=dict)
    status = models.CharField('وضعیت', max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='requests', verbose_name='همکار پیگیری',
    )
    best_time = models.CharField('زمان تماس', max_length=20)
    consent_version = models.CharField('نسخه‌ی متن رضایت', max_length=10)
    consent_at = models.DateTimeField('زمان رضایت')
    created_at = models.DateTimeField('ثبت', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('آخرین تغییر', auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'درخواست'
        verbose_name_plural = 'درخواست‌ها'

    def __str__(self) -> str:
        return self.code


class RequestEvent(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='events', verbose_name='درخواست')
    old_status = models.CharField('وضعیت قبلی', max_length=20, choices=Status.choices, blank=True)
    new_status = models.CharField('وضعیت تازه', max_length=20, choices=Status.choices)
    by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='همکار')
    by_label = models.CharField('از طرف', max_length=40, blank=True, help_text='وقتی کار همکار نیست، مثلاً «فرم سایت»')
    at = models.DateTimeField('زمان', auto_now_add=True)
    note = models.TextField('یادداشت', blank=True)

    class Meta:
        ordering = ['at', 'pk']
        verbose_name = 'تغییر وضعیت'
        verbose_name_plural = 'تاریخچه‌ی وضعیت'

    def __str__(self) -> str:
        return f'{self.request.code}: {self.get_new_status_display()}'
