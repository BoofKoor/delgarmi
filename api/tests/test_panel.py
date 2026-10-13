import pytest
from django.conf import settings


@pytest.mark.django_db
def test_admin_path_does_not_exist(client):
    assert client.get('/admin/').status_code == 404
    assert client.get('/admin/login/').status_code == 404


@pytest.mark.django_db
def test_panel_lives_at_the_configured_path_and_asks_for_login(client):
    response = client.get(f'/{settings.PANEL_PATH}/')
    assert response.status_code == 302
    assert response['Location'].startswith(f'/{settings.PANEL_PATH}/login/')


@pytest.mark.django_db
def test_panel_login_page_is_persian_and_right_to_left(client):
    page = client.get(f'/{settings.PANEL_PATH}/login/').content.decode()
    assert 'dir="rtl"' in page
    assert 'lang="fa"' in page
    assert 'پنل تیم دلگرمی' in page


@pytest.mark.django_db
def test_panel_refuses_framing(client):
    response = client.get(f'/{settings.PANEL_PATH}/login/')
    assert response['X-Frame-Options'] == 'DENY'
