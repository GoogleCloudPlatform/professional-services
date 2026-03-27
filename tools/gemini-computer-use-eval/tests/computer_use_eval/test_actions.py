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
from computer_use_eval.actions import (
    ActionExecutor,
    ClickAction,
    TypeAction,
    NavigateAction,
    ScrollAction,
    WaitAction,
    ScrollAtAction,
    HoverAction,
    KeyCombinationAction,
    DragAndDropAction,
    GoBackAction,
    GoForwardAction,
)
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.utils import CoordinateScaler


@pytest.fixture
def mock_env():
    env = MagicMock(spec=PlaywrightEnv)
    env.viewport_size = {
        "width": 1000,
        "height": 1000,
    }  # Convenient for testing denormalization
    env.scaler = CoordinateScaler(1000, 1000)
    env.page = MagicMock()
    env.page.mouse = MagicMock()
    env.page.mouse.move = AsyncMock()
    env.page.mouse.click = AsyncMock()
    env.page.mouse.down = AsyncMock()
    env.page.mouse.up = AsyncMock()
    env.page.mouse.wheel = AsyncMock()
    env.page.keyboard = MagicMock()
    env.page.keyboard.press = AsyncMock()
    env.page.keyboard.type = AsyncMock()
    env.page.evaluate = AsyncMock()
    env.page.wait_for_timeout = AsyncMock()
    env.page.goto = AsyncMock()
    env.page.go_back = AsyncMock()
    env.page.go_forward = AsyncMock()
    return env


@pytest.fixture
def executor():
    return ActionExecutor()


class TestActionExecutor:

    @pytest.mark.asyncio
    async def test_execute_known_action(self, executor, mock_env):
        """Should execute a registered action."""
        result = await executor.execute(mock_env, "open_web_browser", {})
        assert result == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_execute_unknown_action(self, executor, mock_env):
        """Should return error dict for unknown action."""
        result = await executor.execute(mock_env, "invalid_action", {})
        assert "error" in result
        assert "Unknown action" in result["error"]


class TestActions:

    @pytest.mark.asyncio
    async def test_click_action(self, mock_env):
        """ClickAction should denormalize coordinates and delegate."""
        action = ClickAction()
        # Normalized 500, 500 on 1000x1000 viewport -> 500, 500
        args = {"x": 500, "y": 500}

        result = await action.execute(mock_env, args)

        mock_env.page.mouse.click.assert_awaited_once_with(500, 500)
        assert result == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_type_action(self, mock_env):
        """TypeAction should handle denormalization and full Computer Use args."""
        action = TypeAction()
        args = {
            "x": 100,
            "y": 200,
            "text": "hello",
            "press_enter": True,
            "clear_before_typing": False,
        }

        result = await action.execute(mock_env, args)

        mock_env.page.mouse.click.assert_awaited_once_with(100, 200)
        mock_env.page.keyboard.type.assert_awaited_once_with("hello", delay=20)
        mock_env.page.keyboard.press.assert_awaited_once_with("Enter")
        assert result == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_hover_action(self, mock_env):
        """HoverAction should move mouse to denormalized coordinates."""
        action = HoverAction()
        await action.execute(mock_env, {"x": 100, "y": 100})
        mock_env.page.mouse.move.assert_awaited_once_with(100, 100)

    @pytest.mark.asyncio
    async def test_key_combination(self, mock_env):
        """KeyCombinationAction should press the specified keys."""
        action = KeyCombinationAction()
        await action.execute(mock_env, {"keys": "Control+A"})
        mock_env.page.keyboard.press.assert_awaited_once_with("Control+A")

    @pytest.mark.asyncio
    async def test_drag_and_drop(self, mock_env):
        """DragAndDropAction should perform mouse sequence."""
        action = DragAndDropAction()
        args = {"x": 100, "y": 100, "destination_x": 200, "destination_y": 200}
        await action.execute(mock_env, args)

        # Verify sequence (approximate)
        mock_env.page.mouse.move.assert_any_await(100, 100)
        mock_env.page.mouse.down.assert_awaited_once()
        mock_env.page.mouse.move.assert_any_await(200, 200, steps=10)
        mock_env.page.mouse.up.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_scroll_action(self, mock_env):
        """ScrollAction (scroll_document) should scale magnitude to viewport."""
        action = ScrollAction()
        # Magnitude 500 on 1000 height -> 500 pixels
        await action.execute(mock_env, {"direction": "down", "magnitude": 500})
        mock_env.page.mouse.wheel.assert_awaited_once_with(0, 500)

    @pytest.mark.asyncio
    async def test_scroll_at_action(self, mock_env):
        """ScrollAtAction should move then wheel."""
        action = ScrollAtAction()
        await action.execute(mock_env, {
            "x": 50,
            "y": 50,
            "direction": "up",
            "magnitude": 200
        })
        mock_env.page.mouse.move.assert_awaited_once_with(50, 50)
        mock_env.page.mouse.wheel.assert_awaited_once_with(0, -200)

    @pytest.mark.asyncio
    async def test_navigate_action(self, mock_env):
        """NavigateAction should call page.goto directly."""
        action = NavigateAction()
        args = {"url": "https://example.com"}

        result = await action.execute(mock_env, args)

        mock_env.page.goto.assert_awaited_once_with("https://example.com",
                                                    wait_until="networkidle",
                                                    timeout=60000)
        assert result == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_wait_action(self, mock_env):
        """WaitAction should sleep for 5 seconds."""
        action = WaitAction()
        from unittest.mock import patch

        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            await action.execute(mock_env, {})
            mock_sleep.assert_awaited_once_with(5)

    @pytest.mark.asyncio
    async def test_go_back_action(self, mock_env):
        """GoBackAction should call page.go_back()."""
        action = GoBackAction()
        await action.execute(mock_env, {})
        mock_env.page.go_back.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_go_forward_action(self, mock_env):
        """GoForwardAction should call page.go_forward()."""
        action = GoForwardAction()
        await action.execute(mock_env, {})
        mock_env.page.go_forward.assert_awaited_once()
