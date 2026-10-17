from django.urls import path

from . import api

urlpatterns = [
    path('api/otp/send', api.send_code, name='otp-send'),
    path('api/otp/verify', api.verify_code, name='otp-verify'),
]
