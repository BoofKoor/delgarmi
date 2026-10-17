from django.contrib import admin

from common.jalali import format_jalali_time

from .models import SmsOutbox
from .templates import NAMES, render


class TemplateFilter(admin.SimpleListFilter):
    title = 'متن'
    parameter_name = 'template'

    def lookups(self, request, model_admin):
        return list(NAMES.items())

    def queryset(self, request, queryset):
        return queryset.filter(template=self.value()) if self.value() else queryset


@admin.register(SmsOutbox)
class SmsOutboxAdmin(admin.ModelAdmin):
    """What the worker sent or is still trying to send. Codes for checking a number never come
    through here: they are sent at once and stored only as a hash."""

    list_display = ['to', 'text', 'status', 'attempts', 'created', 'sent']
    list_filter = ['status', TemplateFilter]
    search_fields = ['to']
    fields = ['to', 'template', 'text', 'status', 'attempts', 'created', 'next_try', 'sent', 'last_error']
    readonly_fields = ['text', 'created', 'next_try', 'sent']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description='متن پیامک')
    def text(self, obj: SmsOutbox) -> str:
        try:
            return render(obj.template, obj.params)
        except (KeyError, IndexError, ValueError):
            return f'{obj.template} {obj.params}'

    @admin.display(description='ثبت', ordering='created_at')
    def created(self, obj: SmsOutbox) -> str:
        return format_jalali_time(obj.created_at)

    @admin.display(description='تلاش بعدی')
    def next_try(self, obj: SmsOutbox) -> str:
        return format_jalali_time(obj.next_try_at) if obj.status == SmsOutbox.Status.PENDING else '—'

    @admin.display(description='فرستاده شد در', ordering='sent_at')
    def sent(self, obj: SmsOutbox) -> str:
        return format_jalali_time(obj.sent_at) if obj.sent_at else '—'
