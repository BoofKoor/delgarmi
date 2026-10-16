from django import forms
from django.contrib import admin
from django.db.models import Prefetch

from common.jalali import format_jalali

from .models import City, CityService, Service
from .text import normalize_fa


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'hint', 'online_everywhere', 'order']
    readonly_fields = ['slug']
    fields = ['name', 'slug', 'hint', 'online_everywhere', 'order']

    # Each service has its own page on the site, so the four rows are fixed here.
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class CityForm(forms.ModelForm):
    active_services = forms.ModelMultipleChoiceField(
        queryset=Service.objects.all(),
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label='خدمت‌های حضوری فعال',
        help_text='درخواست خدمتی که اینجا تیک ندارد در لیست انتظار ثبت می‌شود. '
                  'خدمت‌هایی که «آنلاین در همه‌ی شهرها» هستند بدون تیک هم آنلاین گرفته می‌شوند.',
    )

    class Meta:
        model = City
        fields = ['name', 'province', 'code', 'slug', 'priority']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['active_services'].initial = [s.pk for s in self.instance.active_services()]


class ActiveServiceFilter(admin.SimpleListFilter):
    title = 'خدمت فعال'
    parameter_name = 'active'

    def lookups(self, request, model_admin):
        return [('yes', 'دارد'), ('no', 'ندارد')]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(city_services__is_active=True).distinct()
        if self.value() == 'no':
            return queryset.exclude(city_services__is_active=True)
        return queryset


class PageFilter(admin.SimpleListFilter):
    title = 'صفحه در سایت'
    parameter_name = 'page'

    def lookups(self, request, model_admin):
        return [('yes', 'دارد'), ('no', 'ندارد')]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(slug__isnull=False)
        if self.value() == 'no':
            return queryset.filter(slug__isnull=True)
        return queryset


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    form = CityForm
    list_display = ['name', 'province', 'services_column', 'slug', 'priority']
    list_filter = [ActiveServiceFilter, PageFilter, 'province']
    search_fields = ['search_name', 'search_province', 'code']
    search_help_text = 'نام شهر یا استان؛ ي/ی، ك/ک و فاصله فرقی نمی‌کند.'
    list_per_page = 50
    fieldsets = [
        (None, {'fields': ['name', 'province', 'code']}),
        ('خدمت‌ها', {'fields': ['active_services', 'active_since']}),
        ('صفحه و جست‌وجو', {'fields': ['slug', 'priority']}),
    ]
    readonly_fields = ['active_since']

    def get_queryset(self, request):
        rows = CityService.objects.select_related('service').order_by('service__order')
        return super().get_queryset(request).prefetch_related(Prefetch('city_services', queryset=rows))

    def get_readonly_fields(self, request, obj=None):
        # The Statistical Centre code identifies the city; it is typed only when adding one.
        return [*self.readonly_fields, 'code'] if obj else self.readonly_fields

    def get_search_results(self, request, queryset, search_term):
        term = search_term.strip()
        return super().get_search_results(request, queryset, term if term.isdigit() else normalize_fa(term))

    @admin.display(description='خدمت‌های حضوری فعال')
    def services_column(self, obj: City) -> str:
        return '، '.join(s.name for s in obj.active_services()) or '—'

    @admin.display(description='فعال از')
    def active_since(self, obj: City) -> str:
        rows = [cs for cs in obj.city_services.all() if cs.is_active]
        return '، '.join(f'{cs.service.name}: {format_jalali(cs.active_since)}' for cs in rows) or '—'

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        form.instance.set_active_services(form.cleaned_data['active_services'])
