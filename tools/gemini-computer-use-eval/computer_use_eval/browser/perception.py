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

import logging
import asyncio
from typing import Optional
from io import BytesIO
from playwright.async_api import Page
from computer_use_eval.browser.screen_buffer import ScreenBuffer

logger = logging.getLogger(__name__)


class PerceptionService:
    """
    Handles screen capture and visual state observation.
    Supports high-speed MSS capture via ScreenBuffer or fallback to Playwright CDP.
    """

    def __init__(
        self,
        enable_screen_buffer: bool = False,
        capture_rate: float = 30.0,
        image_quality: str = None,
    ):
        from computer_use_eval.config import settings

        self.image_quality = image_quality or settings.IMAGE_QUALITY
        self.screen_buffer: Optional[ScreenBuffer] = None
        if enable_screen_buffer:
            self.screen_buffer = ScreenBuffer(capture_rate=capture_rate)
            logger.info(
                f"PerceptionService initialized with ScreenBuffer (rate={capture_rate}fps)"
            )

    def start(self):
        """Starts the high-speed capture loop if enabled."""
        if self.screen_buffer:
            self.screen_buffer.start()

    def stop(self):
        """Stops the high-speed capture loop."""
        if self.screen_buffer:
            self.screen_buffer.stop()

    async def get_screenshot(self, page: Optional[Page]) -> bytes:
        """
        Returns a screenshot as PNG bytes.
        Uses ScreenBuffer if available, otherwise falls back to Playwright.
        """
        from computer_use_eval.utils import resize_image
        from computer_use_eval.config import settings, ImageQuality

        screenshot_bytes = None

        # Try ScreenBuffer first (high-speed MSS capture)
        if self.screen_buffer:
            try:
                frame = self.screen_buffer.get_latest_frame(
                    wait_for_stability=False)
                if frame:
                    buffer = BytesIO()
                    frame.save(buffer, format="PNG")
                    screenshot_bytes = buffer.getvalue()
            except Exception as e:
                logger.warning(
                    f"ScreenBuffer capture failed, falling back to Playwright: {e}"
                )

        # Fallback to standard Playwright capture
        if not screenshot_bytes and page:
            import time

            start_capture = time.time()
            last_error = None
            for attempt in range(3):
                try:
                    # Optimized screenshot: frozen animations to stabilize visual state
                    screenshot_bytes = await page.screenshot(
                        type="png",
                        timeout=60000,
                        animations="disabled",
                        full_page=False,
                    )
                    break
                except Exception as e:
                    last_error = e
                    logger.warning(
                        f"Playwright screenshot attempt {attempt + 1}/3 failed: {e}"
                    )

                    # Force a reflow to help recovery
                    try:
                        await page.evaluate(
                            "window.scrollBy(0,1);window.scrollBy(0,-1);")
                    except Exception:
                        pass
                    await asyncio.sleep(0.5)

            if not screenshot_bytes:
                raise last_error or RuntimeError("Screenshot capture failed.")
            else:
                capture_duration = time.time() - start_capture
                if (capture_duration > 0.1
                   ):  # Only log if it's noticeably slow (e.g. over CDP)
                    logger.info(
                        f"Playwright CDP Screenshot captured in {capture_duration:.3f}s"
                    )

        if not screenshot_bytes:
            return b""

        # Apply Image Quality Optimizations
        force_grayscale = getattr(settings, "IMAGE_GRAYSCALE", False)

        if self.image_quality == ImageQuality.LOW:
            # Grayscale + 50% scale
            return resize_image(
                screenshot_bytes,
                max_width=settings.SCREEN_WIDTH // 2,
                max_height=settings.SCREEN_HEIGHT // 2,
                grayscale=True,
            )
        elif self.image_quality == ImageQuality.MEDIUM:
            # Color + 75% scale (unless forced grayscale)
            return resize_image(
                screenshot_bytes,
                max_width=int(settings.SCREEN_WIDTH * 0.75),
                max_height=int(settings.SCREEN_HEIGHT * 0.75),
                grayscale=force_grayscale,
            )
        elif force_grayscale:
            # Full res but Grayscale
            return resize_image(
                screenshot_bytes,
                max_width=settings.SCREEN_WIDTH,
                max_height=settings.SCREEN_HEIGHT,
                grayscale=True,
            )

        return screenshot_bytes

    def is_significant_change(self, old_aria: str, new_aria: str) -> bool:
        """
        Heuristically determines if the UI has changed significantly
        (e.g. a modal opened, or navigation occurred).
        """
        if not old_aria or not new_aria:
            return False

        # If the number of interactive elements changed by more than 20%,
        # it's likely a major UI delta.
        old_count = old_aria.count(";")
        new_count = new_aria.count(";")

        if old_count == 0:
            return new_count > 0

        delta = abs(new_count - old_count) / old_count
        if delta > 0.2:
            return True

        # Check for URL changes in the snapshot if we decide to include them,
        # but usually the Environment handles URL checks.
        return False
