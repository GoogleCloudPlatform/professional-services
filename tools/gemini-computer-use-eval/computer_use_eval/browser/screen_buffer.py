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

import threading
import time
import mss
from collections import deque
from typing import List, Optional
from PIL import Image, ImageChops, ImageStat
import logging


class MotionDetector:
    """
    Utility for detecting visual changes between frames to ensure screen stability.
    """

    @staticmethod
    def calculate_diff(
        img1: Image.Image, img2: Image.Image, size: tuple[int, int] = (64, 64)
    ) -> float:
        """
        Calculates a normalized difference score (0.0 to 1.0) between two images.

        Optimized for performance:
        1. Downscales images to a small thumbnail (default 64x64).
        2. Converts to grayscale.
        3. Calculates the Mean Squared Error (MSE) of pixel differences.

        Args:
            img1: The first PIL Image.
            img2: The second PIL Image.
            size: The target size for downscaling (width, height).

        Returns:
            float: A score where 0.0 means identical and 1.0 means completely different (e.g., black vs white).
        """
        try:
            if img1 is None or img2 is None:
                return 1.0

            # 1. Downscale & Grayscale
            # We use distinct=False for speed (nearest neighbor is fine for motion detection)
            # convert('L') converts to grayscale (Luminance)
            i1 = img1.resize(size).convert("L")
            i2 = img2.resize(size).convert("L")

            # 2. Calculate Difference
            # ImageChops.difference returns the absolute difference pixel-by-pixel
            diff_img = ImageChops.difference(i1, i2)

            # 3. Calculate Mean Error
            stat = ImageStat.Stat(diff_img)
            # stat.mean returns a list [mean_channel_0, ...], for 'L' it's just [0]
            mean_diff = stat.mean[0]

            # 4. Normalize
            # Maximum possible difference in 8-bit grayscale is 255.
            return mean_diff / 255.0

        except Exception as e:
            logging.getLogger(__name__).error(f"Motion detection failed: {e}")
            return (
                1.0  # Assume max motion on error to be safe (prevent premature action)
            )


class ScreenBuffer:
    """
    A high-performance, thread-safe ring buffer for continuous screen capture.

    This class runs a background thread that captures the screen at a specified frame rate
    and stores the most recent frames in a deque. This architecture allows the main
    agent loop to access the "latest" frame instantly (<1ms latency) without blocking
    on the slow I/O of a fresh screen capture (typically 100ms+).

    Attributes:
        buffer_size (int): The maximum number of frames to retain in history.
        capture_rate (float): The target frames per second (FPS) for capture.
        running (bool): Flag indicating if the capture thread is active.
        buffer (deque): Thread-safe ring buffer storing PIL.Image objects.
        lock (threading.Lock): Mutex for synchronizing access to the buffer.
    """

    def __init__(
        self,
        buffer_size: int = 10,
        capture_rate: float = 30.0,
        stability_threshold: float = 0.005,
    ):
        """
        Initializes the ScreenBuffer.

        Args:
            buffer_size: Number of frames to keep in history (default: 10).
            capture_rate: Target frames per second (default: 30.0).
            stability_threshold: Difference threshold for stability (default: 0.005).
        """
        self.buffer_size = buffer_size
        self.capture_rate = capture_rate
        self.stability_threshold = stability_threshold
        self.running = False
        self.buffer: deque[Image.Image] = deque(maxlen=buffer_size)
        self.lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self.logger = logging.getLogger(__name__)

    def start(self) -> None:
        """
        Starts the background capture thread.

        This method is idempotent; calling it on an already running buffer has no effect.
        """
        with self.lock:
            if self.running:
                return

            self.running = True
            self._thread = threading.Thread(target=self._capture_loop, daemon=True)
            self._thread.start()
            self.logger.info(f"ScreenBuffer started at {self.capture_rate} FPS.")

    def stop(self) -> None:
        """
        Stops the background capture thread and waits for it to exit.
        """
        self.running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            if self._thread.is_alive():
                self.logger.warning("ScreenBuffer thread did not exit cleanly.")
            self._thread = None
        self.logger.info("ScreenBuffer stopped.")

    def _capture_loop(self) -> None:
        """
        The main loop for the background capture thread.

        Uses the `mss` library for high-speed, cross-platform screen capture.
        Captures are converted to PIL Images and stored in the ring buffer.
        """
        with mss.mss() as sct:
            # mss.monitors[0] is a virtual monitor that combines all screens.
            # mss.monitors[1] is the first physical monitor (primary).
            # We default to the primary monitor, falling back to 'all' if 1 is unavailable.
            monitor = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]

            while self.running:
                start_time = time.time()
                try:
                    # 1. Capture the screen
                    # sct.grab() returns a ScreenShot object containing raw pixel data.
                    # It is significantly faster than standard high-level capture methods.
                    sct_img = sct.grab(monitor)

                    # 2. Convert to PIL Image (Zero-Copy Optimization)
                    # sct_img.bgra contains raw bytes in BGRA order (Blue, Green, Red, Alpha).
                    # We use Image.frombytes to efficiently create a PIL Image without
                    # an intermediate copy or expensive pixel swapping.
                    # - "RGB": The target mode (standard 3-channel RGB).
                    # - "raw": The decoder to use.
                    # - "BGRX": The input mode. 'BGR' matches the byte order, and 'X'
                    #           tells PIL to ignore the 4th Alpha byte.
                    img = Image.frombytes(
                        "RGB", sct_img.size, sct_img.bgra, "raw", "BGRX"
                    )

                    # 3. Store in Buffer
                    # We lock to ensure atomic updates, preventing the main thread
                    # from reading a partially updated buffer (though deque is atomic,
                    # this prepares us for more complex logic later).
                    with self.lock:
                        self.buffer.append(img)

                except Exception as e:
                    self.logger.error(f"Screen capture failed: {e}")
                    # Brief pause on error to avoid a hot loop consuming 100% CPU
                    time.sleep(0.1)

                # 4. Rate Limiting
                # Calculate elapsed time and sleep just enough to maintain the target FPS.
                elapsed = time.time() - start_time
                target_interval = 1.0 / self.capture_rate
                if elapsed < target_interval:
                    time.sleep(target_interval - elapsed)

    def get_latest_frame(
        self, wait_for_stability: bool = False, timeout: float = 2.0
    ) -> Optional[Image.Image]:
        """
        Retrieves the most recent frame from the buffer.

        Args:
            wait_for_stability (bool): If True, blocks until the screen is stable
                                     (no motion detected) or timeout is reached.
            timeout (float): Maximum time (in seconds) to wait for stability.

        Returns:
            Optional[Image.Image]: The latest captured frame, or None if the buffer is empty.
        """
        if not wait_for_stability:
            with self.lock:
                return self.buffer[-1] if self.buffer else None

        # Stable Mode: Wait for screen to settle
        start_time = time.time()
        while (time.time() - start_time) < timeout:
            with self.lock:
                if len(self.buffer) >= 2:
                    frame_a = self.buffer[-2]
                    frame_b = self.buffer[-1]

                    diff = MotionDetector.calculate_diff(frame_a, frame_b)
                    if diff < self.stability_threshold:
                        self.logger.debug(
                            f"Screen stable (diff={diff:.4f}). Returning frame."
                        )
                        return frame_b
                elif len(self.buffer) == 1:
                    # Only one frame, can't compare yet.
                    pass
                else:
                    # No frames at all.
                    return None

            # Wait for next frame (approx 1/2 frame time to catch it quickly)
            time.sleep(0.5 / self.capture_rate)

        # Timeout reached
        self.logger.warning(
            f"Stability timeout ({timeout}s) reached. Returning latest available."
        )
        with self.lock:
            return self.buffer[-1] if self.buffer else None

    def get_frame_history(self, n: int) -> List[Image.Image]:
        """
        Retrieves the last N frames from the buffer.

        Args:
            n (int): The number of recent frames to retrieve.

        Returns:
            List[Image.Image]: A list of up to N frames, ordered from oldest to newest.
        """
        with self.lock:
            return list(self.buffer)[-n:]
