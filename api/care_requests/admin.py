from django.contrib import admin
from django.utils.html import format_html, format_html_join

from accounts.otp import latin_digits, normalize_mobile
from catalog.form import FORM, answer_rows, label
from common.jalali import format_jalali, format_jalali_time

from .models import Request

ONLINE = 'آنلاین'


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    """Read-only for now: calls, referrals and status changes arrive with milestone 4."""

    list_display = ['code', 'service', 'place', 'status', 'name', 'mobile', 'created']
    list_filter = ['status', 'service']
    search_fields = ['code', 'family__mobile', 'name', 'family__name']
    search_help_text = 'کد پیگیری، شماره‌ی موبایل یا نام'
    list_select_related = ['service', 'city', 'family']
    list_per_page = 50
    fieldsets = [
        (None, {'fields': ['code', 'status', 'created', 'service', 'answers_table']}),
        ('مکان و زمان', {'fields': ['place', 'neighbourhood', 'start', 'window']}),
        ('تماس', {'fields': ['name', 'mobile', 'best', 'consent']}),
        ('تاریخچه', {'fields': ['history']}),
    ]
    readonly_fields = ['created', 'answers_table', 'place', 'start', 'window', 'mobile', 'best', 'consent', 'history']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_search_results(self, request, queryset, search_term):
        # ۰۹۱۲ ۳۴۵ ۶۷۸۹ and +98 912… find the number as stored; Persian digits find a code.
        term = latin_digits(search_term.strip())
        return super().get_search_results(request, queryset, normalize_mobile(term) or term)

    @admin.display(description='ثبت', ordering='created_at')
    def created(self, obj: Request) -> str:
        return format_jalali_time(obj.created_at)

    @admin.display(description='شهر')
    def place(self, obj: Request) -> str:
        return ONLINE if obj.city is None else obj.city.name

    @admin.display(description='موبایل')
    def mobile(self, obj: Request) -> str:
        return format_html('<a href="tel:{0}" dir="ltr">{0}</a>', obj.family.mobile)

    @admin.display(description='پاسخ‌ها')
    def answers_table(self, obj: Request) -> str:
        rows = answer_rows(obj.service.slug, obj.answers)
        if not rows:
            return '—'
        return format_html('<table>{}</table>', format_html_join('', '<tr><th>{}</th><td>{}</td></tr>', rows))

    @admin.display(description='شروع')
    def start(self, obj: Request) -> str:
        if obj.start_kind == 'asap':
            return FORM['place']['start']['asap']
        if obj.start_kind == 'tomorrow' and obj.start_date:
            return f'فردا، {format_jalali(obj.start_date)}'
        if obj.start_kind == 'date' and obj.start_date:
            return format_jalali(obj.start_date)
        return 'پرسیده نشد'

    @admin.display(description='ساعت مناسب')
    def window(self, obj: Request) -> str:
        return label(FORM['place']['timeWindow']['options'], obj.time_window) if obj.time_window else 'پرسیده نشد'

    @admin.display(description='زمان تماس')
    def best(self, obj: Request) -> str:
        return label(FORM['contact']['bestTime']['options'], obj.best_time)

    @admin.display(description='رضایت')
    def consent(self, obj: Request) -> str:
        return f'متن نسخه‌ی {obj.consent_version}، {format_jalali_time(obj.consent_at)}'.translate(
            str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

    @admin.display(description='تغییرهای وضعیت')
    def history(self, obj: Request) -> str:
        return format_html_join(
            '', '<div>{} — {} ({})</div>',
            ((format_jalali_time(e.at), e.get_new_status_display(), e.by.get_username() if e.by else e.by_label)
             for e in obj.events.select_related('by')),
        ) or '—'
