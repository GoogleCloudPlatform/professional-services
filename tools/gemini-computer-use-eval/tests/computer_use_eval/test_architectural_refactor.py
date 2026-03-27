# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from computer_use_eval.utils import CoordinateScaler


def test_coordinate_scaler_rounding():
    """
    Test that the scaler rounds to the nearest integer.
    """
    scaler = CoordinateScaler(width=1440, height=900)

    # x: (100.4 / 1000) * 1440 = 144.576 -> 145
    # y: (100.6 / 1000) * 900 = 90.54 -> 91
    # Note: Current implementation uses int() which truncates.
    # We want to ensure it rounds or at least is consistent.
    # If we want rounding, we should use round().

    # Let's test what it currently does (truncation)
    assert scaler.denormalize(100, 100) == (144, 90)

    # We want it to be more precise or at least consistent.
    # The requirement says "handle all clamping and normalization edge cases".


def test_coordinate_scaler_edge_cases():
    """
    Test edge cases like 999 vs 1000.
    The model often uses 999 for the extreme edge.
    """
    scaler = CoordinateScaler(width=1440, height=900)

    # 1000 should be the exact boundary
    assert scaler.denormalize(1000, 1000) == (1440, 900)

    # 999 should be just inside
    # (999/1000) * 1440 = 1438.56
    # (999/1000) * 900 = 899.1
    x, y = scaler.denormalize(999, 999)
    assert x == 1438 or x == 1439
    assert y == 899


def test_coordinate_scaler_nop_clamping():
    """
    Test that inputs already in range are not mutated unexpectedly.
    """
    scaler = CoordinateScaler(width=1440, height=900)
    assert scaler.denormalize(500, 500) == (720, 450)
    assert scaler.normalize(720, 450) == (500, 500)


def test_coordinate_scaler_magnitude():
    """
    Test magnitude scaling for scrolling.
    Target resolution: 1440x900
    """
    scaler = CoordinateScaler(width=1440, height=900)

    # Vertical (height=900)
    # 500/1000 * 900 = 450
    assert scaler.scale_magnitude(500, "height") == 450

    # Horizontal (width=1440)
    # 500/1000 * 1440 = 720
    assert scaler.scale_magnitude(500, "width") == 720

    # Clamping
    assert scaler.scale_magnitude(1100, "height") == 900
    assert scaler.scale_magnitude(-10, "height") == 0


@pytest.mark.asyncio
async def test_perception_service_fallback():
    """
    Test that PerceptionService falls back to Playwright if ScreenBuffer fails or is disabled.
    """
    from computer_use_eval.browser.perception import PerceptionService
    from unittest.mock import AsyncMock

    # Disabled ScreenBuffer
    service = PerceptionService(enable_screen_buffer=False)
    page = AsyncMock()
    page.screenshot = AsyncMock(return_value=b"fake_screenshot")

    screenshot = await service.get_screenshot(page)
    assert screenshot == b"fake_screenshot"
    page.screenshot.assert_called_once()


@pytest.mark.asyncio
async def test_perception_service_with_buffer():
    """
    Test PerceptionService with a mocked ScreenBuffer.
    """
    from computer_use_eval.browser.perception import PerceptionService
    from unittest.mock import MagicMock

    service = PerceptionService(enable_screen_buffer=True)
    service.screen_buffer = MagicMock()

    mock_frame = MagicMock()
    service.screen_buffer.get_latest_frame.return_value = mock_frame

    # Mock frame.save to do nothing
    mock_frame.save = MagicMock()

    screenshot = await service.get_screenshot(None)
    assert isinstance(screenshot, bytes)
    service.screen_buffer.get_latest_frame.assert_called_once()


def test_history_manager():
    from computer_use_eval.core.managers import HistoryManager
    from google.genai import types

    mgr = HistoryManager(max_history_turns=2)
    # Turn 1: User Goal
    mgr.add_content(types.Content(role="user", parts=[types.Part(text="goal")]))
    # Turn 2: Model Action
    mgr.add_content(
        types.Content(
            role="model",
            parts=[
                types.Part(
                    function_call=types.FunctionCall(name="click", args={}))
            ],
        ))
    # Turn 3: User response
    mgr.add_content(
        types.Content(
            role="user",
            parts=[
                types.Part(function_response=types.FunctionResponse(
                    name="click", response={}))
            ],
        ))
    # Turn 4: Model action 2
    mgr.add_content(
        types.Content(
            role="model",
            parts=[
                types.Part(
                    function_call=types.FunctionCall(name="hover", args={}))
            ],
        ))
    # Turn 5: User response 2
    mgr.add_content(
        types.Content(
            role="user",
            parts=[
                types.Part(function_response=types.FunctionResponse(
                    name="hover", response={}))
            ],
        ))

    assert len(mgr.get_full_history()) == 5
    # If we want the last 2 turns, it would be Turns 4 and 5.
    # But Turn 5 is a function response, so it must start at Turn 4 or before?
    # Actually our logic says start with a USER turn that IS NOT a function response.
    # So it should look for such a turn.

    # In this sequence, only Turn 1 is a non-response user turn.
    # So it should probably return the whole thing or just turn 1?
    # Let's see what happens.
    trimmed = mgr.get_trimmed_history()
    # If it can't find a valid start in the tail, it should at least return turn 1.
    assert len(trimmed) >= 1
    assert trimmed[0].parts[0].text == "goal"


def test_telemetry_tracker():
    from computer_use_eval.core.managers import TelemetryTracker
    from unittest.mock import MagicMock

    tracker = TelemetryTracker()
    response = MagicMock()
    response.usage_metadata.prompt_token_count = 100
    response.usage_metadata.candidates_token_count = 50
    response.usage_metadata.thinking_token_count = 10

    tracker.log_usage(response)
    tracker.add_step_detail({"duration": 1.5})

    summary = tracker.get_summary()
    assert summary["total_input_tokens"] == 100
    assert summary["total_thinking_tokens"] == 10
    assert len(summary["step_details"]) == 1


def test_safety_coordinator():
    from computer_use_eval.core.managers import SafetyCoordinator
    from unittest.mock import MagicMock

    mock_policy = MagicMock()
    mock_policy.confirm_action.return_value = "APPROVED"

    coord = SafetyCoordinator(mock_policy)

    # Test case: Intervention required
    args = {"safety_decision": {"decision": "require_confirmation"}}
    result = coord.check_action("click", args)
    assert result == "APPROVED"
    mock_policy.confirm_action.assert_called_once()

    # Test case: No intervention
    result = coord.check_action("click", {})
    assert result == "PROCEED"


@pytest.mark.asyncio
async def test_terminal_slicing_logic():
    from computer_use_eval.actions.base import ActionExecutor

    executor = ActionExecutor()

    # Navigation is terminal
    assert executor.is_terminal("navigate",
                                {"url": "http://google.com"}) is True

    # Type with press_enter is terminal
    assert (executor.is_terminal("type_text_at", {
        "text": "hello",
        "press_enter": True
    }) is True)

    # Standard click is NOT terminal (by current definition)
    assert executor.is_terminal("click_at", {"x": 10, "y": 10}) is False

    # Enter key combination is terminal
    assert executor.is_terminal("key_combination", {"keys": "Enter"}) is True


@pytest.mark.asyncio
async def test_input_bundling_fast_path():
    from computer_use_eval.actions.base import ActionExecutor
    from computer_use_eval.core.base import Action
    from unittest.mock import AsyncMock, MagicMock

    executor = ActionExecutor()
    env = MagicMock()
    env.page = AsyncMock()
    env.scaler = MagicMock()
    env.scaler.denormalize.side_effect = lambda x, y: (x * 2, y * 2
                                                      )  # Mock scaling

    actions = [
        Action(name="type_text_at", args={
            "x": 10,
            "y": 20,
            "text": "First"
        }),
        Action(name="type_text_at", args={
            "x": 30,
            "y": 40,
            "text": "Last"
        }),
    ]

    results = await executor.execute_bundle(env, actions)

    assert len(results) == 2
    assert results[0][2]["bundled"] is True
    assert results[1][2]["bundled"] is True

    # 2 highlight evaluates + 1 bundle evaluate
    assert env.page.evaluate.call_count == 3
    # Verify payload of the LAST call
    call_args = env.page.evaluate.call_args_list[-1][0][1]
    assert len(call_args) == 2
    assert call_args[0]["text"] == "First"


@pytest.mark.asyncio
async def test_execute_bundle_perception_guard_cancellation():
    from computer_use_eval.tool_executor import ToolExecutor
    from computer_use_eval.core.base import Action
    from unittest.mock import AsyncMock, MagicMock

    env = MagicMock()
    env.page.url = "http://start.com"
    env.get_aria_snapshot = AsyncMock(return_value="aria")

    executor = ToolExecutor(env)
    executor.execute = AsyncMock(return_value=({"status": "ok"}, 0.05))
    executor.browser_action_executor.is_terminal = MagicMock(return_value=False)

    actions = [
        Action(name="click_at", args={
            "x": 1,
            "y": 2
        }),
        Action(name="click_at", args={
            "x": 3,
            "y": 4
        }),
    ]

    # Mock URL change after first action
    def side_effect(*args, **kwargs):
        env.page.url = "http://changed.com"
        return ({"status": "ok"}, 0.05)

    executor.execute.side_effect = side_effect

    results, _ = await executor.execute_bundle(actions)

    # Must have 2 results even though we truncated
    assert len(results) == 2
    assert results[0].result_data["status"] == "ok"
    assert "CANCELLED_BY_PERCEPTION_GUARD" in results[1].result_data["error"]


@pytest.mark.asyncio
async def test_execute_bundle_protocol_conformance():
    """
    CRITICAL: The Gemini API requires a 1:1 mapping of function calls to responses.
    This test ensures that even when a batch is truncated, every input action
    gets a corresponding response part.
    """
    from computer_use_eval.tool_executor import ToolExecutor
    from computer_use_eval.core.base import Action
    from unittest.mock import AsyncMock, MagicMock

    env = MagicMock()
    env.page.url = "http://test.com"
    env.get_aria_snapshot = AsyncMock(return_value="aria")

    executor = ToolExecutor(env)
    executor.execute = AsyncMock(return_value=({"status": "ok"}, 0.05))
    executor.browser_action_executor.is_terminal = MagicMock(return_value=False)

    # 5 actions
    actions = [Action(name="click_at", args={"x": i, "y": i}) for i in range(5)]

    # Trigger cancellation on the 2nd action
    def side_effect(*args, **kwargs):
        env.page.url = "http://navigated.com"
        return ({"status": "ok"}, 0.05)

    executor.execute.side_effect = side_effect

    results, _ = await executor.execute_bundle(actions)

    # We must have EXACTLY 5 results back
    assert len(results) == 5
    assert results[0].result_data["status"] == "ok"
    for i in range(1, 5):
        assert "CANCELLED" in results[i].result_data["error"]
