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

"""Tests for GCP configuration module."""
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from agent.gcp_config import init_vertex_ai


class TestVertexAiInitialization:
    """Test Vertex AI initialization."""

    def test_init_vertex_ai_success(self, env_setup, mock_vertexai):
        """Test successful Vertex AI initialization."""
        config = init_vertex_ai()

        assert config is not None
        assert "project" in config
        assert "location" in config
        assert config["project"] == "test-project"
        assert config["location"] == "us-central1"

    def test_init_vertex_ai_with_staging_bucket(self, env_setup, mock_vertexai):
        """Test initialization with staging bucket."""
        config = init_vertex_ai(staging_bucket="gs://custom-bucket")

        assert config is not None
        mock_vertexai.init.assert_called_once()

    def test_init_vertex_ai_env_variables(self, monkeypatch, mock_vertexai):
        """Test that environment variables are properly set."""
        monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "my-project")
        monkeypatch.setenv("GOOGLE_CLOUD_LOCATION", "europe-west1")

        config = init_vertex_ai()

        assert config["project"] == "my-project"
        assert config["location"] == "europe-west1"

    def test_init_vertex_ai_default_location(self, env_setup, mock_vertexai):
        """Test default location when not specified."""
        config = init_vertex_ai()

        # Should use default
        assert config["location"] in ["us-central1", "us-central1"]

    @patch("agent.gcp_config.service_account.Credentials.from_service_account_file")
    def test_init_vertex_ai_with_credentials_file(
        self, mock_from_file, env_setup, temp_dir, mock_vertexai
    ):
        """Test initialization with service account credentials file."""
        # Create mock service account file
        creds_file = temp_dir / "creds.json"
        creds_file.write_text('{"type": "service_account"}')

        import os

        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_file)

        config = init_vertex_ai()

        assert config is not None
        assert str(creds_file) in config.get("credentials_path", "")
        mock_from_file.assert_called_once_with(str(creds_file.resolve()))


class TestEnvironmentVariables:
    """Test environment variable handling."""

    def test_google_genai_use_vertexai_set(self, monkeypatch, mock_vertexai):
        """Test GOOGLE_GENAI_USE_VERTEXAI is set to 1."""
        init_vertex_ai()

        import os

        assert os.environ.get("GOOGLE_GENAI_USE_VERTEXAI") == "1"

    def test_project_env_override(self, monkeypatch, mock_vertexai):
        """Test environment variable overrides default."""
        monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "custom-project")

        config = init_vertex_ai()

        assert config["project"] == "custom-project"

    def test_location_env_override(self, monkeypatch, mock_vertexai):
        """Test location environment variable."""
        monkeypatch.setenv("GOOGLE_CLOUD_LOCATION", "asia-northeast1")

        config = init_vertex_ai()

        assert config["location"] == "asia-northeast1"


class TestCredentialsHandling:
    """Test credential file handling."""

    @patch("agent.gcp_config.service_account.Credentials.from_service_account_file")
    def test_credentials_path_resolution(
        self, mock_from_file, env_setup, mock_vertexai, temp_dir
    ):
        """Test service account credentials file path resolution."""
        creds_file = temp_dir / "service-account-key.json"
        creds_file.write_text('{"type": "service_account"}')

        import os

        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_file)

        config = init_vertex_ai()

        assert config["credentials_path"] is not None
        mock_from_file.assert_called_once_with(str(creds_file.resolve()))

    def test_credentials_file_not_found(self, monkeypatch, mock_vertexai):
        """Test when credentials file path is invalid."""
        monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", "/nonexistent/creds.json")

        # Should not raise, should fall back to ADC
        config = init_vertex_ai()

        assert config is not None


class TestVertexAiInitCall:
    """Test Vertex AI init API call."""

    def test_vertexai_init_called_with_project(self, env_setup, mock_vertexai):
        """Test that vertexai.init is called with project."""
        init_vertex_ai()

        mock_vertexai.init.assert_called_once()
        call_kwargs = mock_vertexai.init.call_args[1]
        assert call_kwargs.get("project") == "test-project"

    def test_vertexai_init_called_with_location(self, env_setup, mock_vertexai):
        """Test that vertexai.init is called with location."""
        init_vertex_ai()

        mock_vertexai.init.assert_called_once()
        call_kwargs = mock_vertexai.init.call_args[1]
        assert call_kwargs.get("location") == "us-central1"

    def test_vertexai_init_called_with_bucket(self, env_setup, mock_vertexai):
        """Test that vertexai.init is called with staging bucket."""
        init_vertex_ai(staging_bucket="gs://my-bucket")

        mock_vertexai.init.assert_called_once()
        call_kwargs = mock_vertexai.init.call_args[1]
        assert call_kwargs.get("staging_bucket") == "gs://my-bucket"


class TestDotenvLoading:
    """Test .env file loading."""

    def test_dotenv_from_project_root(self, env_setup, mock_vertexai):
        """Test loading .env from project root."""
        # Should load without error
        config = init_vertex_ai()

        assert config is not None

    def test_dotenv_from_agent_directory(self, env_setup, mock_vertexai, temp_dir):
        """Test loading .env from agent directory."""
        # Create .env in agent subdirectory
        agent_env = temp_dir / "agent" / ".env"
        agent_env.parent.mkdir(exist_ok=True)
        agent_env.write_text("GOOGLE_CLOUD_PROJECT=agent-project\n")

        config = init_vertex_ai()

        assert config is not None


class TestErrorHandling:
    """Test error handling in initialization."""

    @patch("agent.gcp_config.load_dotenv")
    def test_missing_project_id(self, mock_load_dotenv, monkeypatch, mock_vertexai):
        """Test behavior when project ID is missing."""
        monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)

        with pytest.raises(ValueError, match="GOOGLE_CLOUD_PROJECT"):
            init_vertex_ai()

    def test_invalid_location(self, monkeypatch, mock_vertexai):
        """Test with invalid location (should still work)."""
        monkeypatch.setenv("GOOGLE_CLOUD_LOCATION", "invalid-location")

        config = init_vertex_ai()

        assert config["location"] == "invalid-location"
