from django.contrib import admin
from django.db.models import Count

from common.jalali import format_jalali

from .models import Family
from .otp import latin_digits, normalize_mobile


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    """Made by the site's form (a checked number); the team only looks them up."""

    list_display = ['name', 'mobile', 'request_count', 'created']
    search_fields = ['mobile', 'name']
    search_help_text = 'شماره‌ی موبایل یا نام'
    fields = ['name', 'mobile', 'request_count', 'created']
    readonly_fields = ['request_count', 'created']

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(request_total=Count('requests'))

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_search_results(self, request, queryset, search_term):
        term = latin_digits(search_term.strip())
        return super().get_search_results(request, queryset, normalize_mobile(term) or term)

    @admin.display(description='درخواست‌ها', ordering='request_total')
    def request_count(self, obj: Family) -> str:
        return str(obj.request_total).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

    @admin.display(description='اولین درخواست', ordering='created_at')
    def created(self, obj: Family) -> str:
        return format_jalali(obj.created_at)
