# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from computer_use_eval.browser.sandbox_manager import SandboxManager


@pytest.mark.asyncio
async def test_sandbox_manager_uses_existing_engine():
    """
    Ensures that SandboxManager uses an existing Agent Engine if provided in settings.
    """
    # 1. Setup mock settings
    with patch("computer_use_eval.browser.sandbox_manager.settings"
              ) as mock_settings:
        mock_settings.SANDBOX_AGENT_ENGINE_NAME = (
            "projects/test/locations/us-central1/agentEngines/existing-engine")
        mock_settings.SANDBOX_SERVICE_ACCOUNT = "test-sa@test.iam.gserviceaccount.com"
        mock_settings.VERTEX_API_BASE_URL = None

        # 2. Mock Vertex AI Client
        with patch("vertexai.Client") as mock_vertex_client_class:
            mock_client = MagicMock()
            mock_vertex_client_class.return_value = mock_client

            # Mock sandbox creation
            mock_op = MagicMock()
            mock_op.response.name = "projects/test/locations/us-central1/agentEngines/existing-engine/sandboxes/new-sandbox"
            mock_client.agent_engines.sandboxes.create.return_value = mock_op

            # Mock header generation
            mock_client.agent_engines.sandboxes.generate_browser_ws_headers.return_value = (
                "ws://test",
                {
                    "Authorization": "Bearer test"
                },
            )

            manager = SandboxManager(project_id="test", location="us-central1")
            ws_url, _ = manager.setup_session("test-session")

            # VERIFY: Agent Engine creation was NOT called
            mock_client.agent_engines.create.assert_not_called()

            # VERIFY: Sandbox creation used the EXISTING engine name
            mock_client.agent_engines.sandboxes.create.assert_called_once()
            args, kwargs = mock_client.agent_engines.sandboxes.create.call_args
            assert (
                kwargs["name"] ==
                "projects/test/locations/us-central1/agentEngines/existing-engine"
            )

            # VERIFY: Teardown does NOT delete the engine
            mock_client.agent_engines.delete = MagicMock()
            await manager.teardown()
            mock_client.agent_engines.delete.assert_not_called()
            # But DOES delete the sandbox
            mock_client.agent_engines.sandboxes.delete.assert_called_once()


@pytest.mark.asyncio
async def test_sandbox_manager_creates_ephemeral_engine_if_missing():
    """
    Ensures that SandboxManager creates a new Agent Engine if none is provided.
    """
    with patch("computer_use_eval.browser.sandbox_manager.settings"
              ) as mock_settings:
        mock_settings.SANDBOX_AGENT_ENGINE_NAME = None  # Missing engine
        mock_settings.SANDBOX_SERVICE_ACCOUNT = "test-sa@test.iam.gserviceaccount.com"
        mock_settings.VERTEX_API_BASE_URL = None

        with patch("vertexai.Client") as mock_vertex_client_class:
            mock_client = MagicMock()
            mock_vertex_client_class.return_value = mock_client

            # Mock engine creation
            mock_engine = MagicMock()
            mock_engine.api_resource.name = (
                "projects/test/locations/us-central1/agentEngines/new-engine")
            mock_client.agent_engines.create.return_value = mock_engine

            # Mock sandbox creation
            mock_op = MagicMock()
            mock_op.response.name = "projects/test/locations/us-central1/agentEngines/new-engine/sandboxes/new-sandbox"
            mock_client.agent_engines.sandboxes.create.return_value = mock_op

            # Mock header generation
            mock_client.agent_engines.sandboxes.generate_browser_ws_headers.return_value = (
                "ws://test",
                {
                    "Authorization": "Bearer test"
                },
            )

            manager = SandboxManager(project_id="test", location="us-central1")
            manager.setup_session("test-session")

            # VERIFY: Agent Engine creation WAS called
            mock_client.agent_engines.create.assert_called_once()

            # VERIFY: Teardown DOES delete the engine
            mock_client.agent_engines.delete = MagicMock()
            # In teardown, it's wrapped in asyncio.to_thread
            with patch("asyncio.to_thread", AsyncMock()) as mock_thread:
                await manager.teardown()
                # Verify it was queued for deletion
                calls = [call[0][0] for call in mock_thread.call_args_list]
                assert mock_client.agent_engines.delete in calls
                assert mock_client.agent_engines.sandboxes.delete in calls
