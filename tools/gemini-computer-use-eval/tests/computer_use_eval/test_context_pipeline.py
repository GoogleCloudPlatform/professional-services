# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock
from google.genai import types
from computer_use_eval.core.context.base import ContextPipeline
from computer_use_eval.core.context.strategies import (
    SmartTrimStrategy,
    ImageContextStrategy,
    CompactionStrategy,
    SummarizationStrategy,
)


@pytest.mark.asyncio
async def test_image_context_strategy_accurate():
    strategy = ImageContextStrategy(max_images=-1)
    history = [
        types.Content(
            role="user",
            parts=[
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img0"))
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img1"))
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img2"))
            ],
        ),
    ]
    new_history = await strategy.apply(history)
    assert len(new_history) == 3
    assert all(p.inline_data for c in new_history for p in c.parts)


@pytest.mark.asyncio
async def test_image_context_strategy_balanced():
    # Keep Initial (0) + Last 3.
    strategy = ImageContextStrategy(max_images=3)
    history = [
        # Turn 0 (Keep)
        types.Content(
            role="user",
            parts=[
                types.Part(text="0"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img0")),
            ],
        ),
        # Turn 1 (Scrub)
        types.Content(
            role="user",
            parts=[
                types.Part(text="1"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img1")),
            ],
        ),
        # Turn 2 (Keep)
        types.Content(
            role="user",
            parts=[
                types.Part(text="2"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img2")),
            ],
        ),
        # Turn 3 (Keep)
        types.Content(
            role="user",
            parts=[
                types.Part(text="3"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img3")),
            ],
        ),
        # Turn 4 (Keep)
        types.Content(
            role="user",
            parts=[
                types.Part(text="4"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img4")),
            ],
        ),
        # Turn 5 (Keep)
        types.Content(
            role="user",
            parts=[
                types.Part(text="5"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img5")),
            ],
        ),
    ]
    # Indices to keep: 0, 5 (last), 4, 3, 2 (last 3 intermediate user turns)
    # 1 should be scrubbed.
    new_history = await strategy.apply(history)
    assert len(new_history) == 6
    assert any(p.inline_data for p in new_history[0].parts)
    assert not any(p.inline_data for p in new_history[1].parts)
    assert any(p.inline_data for p in new_history[2].parts)
    assert any(p.inline_data for p in new_history[3].parts)
    assert any(p.inline_data for p in new_history[4].parts)
    assert any(p.inline_data for p in new_history[5].parts)


@pytest.mark.asyncio
async def test_image_context_strategy_efficient():
    # Keep Initial (0) + Last 1 intermediate.
    strategy = ImageContextStrategy(max_images=1)
    history = [
        types.Content(
            role="user",
            parts=[
                types.Part(text="0"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img0")),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(text="1"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img1")),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(text="2"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img2")),
            ],
        ),
    ]
    # Indices kept: 0 (Head), 2 (Last).
    # Intermediate (1) is kept because max_images=1 and it's the last intermediate user turn.
    new_history = await strategy.apply(history)
    assert len(new_history) == 3
    assert any(p.inline_data for p in new_history[0].parts)
    assert any(p.inline_data for p in new_history[1].parts)
    assert any(p.inline_data for p in new_history[2].parts)


@pytest.mark.asyncio
async def test_summarization_strategy():
    from unittest.mock import AsyncMock

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "The user did some things."
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    # Use low token_threshold to trigger summarization in the test
    strategy = SummarizationStrategy(client=mock_client, token_threshold=1, keep_tail=1)

    history = [
        types.Content(role="user", parts=[types.Part(text="Goal")]),
        types.Content(role="model", parts=[types.Part(text="Middle Action")]),
        types.Content(role="user", parts=[types.Part(text="Middle Response")]),
        types.Content(role="model", parts=[types.Part(text="Final Action")]),
    ]

    # max_turns=2, len(history)=4. Summarization will happen.
    # Head: history[0] (user)
    # Summary: (model) + user_ack (user)
    # Tail: history[3:] = [Final Action] (model)
    # Middle: [Middle Action, Middle Response]

    new_history = await strategy.apply(history)

    assert len(new_history) == 4
    assert "Goal" in new_history[0].parts[0].text
    assert (
        "[History Summary: The user did some things.]" in new_history[1].parts[0].text
    )
    assert "Acknowledged" in new_history[2].parts[0].text
    assert "Final Action" in new_history[3].parts[0].text

    # Verify call to client
    mock_client.aio.models.generate_content.assert_called_once()
    call_args = mock_client.aio.models.generate_content.call_args
    prompt = call_args.kwargs["contents"][0].parts[0].text
    assert "Middle Action" in prompt
    assert "Middle Response" in prompt


@pytest.mark.asyncio
async def test_smart_trim_strategy():
    strategy = SmartTrimStrategy(max_turns=5, keep_tail=2)
    history = [
        types.Content(role="user", parts=[types.Part(text="Turn 0")]),
        types.Content(role="model", parts=[types.Part(text="Turn 1")]),
        types.Content(role="user", parts=[types.Part(text="Turn 2")]),
        types.Content(role="model", parts=[types.Part(text="Turn 3")]),
        types.Content(role="user", parts=[types.Part(text="Turn 4")]),
        types.Content(role="model", parts=[types.Part(text="Turn 5")]),
    ]

    # Should keep Turn 0 (Head). Tail is Turn 4 and Turn 5.
    # Turn 0 is 'user', Turn 4 is 'user'. This is a role clash.
    # The strategy will inject a dummy 'model' turn to bridge them.
    # Expected length: 1 (head) + 1 (bridge) + 2 (tail) = 4
    new_history = await strategy.apply(history)
    assert len(new_history) == 4
    assert "Turn 0" in new_history[0].parts[0].text
    assert "[History Trimmed]" in new_history[1].parts[0].text
    assert new_history[1].role == "model"
    assert "Turn 4" in new_history[2].parts[0].text
    assert "Turn 5" in new_history[3].parts[0].text


@pytest.mark.asyncio
async def test_smart_trim_respects_function_response():
    strategy = SmartTrimStrategy(max_turns=4, keep_tail=2)
    history = [
        types.Content(role="user", parts=[types.Part(text="Turn 0")]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="cmd", args={}))],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(name="cmd", response={})
                )
            ],
        ),
        types.Content(role="model", parts=[types.Part(text="Turn 3")]),
        types.Content(role="user", parts=[types.Part(text="Turn 4")]),
    ]

    new_history = await strategy.apply(history)
    assert len(new_history) == 3
    assert "Turn 0" in new_history[0].parts[0].text
    assert "Turn 3" in new_history[1].parts[0].text
    assert "Turn 4" in new_history[2].parts[0].text


@pytest.mark.asyncio
async def test_smart_trim_avoids_orphaned_function_response():
    strategy = SmartTrimStrategy(max_turns=3, keep_tail=1)
    history = [
        types.Content(role="user", parts=[types.Part(text="Turn 0")]),
        types.Content(role="model", parts=[types.Part(text="Turn 1")]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="cmd", args={}))],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(name="cmd", response={})
                )
            ],
        ),
    ]

    new_history = await strategy.apply(history)
    assert len(new_history) == 3
    assert "Turn 0" in new_history[0].parts[0].text
    assert new_history[1].parts[0].function_call is not None
    assert new_history[2].parts[0].function_response is not None


@pytest.mark.asyncio
async def test_image_context_strategy_scrubbing():
    strategy = ImageContextStrategy(max_images=0)
    history = [
        # Turn 0 (Goal) - Keep image
        types.Content(
            role="user",
            parts=[
                types.Part(text="Goal"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img0")),
            ],
        ),
        # Turn 1 (Intermediate) - Remove image
        types.Content(
            role="user",
            parts=[
                types.Part(
                    function_response=types.FunctionResponse(
                        name="cmd",
                        response={},
                        parts=[
                            types.Part(
                                inline_data=types.Blob(
                                    mime_type="image/png", data=b"img1"
                                )
                            )
                        ],
                    )
                )
            ],
        ),
        # Turn 2 (Last) - Keep image
        types.Content(
            role="user",
            parts=[
                types.Part(text="Current"),
                types.Part(inline_data=types.Blob(mime_type="image/png", data=b"img2")),
            ],
        ),
    ]

    new_history = await strategy.apply(history)
    assert len(new_history) == 3

    assert any(p.inline_data for p in new_history[0].parts)
    fr = new_history[1].parts[0].function_response
    assert len(fr.parts) == 0
    assert any(p.inline_data for p in new_history[2].parts)
    assert any(frp.inline_data for frp in history[1].parts[0].function_response.parts)


@pytest.mark.asyncio
async def test_loop_compression_strategy():
    strategy = CompactionStrategy()
    history = [
        types.Content(role="user", parts=[types.Part(text="Goal")]),
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
        types.Content(role="model", parts=[types.Part(text="Final")]),
    ]

    new_history = await strategy.apply(history)
    assert len(new_history) == 4
    assert "[Summarized:" in new_history[1].parts[0].text
    assert "wait_5_seconds' 2 times" in new_history[1].parts[0].text
    assert "Acknowledged" in new_history[2].parts[0].text


@pytest.mark.asyncio
async def test_pipeline_composition():
    pipeline = ContextPipeline(
        [
            CompactionStrategy(),
            ImageContextStrategy(max_images=0),
            SmartTrimStrategy(max_turns=3, keep_tail=1),
        ]
    )

    history = [
        types.Content(role="user", parts=[types.Part(text="Goal")]),
        # Repetitive actions for LoopCompression
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
        types.Content(role="model", parts=[types.Part(text="Current")]),
    ]

    context = await pipeline.process(history)
    assert len(context) == 2
    assert "Goal" in context[0].parts[0].text
    assert "Current" in context[1].parts[0].text

    assert len(history) == 6
