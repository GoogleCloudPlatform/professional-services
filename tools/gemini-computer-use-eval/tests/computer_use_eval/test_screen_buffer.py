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
import time
import threading
from unittest.mock import MagicMock, patch
from PIL import Image

# We will import ScreenBuffer after creating it, but for now we define the test
# assuming the module structure.
from computer_use_eval.browser.screen_buffer import ScreenBuffer


class TestScreenBuffer:

    @pytest.fixture
    def mock_mss(self):
        with patch("computer_use_eval.browser.screen_buffer.mss.mss") as mock:
            yield mock

    def test_initialization(self):
        sb = ScreenBuffer(buffer_size=5, capture_rate=10)
        assert sb.buffer_size == 5
        assert sb.capture_rate == 10
        assert not sb.running
        assert len(sb.buffer) == 0

    def test_start_stop(self, mock_mss):
        mock_sct = mock_mss.return_value.__enter__.return_value
        mock_sct.monitors = [{}, {
            "top": 0,
            "left": 0,
            "width": 100,
            "height": 100
        }]
        mock_sct.grab.return_value = MagicMock(rgb=b"\x00" * 30000,
                                               size=(100, 100),
                                               bgra=b"\x00" * 40000)

        sb = ScreenBuffer()
        sb.start()
        assert sb.running
        assert sb._thread.is_alive()

        # specific for test environment where verify thread started
        time.sleep(0.1)

        sb.stop()
        assert not sb.running
        # The thread should be None after a successful stop
        assert sb._thread is None

    def test_capture_loop_adds_to_buffer(self, mock_mss):
        mock_sct = mock_mss.return_value.__enter__.return_value
        mock_sct.monitors = [{}, {
            "top": 0,
            "left": 0,
            "width": 10,
            "height": 10
        }]
        # Mocking the ScreenShot object from mss
        mock_shot = MagicMock()
        mock_shot.size = (10, 10)
        mock_shot.bgra = b"\x00" * 10 * 10 * 4  # 4 bytes per pixel
        mock_sct.grab.return_value = mock_shot

        sb = ScreenBuffer(capture_rate=50)
        sb.start()
        time.sleep(0.2)
        sb.stop()

        assert len(sb.buffer) > 0
        assert isinstance(sb.buffer[-1], Image.Image)

    def test_get_latest_frame_instant(self):
        sb = ScreenBuffer()
        # Pre-fill buffer manually
        img = Image.new("RGB", (10, 10), color="red")
        sb.buffer.append(img)

        frame = sb.get_latest_frame(wait_for_stability=False)
        assert frame == img

    def test_get_latest_frame_empty(self):
        sb = ScreenBuffer()
        frame = sb.get_latest_frame(wait_for_stability=False)
        assert frame is None

    def test_get_frame_history(self):
        sb = ScreenBuffer(buffer_size=5)
        img1 = Image.new("RGB", (10, 10), color="red")
        img2 = Image.new("RGB", (10, 10), color="blue")
        sb.buffer.append(img1)
        sb.buffer.append(img2)

    def test_get_latest_frame_stable(self):
        # We don't need mock_mss here because we'll manipulate the buffer manually
        sb = ScreenBuffer(capture_rate=100, stability_threshold=0.01)

        # 1. Fill with moving frames
        img1 = Image.new("RGB", (10, 10), color="red")
        img2 = Image.new("RGB", (10, 10), color="blue")
        sb.buffer.append(img1)
        sb.buffer.append(img2)

        # 2. In a background thread, add stable frames after a delay
        def stabilize():
            time.sleep(0.3)
            img_stable = Image.new("RGB", (10, 10), color="green")
            with sb.lock:
                sb.buffer.append(img_stable)
                sb.buffer.append(img_stable)

        t = threading.Thread(target=stabilize)
        t.start()

        start_time = time.time()
        frame = sb.get_latest_frame(wait_for_stability=True, timeout=1.0)
        end_time = time.time()

        # Should have waited at least 0.3s
        assert (end_time - start_time) >= 0.3
        # Should return the stable (green) frame
        assert frame.getpixel(
            (0, 0)) == (0, 128, 0)  # PIL 'green' is (0, 128, 0)
        t.join()

    def test_get_latest_frame_stable_timeout(self):
        sb = ScreenBuffer(capture_rate=100, stability_threshold=0.01)
        # Constantly moving
        img1 = Image.new("RGB", (10, 10), color="red")
        img2 = Image.new("RGB", (10, 10), color="blue")

        def keep_moving():
            while not getattr(threading.current_thread(), "stop", False):
                with sb.lock:
                    sb.buffer.append(img1)
                    sb.buffer.append(img2)
                time.sleep(0.01)

        t = threading.Thread(target=keep_moving)
        t.start()

        try:
            start_time = time.time()
            frame = sb.get_latest_frame(wait_for_stability=True, timeout=0.2)
            end_time = time.time()

            # Should have timed out around 0.2s
            assert 0.2 <= (end_time - start_time) < 0.4
            assert frame is not None
        finally:
            t.stop = True
            t.join()
