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
from google.genai import types
from computer_use_eval.browser.perception import PerceptionService
from computer_use_eval.config import ImageQuality
from computer_use_eval.core.context.strategies import SummarizationStrategy
from computer_use_eval.prompts import DEFAULT_SYSTEM_PROMPT


def test_system_prompt_empirical_conclusions():
    """Verifies that the system prompt contains the new ANTI-HALLUCINATION rule."""
    assert "6.  **EMPIRICAL CONCLUSIONS:**" in DEFAULT_SYSTEM_PROMPT
    assert "Verification Required" in DEFAULT_SYSTEM_PROMPT
    assert "Outcome Observation" in DEFAULT_SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_image_quality_low_res():
    """Verifies that PerceptionService downscales screenshots in LOW quality mode."""
    # Create a small valid PNG (100x100 white square)
    from PIL import Image
    import io

    img = Image.new("RGB", (100, 100), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    original_bytes = buf.getvalue()

    # PerceptionService with HIGH quality
    service_high = PerceptionService(image_quality=ImageQuality.HIGH)
    # Mock page for screenshot
    mock_page = AsyncMock()
    mock_page.screenshot = AsyncMock(return_value=original_bytes)

    screenshot_high = await service_high.get_screenshot(mock_page)
    assert screenshot_high == original_bytes

    # PerceptionService with LOW quality
    service_low = PerceptionService(image_quality=ImageQuality.LOW)
    screenshot_low = await service_low.get_screenshot(mock_page)

    # Check that it's smaller than original
    assert len(screenshot_low) != len(original_bytes)

    # Check dimensions
    img_low = Image.open(io.BytesIO(screenshot_low))
    # Default screen width is 1440. 50% = 720.
    assert img_low.width == 720
    assert img_low.height == 450


@pytest.mark.asyncio
async def test_summarization_with_real_metadata():
    """Verifies that SummarizationStrategy uses real token counts from telemetry."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Summary text"
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    # Threshold = 1000
    strategy = SummarizationStrategy(client=mock_client, token_threshold=1000)

    # Case 1: Heuristic says ~100 tokens, but Metadata says 2000. SHOULD TRIGGER.
    history = [
        types.Content(role="user", parts=[types.Part(text="Goal")]),  # 0
        types.Content(role="model", parts=[types.Part(text="Action")]),  # 1
        types.Content(role="user", parts=[types.Part(text="Response")]),  # 2
    ]
    metadata = {"last_input_tokens": 2000}

    # protected_head=1, keep_tail=1
    strategy.protected_head = 1
    strategy.keep_tail = 1

    # find_safe_tail_start: 3-1 = 2. history[2] is response, moves back to 0.
    # target_start_index = 0.
    # Wait, middle = history[1:0] = []. Strategy returns history as-is.
    # Let's add more turns to force a middle.
    history = [
        types.Content(role="user", parts=[types.Part(text="Goal")]),  # 0
        types.Content(role="user", parts=[types.Part(text="Middle")]),  # 1 (Root)
        types.Content(role="model", parts=[types.Part(text="Action")]),  # 2
        types.Content(role="user", parts=[types.Part(text="Final")]),  # 3 (Root)
    ]
    # keep_tail=1. ideal=3. history[3] is root. target=3.
    # middle = history[1:3] = [1, 2].

    summarized = await strategy.apply_with_metadata(history, metadata)

    assert (
        len(summarized) == 3
    )  # Head(1) + Summary(1) + Tail(1) (Ack omitted to maintain alternating roles)
    assert "[History Summary:" in summarized[1].parts[0].text
    assert "Final" in summarized[2].parts[0].text
    mock_client.aio.models.generate_content.assert_called_once()

    # Case 2: Heuristic says 2000 tokens, but Metadata says 500. SHOULD NOT TRIGGER.
    mock_client.aio.models.generate_content.reset_mock()
    history_long = [
        types.Content(role="user", parts=[types.Part(text="A" * 8000)]),
        types.Content(role="user", parts=[types.Part(text="A" * 8000)]),
    ]
    metadata_low = {"last_input_tokens": 500}

    not_summarized = await strategy.apply_with_metadata(history_long, metadata_low)
    assert not_summarized == history_long
    mock_client.aio.models.generate_content.assert_not_called()
