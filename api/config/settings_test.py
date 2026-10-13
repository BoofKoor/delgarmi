"""Settings for pytest: the same as production, with throwaway values for the required secrets."""

import os

os.environ.setdefault('DJANGO_SECRET_KEY', 'test-only-not-secret')
os.environ.setdefault('PANEL_PATH', 'panel-test')

from .settings import *  # noqa: E402,F403

# The hashed-manifest storage needs collectstatic first; tests render the panel without it.
STORAGES = {**STORAGES, 'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}}  # noqa: F405
