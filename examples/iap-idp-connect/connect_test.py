# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from connect import (
    update_iap_settings,
    get_firebase_api_key_string,
    validate_backend_services,
    validate_tenant_ids,
)
from exceptions.connector_exception import ConnectorException
import pytest
from google.cloud import api_keys_v2
from unittest.mock import patch, Mock


# Define a test case
def test_validate_tenant_ids():
    # Mock the function's external dependencies using patch
    with patch("connect.set") as mock_set:
        # Mock the behavior of set() for the input data
        mock_set.return_value.issuperset.return_value = True
        mock_set.return_value.__sub__.return_value = set()

        # Input data
        all_tenant_ids = [1, 2, 3, 4, 5]
        tenant_ids_to_check = [3, 4, 6]

        # Call the function
        is_valid, missing_tenants = validate_tenant_ids(
            all_tenant_ids, tenant_ids_to_check
        )

    # Assertions
    assert is_valid is True
    assert missing_tenants == []


def test_validate_backend_services():
    # Mock the function's external dependencies using patch
    with patch("connect.set") as mock_set:
        # Mock the behavior of set() for the input data
        mock_set.return_value.issuperset.return_value = True
        mock_set.return_value.__sub__.return_value = set()

        # Input data
        all_tenant_ids = [1, 2, 3, 4, 5]
        tenant_ids_to_check = [3, 4, 6]

        # Call the function
        is_valid, missing_tenants = validate_backend_services(
            all_tenant_ids, tenant_ids_to_check
        )

    # Assertions
    assert is_valid is True
    assert missing_tenants == []


# Define a test case
# Define a test case
def test_update_iap_settings_positive():
    # Mock the IdentityAwareProxyAdminServiceClient and its methods
    mock_client = Mock()
    mock_update_iap_settings = Mock()
    mock_client.update_iap_settings = mock_update_iap_settings

    # Mock the credentials and other function arguments
    credentials = Mock()
    project_id = "your-project-id"
    sign_in_url = "https://example.com/signin"
    backend = "your-backend-service"
    api_key_arg = "your-api-key"
    tenant_ids = ["tenant1", "tenant2"]
    # Assertions
    expected_backend_service_resource_name = (
        f"projects/{project_id}/iap_web/compute/services/{backend}"
    )
    expected_sign_in_url = f"{sign_in_url}?apiKey={api_key_arg}"
    expected_request = {
        "iap_settings": {
            "name": expected_backend_service_resource_name,
            "access_settings": {
                "gcip_settings": {
                    "tenant_ids": tenant_ids,
                    "login_page_uri": expected_sign_in_url,
                }
            },
        }
    }

    mock_update_iap_settings.return_value = expected_request
    # Call the function with mocks
    with patch(
        "connect.iap_v1.IdentityAwareProxyAdminServiceClient", return_value=mock_client
    ):
        response = update_iap_settings(
            credentials, project_id, sign_in_url, backend, api_key_arg, tenant_ids
        )

    mock_update_iap_settings.assert_called_once_with(request=expected_request)
    assert (
        response["iap_settings"]["name"]
        == "projects/your-project-id/iap_web/compute/services/your-backend-service"
    )
    assert response["iap_settings"]["access_settings"] == {
        "gcip_settings": {
            "tenant_ids": tenant_ids,
            "login_page_uri": expected_sign_in_url,
        }
    }


def test_update_iap_settings_negative():
    # Prepare some dummy input values
    credentials = None  # Replace with valid credentials if necessary
    project_id = "my-project"
    sign_in_url = "https://example.com/signin"
    backend = "my-backend"
    api_key_arg = "my-api-key"
    tenant_ids = ["tenant1", "tenant2"]

    # Simulate a scenario where an exception is raised when calling update_iap_settings
    with pytest.raises(ConnectorException):
        update_iap_settings(
            credentials, project_id, sign_in_url, backend, api_key_arg, tenant_ids
        )


def create_pager(display_name="Browser key (auto created by Firebase)"):
    # Your sample data
    key = api_keys_v2.types.Key(
        name="projects/dummy/locations/global/keys/dummy", display_name=display_name
    )
    response = api_keys_v2.types.ListKeysResponse(keys=[key])
    pager = api_keys_v2.services.api_keys.pagers.ListKeysPager(
        response=response, method=None, request=None
    )
    return pager


def test_get_firebase_api_key_string_positive():
    # Mock the IdentityAwareProxyAdminServiceClient and its methods
    mock_key_client = Mock()
    mock_get_key_string = Mock()
    mock_key_client.get_key_string = mock_get_key_string

    mock_list = Mock()
    mock_key_client.list_keys = mock_list

    # Mock the credentials and other function arguments
    credentials = Mock()
    project_id = "your-project-id"

    mock_list.return_value = create_pager()
    mock_get_key_string.return_value = api_keys_v2.types.GetKeyStringResponse(
        key_string="dummy"
    )

    # Call the function with mocks
    with patch("connect.api_keys_v2.ApiKeysClient", return_value=mock_key_client):
        response = get_firebase_api_key_string(credentials, project_id)

    print(response)
    assert response == "dummy"


def test_get_firebase_api_key_string_negative():
    # Mock the IdentityAwareProxyAdminServiceClient and its methods
    mock_key_client = Mock()
    mock_get_key_string = Mock()
    mock_key_client.get_key_string = mock_get_key_string

    mock_list = Mock()
    mock_key_client.list_keys = mock_list

    # Mock the credentials and other function arguments
    credentials = Mock()
    project_id = "your-project-id"

    mock_list.return_value = create_pager(display_name="dummy")
    mock_get_key_string.return_value = api_keys_v2.types.GetKeyStringResponse(
        key_string="dummy"
    )

    # Call the function with mocks
    with patch("connect.api_keys_v2.ApiKeysClient", return_value=mock_key_client):
        with pytest.raises(ConnectorException):
            get_firebase_api_key_string(credentials, project_id)
