from django.urls import path, re_path

from . import api

urlpatterns = [
    path('api/services', api.services, name='services'),
    path('api/cities', api.cities, name='cities'),
    re_path(r'^api/cities/(?P<key>[a-z0-9-]{1,40})$', api.city, name='city'),
]
