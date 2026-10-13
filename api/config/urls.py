from django.conf import settings
from django.contrib import admin
from django.urls import path

from config.health import health

admin.site.site_header = 'پنل تیم دلگرمی'
admin.site.site_title = 'پنل دلگرمی'
admin.site.index_title = 'مدیریت'

urlpatterns = [
    path('api/health', health, name='health'),
    path(f'{settings.PANEL_PATH}/', admin.site.urls),
]
