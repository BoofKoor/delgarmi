from unittest import mock

import pytest
from django.db import OperationalError


@pytest.mark.django_db
def test_health_reports_ok_when_the_database_answers(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok', 'db': 'ok'}
    assert 'no-cache' in response['Cache-Control']


@pytest.mark.django_db
def test_health_fails_when_the_database_is_down(client):
    with mock.patch('config.health.connection.cursor', side_effect=OperationalError('down')):
        response = client.get('/api/health')
    assert response.status_code == 503
    assert response.json() == {'status': 'error', 'db': 'down'}


def test_health_only_answers_get(client):
    assert client.post('/api/health').status_code == 405
