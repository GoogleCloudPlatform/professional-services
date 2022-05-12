"""
Unit test for main module
"""
import pytest

import main


@pytest.fixture
def _client():
    main.app.testing = True
    return main.app.test_client()


def test_handler_ping(_client):
    '''Test Ping'''
    response = _client.get("/")
    assert response.data.decode() == "BQ insertion Service"
    assert response.status_code == 200
