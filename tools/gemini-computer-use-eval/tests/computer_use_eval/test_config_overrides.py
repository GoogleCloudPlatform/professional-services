# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from unittest.mock import patch
from computer_use_eval.core.session_factory import SessionFactory
from computer_use_eval.config import ContextConfig


def test_session_factory_config_overrides():
    """
    Verify that SessionFactory accepts overrides for Playwright settings.
    """
    # Override settings passed to create
    config = {"environment": {"slow_mo": 100, "headless": False}}

    with patch("computer_use_eval.core.session_factory.PlaywrightEnv"
              ) as mock_env_cls:
        SessionFactory.create_session((1000, 1000),
                                      config=config,
                                      run_id="test",
                                      video_output_path="/tmp")

        # Verify PlaywrightEnv was initialized with overrides
        mock_env_cls.assert_called_once()
        kwargs = mock_env_cls.call_args.kwargs

        assert kwargs["slow_mo"] == 100
        assert kwargs["headless"] is False


def test_context_config_loading():
    """
    Verify ContextConfig loads correctly from dictionaries and handles defaults.
    """
    # 1. Default
    c1 = ContextConfig()
    assert c1.preset == "BALANCED"
    assert c1.max_images_in_history is None

    # 2. From Dictionary
    data = {
        "preset": "EFFICIENT",
        "max_images_in_history": 5,
        "enable_compaction": False,
        "thinking_level": "HIGH",
        "image_retention_strategy": "variable_fidelity",
    }
    c2 = ContextConfig(**data)
    assert c2.preset == "EFFICIENT"
    assert c2.max_images_in_history == 5
    assert c2.enable_compaction is False
    assert c2.thinking_level == "HIGH"
    assert c2.image_retention_strategy == "variable_fidelity"
    assert c2.enable_summarization is None
