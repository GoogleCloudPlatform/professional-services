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

"""Pytest configuration and fixtures for ADK2 Graph Asset tests."""
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import yaml


@pytest.fixture
def temp_dir():
    """Temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_yaml_dict():
    """Sample YAML configuration for testing."""
    return {
        "version": "1.0",
        "kind": "Agent",
        "metadata": {
            "id": "test-agent-001",
            "name": "TestAgent",
            "description": "Test agent",
            "owner_id": "test@example.com",
        },
        "spec": {
            "llms": [
                {
                    "id": "llm-test",
                    "provider": "vertexai",
                    "model": "gemini-2.5-flash",
                    "temperature": 0.5,
                    "max_tokens": 1024,
                }
            ],
            "tools": [],
            "memory": {"type": "standard", "persistence": True},
        },
        "workflow": {
            "nodes": [
                {"id": "start", "type": "start"},
                {
                    "id": "assistant",
                    "type": "llm",
                    "config": {
                        "llm_id": "llm-test",
                        "instructions": "Answer: {question}",
                        "system_prompt": "You are helpful.",
                        "tool_ids": [],
                        "knowledge_ids": [],
                    },
                    "inputs": [{"name": "question", "type": "text"}],
                },
                {"id": "end", "type": "end"},
            ],
            "edges": [
                {"source": "start", "target": "assistant"},
                {"source": "assistant", "target": "end"},
            ],
        },
    }


@pytest.fixture
def sample_yaml_file(temp_dir, sample_yaml_dict):
    """Sample YAML file for testing."""
    yaml_path = temp_dir / "sample_agent.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(sample_yaml_dict, f)
    return yaml_path


@pytest.fixture
def env_setup(monkeypatch, temp_dir):
    """Set up environment variables for testing."""
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")
    monkeypatch.setenv("STAGING_BUCKET", "gs://test-bucket")
    monkeypatch.setenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    monkeypatch.setenv("GOOGLE_GENAI_USE_VERTEXAI", "1")

    # Create .env file in temp location
    env_file = temp_dir / ".env"
    env_file.write_text(
        "GOOGLE_CLOUD_PROJECT=test-project\n"
        "STAGING_BUCKET=gs://test-bucket\n"
        "GOOGLE_CLOUD_LOCATION=us-central1\n"
    )

    return {
        "project": "test-project",
        "bucket": "gs://test-bucket",
        "location": "us-central1",
        "env_file": env_file,
    }


@pytest.fixture
def mock_vertexai():
    """Mock vertexai module."""
    with patch("agent.gcp_config.vertexai") as mock:
        mock.init = MagicMock()
        yield mock


@pytest.fixture
def mock_storage_client():
    """Mock GCS storage client."""
    with patch("google.cloud.storage.Client") as mock:
        client = MagicMock()
        bucket = MagicMock()
        bucket.exists = MagicMock(return_value=True)
        client.bucket = MagicMock(return_value=bucket)
        mock.return_value = client
        yield mock


@pytest.fixture
def mock_gcp_auth():
    """Mock GCP authentication."""
    with patch("google.auth.default") as mock_default:
        creds = MagicMock()
        mock_default.return_value = (creds, "test-project")
        yield mock_default
