from django.urls import path

from . import api

urlpatterns = [
    path('api/requests', api.create, name='request-create'),
    path('api/requests/mine', api.mine, name='request-mine'),
]
