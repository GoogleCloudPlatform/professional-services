import pytest
from unittest import mock
from google.cloud import resourcemanager_v3
from google.cloud.logging_v2.types import logging_config
from google.cloud.logging_v2.services.config_service_v2 import ConfigServiceV2Client
from google.cloud import exceptions


from main import create_default_bucket, update_sink, create_bucket_update_sink


@pytest.fixture(autouse=True)
def mock_logging_client(monkeypatch):
    """Logging SDK Client Mock"""
    mock_client = mock.create_autospec(ConfigServiceV2Client)
    mock_client.return_value = mock_client
    return mock_client


@pytest.fixture(autouse=True)
def mock_folders_client(monkeypatch):
    """Logging SDK Client Mock"""
    mock_client = mock.create_autospec(resourcemanager_v3.FoldersClient)
    mock_client.return_value = mock_client
    return mock_client


@pytest.fixture(autouse=True)
def mock_projects_client(monkeypatch):
    """Logging SDK Client Mock"""
    mock_client = mock.create_autospec(resourcemanager_v3.ProjectsClient)
    mock_client.return_value = mock_client
    return mock_client


def test_create_default_bucket_calls_logging_api(mock_logging_client):
    """Tests if create_bucket is called with appropiate parameters"""

    response = create_default_bucket(
        mock_logging_client, "fake_project_id", "fake_region", "fake_bucket_id"
    )
    request = logging_config.CreateBucketRequest(
        parent="projects/fake_project_id/locations/fake_region",
        bucket_id="fake_bucket_id",
    )
    assert response is True
    mock_logging_client.create_bucket.assert_called_once_with(request=request)


def test_create_default_bucket_error_in_create_bucket(mock_logging_client):
    """Tests the return value is False when create_bucket fails"""

    mock_logging_client.create_bucket.side_effect = exceptions.ServiceUnavailable("503")
    response = create_default_bucket(
        mock_logging_client, "fake_project_id", "fake_region", "fake_bucket_id"
    )
    assert response is False


def test_update_sink_calls_logging_api(mock_logging_client):
    """Tests if update_sink is called with appropiate parameters"""

    filter = 'NOT LOG_ID("cloudaudit.googleapis.com/activity") AND NOT LOG_ID("externalaudit.googleapis.com/activity") AND NOT LOG_ID("cloudaudit.googleapis.com/system_event") AND NOT LOG_ID("externalaudit.googleapis.com/system_event") AND NOT LOG_ID("cloudaudit.googleapis.com/access_transparency") AND NOT LOG_ID("externalaudit.googleapis.com/access_transparency")'
    sink_name = "projects/fake_project_id/sinks/_Default"
    destination = "logging.googleapis.com/projects/fake_project_id/locations/fake_region/buckets/fake_bucket_id"
    sink = logging_config.LogSink(
        name=sink_name, destination=destination, filter=filter
    )
    update_sink_request = logging_config.UpdateSinkRequest(
        sink_name=sink_name, sink=sink, unique_writer_identity=True
    )

    response = update_sink(
        mock_logging_client, "fake_project_id", "fake_region", "fake_bucket_id"
    )
    mock_logging_client.update_sink.assert_called_once_with(update_sink_request)
    assert response is True


def test_update_sink_error_in_update_sink(mock_logging_client):
    """Tests the return value is false when update_sink fails"""

    mock_logging_client.update_sink.side_effect = exceptions.ServiceUnavailable("503")
    response = update_sink(
        mock_logging_client, "fake_project_id", "fake_region", "fake_bucket_id"
    )
    assert response is False


def test_create_bucket_update_sink_raises_error(mock_logging_client, *mocks):
    """Tests if FileNotFoundError is raised"""

    with pytest.raises(FileNotFoundError):
        create_bucket_update_sink(
            mock_logging_client, "dummy.txt", "fake_region", "fake_bucket_name"
        )
