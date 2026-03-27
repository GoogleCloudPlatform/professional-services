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
from computer_use_eval.core.context.strategies import SmartTrimStrategy


@pytest.mark.asyncio
async def test_trim_history():
    """
    Verify that SmartTrimStrategy correctly keeps the first turn (goal)
    and trims the middle while maintaining structure.
    """
    # Mock history with 10 turns (5 user/model pairs)
    history = []
    for i in range(10):
        role = "user" if i % 2 == 0 else "model"
        parts = [types.Part(text=f"Turn {i}")]
        if role == "model":
            parts = [
                types.Part(
                    function_call=types.FunctionCall(name="test", args={}))
            ]
        elif i > 0:  # User turn that is a function response
            parts = [
                types.Part(function_response=types.FunctionResponse(
                    name="test", response={}))
            ]

        history.append(types.Content(role=role, parts=parts))

    # max_turns = 4, keep_tail = 4, protected_head = 3
    # Head: [0, 1, 2] (len 3)
    # find_safe_tail_start: len(10) - 4 = index 6.
    # Turn 6 is Model turn, so safe. Tail: [6, 7, 8, 9] (len 4)
    # BUT: If Turn 6 was a response, it would move back to 5.
    # Total: 3 + 4 = 7.
    # Wait, the failure said 8. Let's re-read find_safe_tail_start.
    strategy = SmartTrimStrategy(max_turns=4, keep_tail=4, protected_head=3)

    new_history = await strategy.apply(history)

    # Turns kept: 0, 1, 2 (Head) + 6, 7, 8, 9 (Tail) = 7 turns.
    # If the previous run had 8, it's because find_safe_tail_start moved back to 5.
    # Turn 6 in loop: i=6 is User? i=0:U, 1:M, 2:U, 3:M, 4:U, 5:M, 6:U (Response!)
    # YES! Turn 6 is a User Response. Move back to 5.
    # Tail is now history[5:] = [5, 6, 7, 8, 9] (len 5)
    # Total: 3 + 5 = 8.
    assert len(new_history) == 8
    assert new_history[0].parts[0].text == "Turn 0"
    assert new_history[1].parts[0].function_call is not None  # Turn 5
    assert new_history[-1].parts[0].function_call is not None  # Turn 9


@pytest.mark.asyncio
async def test_trim_history_no_break_pairs():
    """
    Verify that trimming doesn't break between a function call and its response.
    """
    history = []
    # Turn 0: User
    history.append(types.Content(role="user", parts=[types.Part(text="Goal")]))
    # Turn 1: Model (Call)
    history.append(
        types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="c1", args={}))
            ],
        ))
    # Turn 2: User (Response)
    history.append(
        types.Content(
            role="user",
            parts=[
                types.Part(function_response=types.FunctionResponse(
                    name="c1", response={}))
            ],
        ))
    # Turn 3: Model (Call)
    history.append(
        types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="c2", args={}))
            ],
        ))
    # Turn 4: User (Response)
    history.append(
        types.Content(
            role="user",
            parts=[
                types.Part(function_response=types.FunctionResponse(
                    name="c2", response={}))
            ],
        ))

    strategy = SmartTrimStrategy(max_turns=2, keep_tail=2, protected_head=3)
    new_history = await strategy.apply(history)

    assert len(new_history) == 5  # [0, 1, 2] + [3, 4]
    assert new_history[1].parts[0].function_call.name == "c1"
    assert new_history[3].parts[0].function_call.name == "c2"

    strategy = SmartTrimStrategy(max_turns=1, keep_tail=1, protected_head=1)
    new_history = await strategy.apply(history)
    assert len(new_history) == 3  # Should keep [0] + [3, 4]
    assert new_history[1].parts[0].function_call.name == "c2"
