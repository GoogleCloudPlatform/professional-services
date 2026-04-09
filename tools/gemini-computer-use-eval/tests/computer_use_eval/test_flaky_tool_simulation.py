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
from unittest.mock import MagicMock, AsyncMock
from computer_use_eval.core.middleware.stalemate_detection import (
    StalemateDetectionMiddleware,)


class FlakyTool:

    def __init__(self, failures_before_success=2):
        self.call_count = 0
        self.failures_before_success = failures_before_success

    async def flaky_action(self):
        self.call_count += 1
        if self.call_count <= self.failures_before_success:
            return {"error": "Transient failure, please retry."}
        return {"status": "ok", "message": "Success!"}


@pytest.mark.asyncio
async def test_flaky_tool_end_to_end_simulation():
    """
    Simulates the agent loop processing a flaky tool.
    """
    mock_env = MagicMock()
    mock_env.get_aria_snapshot = AsyncMock(return_value="snapshot")

    # Instantiate Middleware directly to test the logic flow
    mw = StalemateDetectionMiddleware(mock_env)

    flaky = FlakyTool(failures_before_success=2)
    action_name = "flaky_action"
    args = {}

    # Attempt 1: Should Fail
    await mw.before_action(action_name, args)
    raw_result_1 = await flaky.flaky_action()  # Returns error
    final_result_1 = await mw.after_action(action_name, args, raw_result_1)

    assert "error" in final_result_1
    assert "reflection_guidance" in final_result_1
    assert "Retry attempt 1" in final_result_1["reflection_guidance"]

    # Attempt 2: Should Fail
    await mw.before_action(action_name, args)
    raw_result_2 = await flaky.flaky_action()  # Returns error
    final_result_2 = await mw.after_action(action_name, args, raw_result_2)

    assert "error" in final_result_2
    assert "Retry attempt 2" in final_result_2["reflection_guidance"]

    # Attempt 3: Should Succeed
    await mw.before_action(action_name, args)
    raw_result_3 = await flaky.flaky_action()  # Returns ok
    final_result_3 = await mw.after_action(action_name, args, raw_result_3)

    assert "status" in final_result_3 and final_result_3["status"] == "ok"
    assert "reflection_guidance" not in final_result_3

    # Verify counter reset
    assert action_name not in mw.failure_counters
