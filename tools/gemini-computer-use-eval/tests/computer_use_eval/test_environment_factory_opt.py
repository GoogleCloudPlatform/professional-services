# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from computer_use_eval.core.session_factory import SessionFactory


@pytest.mark.asyncio
async def test_factory_video_disable():
    """
    Test that SessionFactory respects enable_video=False.
    """
    # 1. Enabled (Default)
    config_on = {"environment": {"enable_video": True}}
    env, _, _ = SessionFactory.create_session(
        (1280, 720),
        config=config_on,
        run_id="test_video_enabled",
        video_output_path="/tmp/",
    )
    assert env.video_dir is not None

    # 2. Disabled
    config_off = {"environment": {"enable_video": False}}
    env_off, _, _ = SessionFactory.create_session(
        (1280, 720),
        config=config_off,
        run_id="test_video_disabled",
        video_output_path="/tmp/",
    )
    assert env_off.video_dir is None
