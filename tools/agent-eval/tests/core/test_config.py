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
"""Tests for the config loader."""

import os
from unittest import mock

import pytest

from agent_eval.core.config import EvalConfig, get_location, get_project_id


@pytest.fixture(autouse=True)
def isolate_from_env_file():
    """Prevent tests from loading local .env file."""
    with mock.patch.dict(EvalConfig.model_config, {"env_file": None}):
        yield


def test_eval_config_defaults():
    """Verify default values are populated correctly."""
    # Clear environment to test pure defaults
    with mock.patch.dict(os.environ, {}, clear=True):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_PROJECT is None
        assert config.GOOGLE_CLOUD_LOCATION == "us-central1"
        assert config.MAX_RETRIES == 3
        assert config.RETRY_DELAY_SECONDS == 5
        assert config.MAX_WORKERS == 4


def test_eval_config_project_id_aliases():
    """Verify GOOGLE_CLOUD_PROJECT loads from all supported aliases and respects priority."""
    # 1. Test loading from PROJECT_ID (lowest priority alias)
    with mock.patch.dict(
        os.environ, {"PROJECT_ID": "low-priority-project"}, clear=True
    ):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_PROJECT == "low-priority-project"

    # 2. Test loading from GOOGLE_CLOUD_PROJECT (medium priority alias)
    with mock.patch.dict(
        os.environ,
        {"PROJECT_ID": "low", "GOOGLE_CLOUD_PROJECT": "medium-priority-project"},
        clear=True,
    ):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_PROJECT == "medium-priority-project"

    # 3. Test loading from EVAL_GOOGLE_CLOUD_PROJECT (highest priority prefixed env var)
    with mock.patch.dict(
        os.environ,
        {
            "PROJECT_ID": "low",
            "GOOGLE_CLOUD_PROJECT": "medium",
            "EVAL_GOOGLE_CLOUD_PROJECT": "high-priority-project",
        },
        clear=True,
    ):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_PROJECT == "high-priority-project"


def test_eval_config_location_aliases():
    """Verify GOOGLE_CLOUD_LOCATION loads from all supported aliases."""
    # 1. Test loading from LOCATION (alias)
    with mock.patch.dict(os.environ, {"LOCATION": "europe-west1"}, clear=True):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_LOCATION == "europe-west1"

    # 2. Test loading from GOOGLE_CLOUD_LOCATION (alias)
    with mock.patch.dict(
        os.environ,
        {"LOCATION": "europe", "GOOGLE_CLOUD_LOCATION": "us-east1"},
        clear=True,
    ):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_LOCATION == "us-east1"

    # 3. Test loading from EVAL_GOOGLE_CLOUD_LOCATION (prefixed)
    with mock.patch.dict(
        os.environ,
        {
            "LOCATION": "europe",
            "GOOGLE_CLOUD_LOCATION": "us-east1",
            "EVAL_GOOGLE_CLOUD_LOCATION": "asia-northeast1",
        },
        clear=True,
    ):
        config = EvalConfig()
        assert config.GOOGLE_CLOUD_LOCATION == "asia-northeast1"


def test_get_project_id_dynamic():
    """Verify get_project_id() resolves dynamically and picks up mock changes."""
    with mock.patch.dict(os.environ, {}, clear=True):
        assert get_project_id() is None

    with mock.patch.dict(
        os.environ, {"GOOGLE_CLOUD_PROJECT": "mocked-project"}, clear=True
    ):
        assert get_project_id() == "mocked-project"

    with mock.patch.dict(
        os.environ, {"PROJECT_ID": "another-mocked-project"}, clear=True
    ):
        assert get_project_id() == "another-mocked-project"


def test_get_location_dynamic():
    """Verify get_location() resolves dynamically and handles Gemini 3+ overrides."""
    # Standard fallback
    with mock.patch.dict(os.environ, {}, clear=True):
        assert get_location() == "us-central1"

    with mock.patch.dict(os.environ, {"GOOGLE_CLOUD_LOCATION": "us-east1"}, clear=True):
        assert get_location() == "us-east1"
        # Gemini 3+ models require 'global' location
        assert get_location(model="gemini-3.1-pro") == "global"
        assert get_location(model="gemini-3-flash") == "global"
        # Legacy/other models should still use the env location
        assert get_location(model="gemini-2.5-pro") == "us-east1"
