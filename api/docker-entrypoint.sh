#!/bin/sh
set -e
# Only the web process applies migrations; the worker and one-off commands start as they are.
if [ "$1" = "gunicorn" ]; then
  python manage.py migrate --noinput
fi
exec "$@"
