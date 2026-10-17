"""The SMS queue. The worker sends what is due and retries what failed (run_worker)."""

from django.db import models
from django.utils import timezone


class SmsOutbox(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'در صف'
        SENT = 'sent', 'فرستاده شد'
        FAILED = 'failed', 'فرستاده نشد'

    to = models.CharField('گیرنده', max_length=11)
    template = models.CharField('متن', max_length=40, help_text='نام متن در notifications/templates.py')
    params = models.JSONField('مقدارها', default=dict)
    status = models.CharField('وضعیت', max_length=10, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveSmallIntegerField('تلاش‌ها', default=0)
    last_error = models.TextField('آخرین خطا', blank=True)
    created_at = models.DateTimeField('ثبت', default=timezone.now)
    next_try_at = models.DateTimeField('تلاش بعدی', default=timezone.now)
    sent_at = models.DateTimeField('فرستاده شد در', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'پیامک'
        verbose_name_plural = 'صف پیامک'
        indexes = [models.Index(fields=['status', 'next_try_at'], name='sms_due')]

    def __str__(self) -> str:
        return f'{self.template} → {self.to}'
