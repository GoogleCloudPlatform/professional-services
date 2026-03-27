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
from google.genai import types
from computer_use_eval.core.context.base import ContextStrategy
from computer_use_eval.core.context.strategies import (
    CompactionStrategy,
    SummarizationStrategy,
)
from unittest.mock import MagicMock, AsyncMock
from typing import List


class SlicingTestStrategy(ContextStrategy):
    """Minimal strategy to expose the find_safe_tail_start method for testing."""

    async def apply(self, history: List[types.Content]) -> List[types.Content]:
        return history


def validate_history_integrity(history: List[types.Content]):
    """
    Validates that the history follows Gemini API rules for function calling:
    Every turn containing a function_response must be preceded by a turn from the model.
    """
    for i, turn in enumerate(history):
        has_response = any(p.function_response for p in (turn.parts or []))
        if has_response:
            if i == 0:
                raise ValueError(
                    f"Turn {i} has a function_response but is the first turn in history."
                )

            prev_turn = history[i - 1]
            if prev_turn.role != "model":
                raise ValueError(
                    f"Turn {i} (User Response) is preceded by a {prev_turn.role} turn. "
                    "Gemini API requires the preceding turn to be 'model'."
                )

            has_call = any(p.function_call for p in (prev_turn.parts or []))
            if not has_call:
                raise ValueError(
                    f"Turn {i} (User Response) is preceded by a model turn, but it contains no function_calls."
                )


def create_complex_history() -> List[types.Content]:
    """Creates a history with mixed prompts and parallel function calls."""
    return [
        types.Content(role="user", parts=[types.Part(text="Task start")]),  # 0
        types.Content(
            role="model",
            parts=[
                types.Part(text="Thinking"),
                types.Part(function_call=types.FunctionCall(name="tool1", args={})),
            ],
        ),  # 1
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(name="tool1", response={})
                )
            ],
        ),  # 2
        types.Content(
            role="model",
            parts=[
                types.Part(text="Reasoning"),  # 3 (PFC Start)
                types.Part(function_call=types.FunctionCall(name="tool2", args={})),
                types.Part(function_call=types.FunctionCall(name="tool3", args={})),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(name="tool2", response={})
                ),  # 4 (PFC End)
                types.Part(
                    function_response=types.FunctionResponse(name="tool3", response={})
                ),
            ],
        ),
        types.Content(role="model", parts=[types.Part(text="Middle thought")]),  # 5
        types.Content(role="user", parts=[types.Part(text="User nudge")]),  # 6
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="tool4", args={}))],
        ),  # 7
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(name="tool4", response={})
                )
            ],
        ),  # 8
    ]


@pytest.mark.parametrize("keep_tail", range(1, 10))
def test_exhaustive_slicing_integrity(keep_tail):
    """
    Stresses find_safe_tail_start by trying every possible 'keep_tail' value.
    Ensures the resulting history never breaks Gemini API rules.
    """
    strategy = SlicingTestStrategy()
    history = create_complex_history()
    protected_head = 1

    start_index = strategy.find_safe_tail_start(history, keep_tail, protected_head)

    # Resulting history is Head + Tail
    sliced_history = [history[0]] + history[start_index:]

    try:
        validate_history_integrity(sliced_history)
    except ValueError as e:
        pytest.fail(
            f"Integrity check failed for keep_tail={keep_tail}, start_index={start_index}: {e}"
        )


@pytest.mark.asyncio
async def test_compaction_strategy_integrity():
    """Verifies that CompactionStrategy produces a valid history sequence."""
    strategy = CompactionStrategy()

    # Create a history with a loop of 'wait' actions
    history = [
        types.Content(role="user", parts=[types.Part(text="Task start")]),
        # Loop Pair 1
        types.Content(
            role="model",
            parts=[
                types.Part(
                    function_call=types.FunctionCall(name="wait_5_seconds", args={})
                )
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(
                        name="wait_5_seconds", response={}
                    )
                )
            ],
        ),
        # Loop Pair 2
        types.Content(
            role="model",
            parts=[
                types.Part(
                    function_call=types.FunctionCall(name="wait_5_seconds", args={})
                )
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(
                        name="wait_5_seconds", response={}
                    )
                )
            ],
        ),
        # Terminal Turn
        types.Content(role="model", parts=[types.Part(text="Done")]),
    ]

    compacted = await strategy.apply(history)
    validate_history_integrity(compacted)


@pytest.mark.asyncio
async def test_summarization_strategy_integrity():
    """Verifies that SummarizationStrategy produces a valid history sequence."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Summary of events"
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    strategy = SummarizationStrategy(client=mock_client, token_threshold=1)

    # History long enough to trigger summarization
    history = [
        types.Content(role="user", parts=[types.Part(text="Goal")]),  # Head
        types.Content(role="model", parts=[types.Part(text="Action 1")]),  # Middle
        types.Content(role="user", parts=[types.Part(text="Response 1")]),  # Middle
        types.Content(role="model", parts=[types.Part(text="Final Action")]),  # Tail
    ]

    summarized = await strategy.apply(history)
    validate_history_integrity(summarized)
