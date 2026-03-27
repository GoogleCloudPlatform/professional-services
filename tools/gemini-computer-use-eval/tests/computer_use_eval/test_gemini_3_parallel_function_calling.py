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
from unittest.mock import AsyncMock, MagicMock, patch
from google.genai import types

from computer_use_eval.core.gemini_agent import GeminiAgent
from computer_use_eval.core.context.strategies import ImageContextStrategy


@pytest.mark.asyncio
async def test_parallel_function_responses_single_image_attachment():
    """
    Verifies that when multiple actions are executed in a single batch (parallel function calling),
    the agent only attaches the heavy post-action screenshot to the FINAL FunctionResponse in the batch
    to prevent Gemini API 400 errors caused by massive duplicate multimodal payloads.
    """
    agent = GeminiAgent(client=MagicMock(), model_name="gemini-3-flash-preview")

    mock_env = MagicMock()
    mock_env.get_screenshot = AsyncMock(return_value=b"fake_image_bytes")
    mock_env.get_page_url = AsyncMock(return_value="http://test.com")
    mock_env.get_active_element_info = AsyncMock(return_value={})

    from computer_use_eval.core.base import ActionExecutionResult

    agent._execute_batch = AsyncMock(return_value=(
        [
            ActionExecutionResult(
                action_id="id_1",
                action_name="type_text_at",
                result_data={"status": "ok"},
                safety_acknowledged=False,
            ),
            ActionExecutionResult(
                action_id="id_2",
                action_name="type_text_at",
                result_data={"status": "ok"},
                safety_acknowledged=False,
            ),
            ActionExecutionResult(
                action_id="id_3",
                action_name="click_at",
                result_data={"status": "ok"},
                safety_acknowledged=False,
            ),
        ],
        [],  # action_durations
        0.05,  # total_mw_time
    ))

    # Mock the prediction to return an empty response so it finishes immediately after one turn
    mock_predict_response = MagicMock()
    mock_predict_response.candidates = [
        MagicMock(content=types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(
                    name="type_text_at", id="id_1", args={})),
                types.Part(function_call=types.FunctionCall(
                    name="type_text_at", id="id_2", args={})),
                types.Part(function_call=types.FunctionCall(
                    name="click_at", id="id_3", args={})),
            ],
        ))
    ]

    # We return the parallel call on the first call, and an empty response on the second to terminate
    agent._predict = AsyncMock(side_effect=[
        mock_predict_response,
        MagicMock(candidates=[
            MagicMock(content=types.Content(role="model",
                                            parts=[types.Part(text="Done")]))
        ]),
    ])

    # We MUST actually store history for the linearization test to work
    real_history = []
    agent.history_manager.add_content = MagicMock(
        side_effect=real_history.append)
    agent.history_manager.get_full_history = MagicMock(
        side_effect=lambda: list(real_history))

    def mock_pop():
        if real_history:
            return real_history.pop()
        return None

    agent.history_manager.pop = MagicMock(side_effect=mock_pop)

    # Run the task with a strict step limit
    with patch("computer_use_eval.core.gemini_agent.ToolExecutor",
               new_callable=MagicMock):
        with patch.object(agent, "max_steps", 2):
            await agent.run_task("test goal", env=mock_env)

    # Inspect the history
    history = real_history  # We should have a sequence of M -> U -> M -> U -> M -> U for the 3 unrolled parallel calls
    user_turns = [
        t for t in history
        if t.role == "user" and any(p.function_response for p in t.parts)
    ]

    assert len(user_turns) == 3, (
        "Agent did not unroll the parallel calls into 3 sequential user turns.")

    # Verify the first two responses DO NOT have image parts attached
    assert user_turns[0].parts[0].function_response.id == "id_1"
    assert (user_turns[0].parts[0].function_response.parts is None or
            len(user_turns[0].parts[0].function_response.parts) == 0)

    assert user_turns[1].parts[0].function_response.id == "id_2"
    assert (user_turns[1].parts[0].function_response.parts is None or
            len(user_turns[1].parts[0].function_response.parts) == 0)

    # Verify the LAST response DOES have the image attached
    assert user_turns[2].parts[0].function_response.id == "id_3"
    assert len(user_turns[2].parts[0].function_response.parts) == 1
    assert (user_turns[2].parts[0].function_response.parts[0].inline_data.
            mime_type == "image/png")


@pytest.mark.asyncio
async def test_image_context_strategy_preserves_function_response_ids():
    """
    Verifies that the ImageContextStrategy preserves the `id` field of a FunctionResponse
    when it rebuilds the object to downgrade the image resolution.
    Losing the ID causes a 400 API error on the next model turn.
    """
    from computer_use_eval.config import ImageRetentionStrategy

    strategy = ImageContextStrategy(
        max_images=1,
        retention_strategy=ImageRetentionStrategy.VARIABLE_FIDELITY)
    strategy._degrade_image = MagicMock(return_value=b"downgraded_bytes")

    fr_part1 = types.FunctionResponsePart(
        inline_data=types.FunctionResponseBlob(mime_type="image/png",
                                               data=b"original_bytes_old"))
    old_fr = types.FunctionResponse(name="click_at",
                                    id="vital_id_123",
                                    response={"status": "ok"},
                                    parts=[fr_part1])

    fr_part2 = types.FunctionResponsePart(
        inline_data=types.FunctionResponseBlob(mime_type="image/png",
                                               data=b"original_bytes_new"))
    new_fr = types.FunctionResponse(name="click_at",
                                    id="vital_id_456",
                                    response={"status": "ok"},
                                    parts=[fr_part2])

    history = [
        types.Content(role="user", parts=[types.Part(text="start")]),
        types.Content(role="user",
                      parts=[types.Part(function_response=old_fr)]),
        types.Content(role="model", parts=[types.Part(text="thinking")]),
        types.Content(role="user",
                      parts=[types.Part(function_response=new_fr)]),
        types.Content(role="model", parts=[types.Part(text="thinking2")]),
        types.Content(role="user", parts=[types.Part(text="end")]),
    ]

    new_history = await strategy.apply(history)

    degraded_fr = new_history[1].parts[0].function_response
    assert degraded_fr.id == "vital_id_123", (
        "ImageContextStrategy dropped the function_response ID during degradation!"
    )
    assert degraded_fr.parts[0].inline_data.data == b"downgraded_bytes", (
        "Image was not properly degraded.")


def test_missing_id_in_function_call_fabricates_id():
    """
    Verifies that if the model returns a FunctionCall WITHOUT an id (e.g. sequentially),
    the agent fabricates a deterministic ID to ensure the FunctionResponse
    that follows will match perfectly without an ambiguity mismatch error.
    """
    agent = GeminiAgent(client=MagicMock(), model_name="gemini-3-flash-preview")

    mock_predict_response = MagicMock()
    mock_predict_response.candidates = [
        MagicMock(content=types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="type_text_at",
                                                            args={}))
            ],
        ))
    ]

    actions = agent._extract_actions(mock_predict_response)

    assert len(actions) == 1
    assert actions[0].name == "type_text_at"
    assert actions[0].id is not None, (
        "Agent failed to fabricate an ID for an ambiguous sequential call.")
