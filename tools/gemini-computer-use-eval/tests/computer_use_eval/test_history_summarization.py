# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from google.genai import types
from computer_use_eval.core.context.strategies import CompactionStrategy


@pytest.mark.asyncio
async def test_summarize_history():
    """
    Verify that repetitive actions are condensed into a summary.
    """
    strategy = CompactionStrategy()
    history = []

    # Turn 0: Goal
    history.append(types.Content(role="user", parts=[types.Part(text="Goal")]))

    # 3 repetitions of "wait_5_seconds"
    for i in range(3):
        history.append(
            types.Content(
                role="model",
                parts=[
                    types.Part(function_call=types.FunctionCall(
                        name="wait_5_seconds", args={}))
                ],
            ))
        history.append(
            types.Content(
                role="user",
                parts=[
                    types.Part(function_response=types.FunctionResponse(
                        name="wait_5_seconds", response={"status": "ok"}))
                ],
            ))

    # Final Turn: Something else (don't summarize last turn)
    history.append(
        types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="click_at",
                                                            args={
                                                                "x": 100,
                                                                "y": 100
                                                            }))
            ],
        ))
    history.append(
        types.Content(
            role="user",
            parts=[
                types.Part(function_response=types.FunctionResponse(
                    name="click_at", response={"status": "ok"}))
            ],
        ))

    new_history = await strategy.apply(history)

    # Initial history: 1 (Goal) + 2*3 (Wait) + 2 (Click) = 9 turns
    # Summarized: 1 (Goal) + 1 (Summary) + 1 (Ack) + 2 (Click) = 5 turns
    assert len(new_history) == 5
    assert "[Summarized:" in new_history[1].parts[0].text
    assert "wait_5_seconds' 3 times" in new_history[1].parts[0].text
    assert "Acknowledged." in new_history[2].parts[0].text
    assert new_history[3].parts[0].function_call.name == "click_at"
