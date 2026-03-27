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
import io
from PIL import Image
from google.genai import types
from computer_use_eval.core.context.strategies import ImageContextStrategy
from computer_use_eval.config import ImageRetentionStrategy


def create_mock_history(num_turns: int, image_data: bytes = b"fake_png"):
    history = []
    for i in range(num_turns):
        role = "user" if i % 2 == 0 else "model"
        parts = [types.Part(text=f"Turn {i}")]
        if role == "user":
            # Real image data if provided, otherwise fake
            parts.append(
                types.Part(
                    inline_data=types.Blob(mime_type="image/png", data=image_data)
                )
            )
        history.append(types.Content(role=role, parts=parts))
    return history


@pytest.mark.asyncio
async def test_image_strategy_aggressive():
    # 10 turns: U0, M1, U2, M3, U4, M5, U6, M7, U8, M9
    # User turns with images: 0, 2, 4, 6, 8
    history = create_mock_history(10)

    # AGGRESSIVE with max_images=2 (plus turn 0 and last turn)
    # eligible user turns: [8, 6, 4, 2] (reversed)
    # keep last 2: 8, 6
    # always keep: 0, 9 (model)
    strategy = ImageContextStrategy(
        max_images=2, retention_strategy=ImageRetentionStrategy.AGGRESSIVE
    )
    result = await strategy.apply(history)

    turns_with_images = []
    for i, content in enumerate(result):
        has_img = any(
            p.inline_data and p.inline_data.mime_type == "image/png"
            for p in content.parts
        )
        if has_img:
            turns_with_images.append(i)

    assert set(turns_with_images) == {0, 6, 8}


@pytest.mark.asyncio
async def test_image_strategy_variable_fidelity():
    # 16 turns: U0...U14, M15. User turns: 0, 2, 4, 6, 8, 10, 12, 14
    # Real image for PIL
    img = Image.new("RGB", (100, 100), color="red")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    history = create_mock_history(16, image_data=png_bytes)

    # VARIABLE_FIDELITY: Last 5 full res, older degraded
    # eligible: 14, 12, 10, 8, 6, 4, 2
    # keep full: 14, 12, 10, 8, 6
    # degraded: 4, 2
    # always keep: 0, 15
    strategy = ImageContextStrategy(
        max_images=5, retention_strategy=ImageRetentionStrategy.VARIABLE_FIDELITY
    )

    # Mock _degrade_image to consistently return a 50x50 image
    def mock_degrade(image_bytes):
        img = Image.new("RGB", (50, 50), color="red")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    strategy._degrade_image = mock_degrade

    result = await strategy.apply(history)

    full_res_turns = []
    degraded_turns = []

    for i, content in enumerate(result):
        for p in content.parts:
            if p.inline_data and p.inline_data.mime_type == "image/png":
                # Check dimensions to distinguish full vs degraded
                img_res = Image.open(io.BytesIO(p.inline_data.data))
                if img_res.width == 100:
                    full_res_turns.append(i)
                elif img_res.width == 50:
                    degraded_turns.append(i)

    assert set(full_res_turns) == {0, 14, 12, 10, 8, 6}
    assert set(degraded_turns) == {4, 2}


@pytest.mark.asyncio
async def test_image_strategy_full_fidelity():
    history = create_mock_history(10)
    # FULL_FIDELITY with max_images=20
    strategy = ImageContextStrategy(
        max_images=20, retention_strategy=ImageRetentionStrategy.FULL_FIDELITY
    )
    result = await strategy.apply(history)

    # Should keep ALL images as total user turns (5) < max_images (20)
    turns_with_images = []
    for i, content in enumerate(result):
        has_img = any(
            p.inline_data and p.inline_data.mime_type == "image/png"
            for p in content.parts
        )
        if has_img:
            turns_with_images.append(i)

    assert len(turns_with_images) == 5
