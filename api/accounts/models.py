"""Families (whoever asks for care, known by a checked mobile number) and the codes that check it."""

from django.db import models
from django.utils import timezone


class Family(models.Model):
    mobile = models.CharField('شماره‌ی موبایل', max_length=11, unique=True)
    name = models.CharField('نام', max_length=80, help_text='نامی که در آخرین درخواست نوشته شد')
    created_at = models.DateTimeField('اولین درخواست', auto_now_add=True)
    updated_at = models.DateTimeField('آخرین تغییر', auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'خانواده'
        verbose_name_plural = 'خانواده‌ها'

    def __str__(self) -> str:
        return f'{self.name} ({self.mobile})'


class OtpCode(models.Model):
    """One code sent by SMS. The code itself is stored nowhere: only a keyed hash of it."""

    mobile = models.CharField('شماره‌ی موبایل', max_length=11, db_index=True)
    code_hash = models.CharField('هش کد', max_length=64)
    ip = models.GenericIPAddressField('IP', null=True, blank=True, db_index=True)
    created_at = models.DateTimeField('ساخته شد', default=timezone.now, db_index=True)
    expires_at = models.DateTimeField('اعتبار تا')
    attempts = models.PositiveSmallIntegerField('تلاش اشتباه', default=0)
    used_at = models.DateTimeField('استفاده شد', null=True, blank=True)
    voided = models.BooleanField('باطل', default=False)
    # One checked number, one request: the token from this code submits once (see care_requests.api).
    submitted_at = models.DateTimeField('درخواست با آن ثبت شد', null=True, blank=True)

    class Meta:
        verbose_name = 'کد تأیید'
        verbose_name_plural = 'کدهای تأیید'

    def __str__(self) -> str:
        return f'{self.mobile[:4]}***{self.mobile[-4:]}'
