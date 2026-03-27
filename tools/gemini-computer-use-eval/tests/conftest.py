# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import patch


@pytest.fixture(autouse=True)
def mock_output_dir(tmp_path):
    """
    Automatically patches settings.OUTPUT_DIR for all tests
    to use a temporary directory. This prevents tests from
    polluting the real 'artifacts/' folder.
    """
    # We patch the 'settings' object in the config module
    # Note: If tests import settings directly, they might need a reload or
    # we need to ensure this patch is applied before they use it.
    # A cleaner way is to patch the ENV VAR if settings are loaded from env,
    # but since 'settings' is instantiated at module level, we patch the attribute.

    with patch(
        "computer_use_eval.config.settings.OUTPUT_DIR", str(tmp_path / "artifacts")
    ):
        yield


@pytest.fixture(autouse=True)
def disable_sandbox():
    """Globally disable real sandbox usage to prevent 403 API calls."""
    with patch("computer_use_eval.config.settings.USE_SANDBOX", False):
        yield
