# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import AsyncMock, MagicMock
from computer_use_eval.actions import (
    KeyCombinationAction,
    HoverAction,
    ScrollAction,
    DragAndDropAction,
)
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.utils import CoordinateScaler


@pytest.mark.asyncio
async def test_key_combination_action():
    mock_env = MagicMock(spec=PlaywrightEnv)
    mock_env.page = MagicMock()
    mock_env.page.keyboard = MagicMock()
    mock_env.page.keyboard.press = AsyncMock()

    action = KeyCombinationAction()

    # Test Control+A
    await action.execute(mock_env, {"keys": "control+a"})
    mock_env.page.keyboard.press.assert_called_with("Control+A")

    # Test Enter
    await action.execute(mock_env, {"keys": "enter"})
    mock_env.page.keyboard.press.assert_called_with("Enter")

    # Test Shift+Tab
    await action.execute(mock_env, {"keys": "shift+tab"})
    mock_env.page.keyboard.press.assert_called_with("Shift+Tab")


@pytest.mark.asyncio
async def test_hover_action():
    mock_env = MagicMock(spec=PlaywrightEnv)
    mock_env.page = MagicMock()
    mock_env.page.mouse = MagicMock()
    mock_env.page.mouse.move = AsyncMock()
    mock_env.viewport_size = {"width": 1000, "height": 1000}
    mock_env.scaler = CoordinateScaler(1000, 1000)

    action = HoverAction()
    await action.execute(mock_env, {"x": 500, "y": 500})

    # Coordinates should be denormalized
    mock_env.page.mouse.move.assert_called_with(500, 500)


@pytest.mark.asyncio
async def test_scroll_document_action():
    mock_env = MagicMock(spec=PlaywrightEnv)
    mock_env.page = MagicMock()
    mock_env.page.mouse = MagicMock()
    mock_env.page.mouse.wheel = AsyncMock()
    mock_env.viewport_size = {"width": 1000, "height": 1000}
    mock_env.scaler = CoordinateScaler(1000, 1000)

    action = ScrollAction()

    # Test scroll down
    await action.execute(mock_env, {"direction": "down", "magnitude": 500})
    mock_env.page.mouse.wheel.assert_called_with(0, 500)

    # Test scroll right
    await action.execute(mock_env, {"direction": "right", "magnitude": 200})
    mock_env.page.mouse.wheel.assert_called_with(200, 0)


@pytest.mark.asyncio
async def test_drag_and_drop_action():
    mock_env = MagicMock(spec=PlaywrightEnv)
    mock_env.page = MagicMock()
    mock_env.page.mouse = MagicMock()
    mock_env.page.mouse.move = AsyncMock()
    mock_env.page.mouse.down = AsyncMock()
    mock_env.page.mouse.up = AsyncMock()
    mock_env.viewport_size = {"width": 1000, "height": 1000}
    mock_env.scaler = CoordinateScaler(1000, 1000)

    action = DragAndDropAction()
    await action.execute(
        mock_env, {"x": 100, "y": 100, "destination_x": 500, "destination_y": 500}
    )

    assert mock_env.page.mouse.move.call_count == 2
    mock_env.page.mouse.down.assert_called_once()
    mock_env.page.mouse.up.assert_called_once()
