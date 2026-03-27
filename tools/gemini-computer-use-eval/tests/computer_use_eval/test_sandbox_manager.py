# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, patch, ANY, AsyncMock
from computer_use_eval.browser.sandbox_manager import SandboxManager


@pytest.fixture
def mock_vertexai():
    with patch("vertexai.Client") as mock_client:
        yield mock_client


@pytest.fixture
def sandbox_manager(mock_vertexai):
    return SandboxManager(project_id="test-project", location="us-central1")


def test_init(sandbox_manager):
    assert sandbox_manager.project_id == "test-project"
    assert sandbox_manager.location == "us-central1"


def test_setup_session_success(sandbox_manager, mock_vertexai):
    with patch("computer_use_eval.browser.sandbox_manager.settings") as mock_settings:
        mock_settings.SANDBOX_AGENT_ENGINE_NAME = None
        mock_settings.SANDBOX_SERVICE_ACCOUNT = "sa@test.com"

        # Mock the client chain
        mock_client_instance = mock_vertexai.return_value
        mock_agent_engine = MagicMock()
        mock_agent_engine.api_resource.name = "agent-engine-123"
        mock_client_instance.agent_engines.create.return_value = mock_agent_engine

        mock_operation = MagicMock()
        mock_operation.response.name = "sandbox-123"
        mock_client_instance.agent_engines.sandboxes.create.return_value = (
            mock_operation
        )

        mock_sandbox_resource = MagicMock()
        mock_client_instance.agent_engines.sandboxes.get.return_value = (
            mock_sandbox_resource
        )

        mock_client_instance.agent_engines.sandboxes.generate_browser_ws_headers.return_value = (
            "ws://test-url",
            {"Authorization": "Bearer token"},
        )

        ws_url, headers = sandbox_manager.setup_session("session-1")

        assert ws_url == "ws://test-url"
        assert headers == {"Authorization": "Bearer token"}

        # Verify calls
        mock_client_instance.agent_engines.create.assert_called_once()
        mock_client_instance.agent_engines.sandboxes.create.assert_called_once()
        mock_client_instance.agent_engines.sandboxes.generate_browser_ws_headers.assert_called_once()


def test_setup_session_with_service_account(mock_vertexai):
    with patch("computer_use_eval.browser.sandbox_manager.settings") as mock_settings:
        mock_settings.SANDBOX_SERVICE_ACCOUNT = "sa@test.com"

        # Use a valid region (e.g. us-central1) to pass validation
        manager = SandboxManager("test-project", "us-central1")
        mock_client = mock_vertexai.return_value

        # Minimal mock setup for the happy path to reach generate_headers
        mock_client.agent_engines.create.return_value.api_resource.name = "ae"
        mock_client.agent_engines.sandboxes.create.return_value.response.name = "sb"
        mock_client.agent_engines.sandboxes.generate_browser_ws_headers.return_value = (
            "ws",
            {},
        )

        manager.setup_session("test")

        mock_client.agent_engines.sandboxes.generate_browser_ws_headers.assert_called_with(
            sandbox_environment=ANY,  # we don't care about the specific mock object here
            service_account_email="sa@test.com",
        )


def test_setup_session_failure(sandbox_manager, mock_vertexai):
    with patch("computer_use_eval.browser.sandbox_manager.settings") as mock_settings:
        mock_settings.SANDBOX_AGENT_ENGINE_NAME = None
        mock_settings.SANDBOX_SERVICE_ACCOUNT = "sa@test.com"

        mock_client = mock_vertexai.return_value
        mock_client.agent_engines.create.side_effect = Exception("API Error")

        with pytest.raises(Exception, match="API Error"):
            sandbox_manager.setup_session("fail-session")


@pytest.mark.asyncio
async def test_teardown(sandbox_manager, mock_vertexai):
    # Setup state
    sandbox_manager.client = mock_vertexai.return_value
    sandbox_manager.sandbox_name = "sandbox-123"
    sandbox_manager.agent_engine_name = "agent-engine-123"
    sandbox_manager._created_sandbox = True
    sandbox_manager._created_engine = True  # Emulate ephemeral engine

    with patch("asyncio.to_thread", AsyncMock()) as mock_thread:
        await sandbox_manager.teardown()

        # Verify both sandbox and engine deletion were scheduled
        calls = [call[0][0] for call in mock_thread.call_args_list]
        assert sandbox_manager.client.agent_engines.sandboxes.delete in calls
        assert sandbox_manager.client.agent_engines.delete in calls


@pytest.mark.asyncio
async def test_teardown_existing_engine(sandbox_manager, mock_vertexai):
    # Setup state
    sandbox_manager.client = mock_vertexai.return_value
    sandbox_manager.sandbox_name = "sandbox-123"
    sandbox_manager.agent_engine_name = "existing-engine-123"
    sandbox_manager._created_sandbox = True
    sandbox_manager._created_engine = False  # Emulate long-lived engine

    with patch("asyncio.to_thread", AsyncMock()) as mock_thread:
        await sandbox_manager.teardown()

        # Verify ONLY sandbox deletion was scheduled
        calls = [call[0][0] for call in mock_thread.call_args_list]
        assert sandbox_manager.client.agent_engines.sandboxes.delete in calls
        assert sandbox_manager.client.agent_engines.delete not in calls


@pytest.mark.asyncio
async def test_context_manager(sandbox_manager, mock_vertexai):
    sandbox_manager.client = mock_vertexai.return_value
    sandbox_manager.sandbox_name = "sandbox-cm"
    sandbox_manager._created_sandbox = True

    with patch("asyncio.to_thread", AsyncMock()) as mock_thread:
        async with sandbox_manager as sm:
            assert sm == sandbox_manager
            # do work

        # Verify teardown called on exit
        calls = [call[0][0] for call in mock_thread.call_args_list]
        assert sandbox_manager.client.agent_engines.sandboxes.delete in calls
