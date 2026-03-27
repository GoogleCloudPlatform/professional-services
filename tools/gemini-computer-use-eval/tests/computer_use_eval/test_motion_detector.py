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

from PIL import Image, ImageDraw
from computer_use_eval.browser.screen_buffer import MotionDetector


class TestMotionDetector:
    def test_calculate_diff_identical(self):
        img1 = Image.new("RGB", (100, 100), color="white")
        img2 = Image.new("RGB", (100, 100), color="white")

        diff = MotionDetector.calculate_diff(img1, img2)
        assert diff == 0.0

    def test_calculate_diff_different(self):
        img1 = Image.new("RGB", (100, 100), color="white")
        img2 = Image.new("RGB", (100, 100), color="black")

        diff = MotionDetector.calculate_diff(img1, img2)
        # Max difference should be high (normalized to 0.0-1.0 or raw MSE?)
        # Let's assume normalized 0-1 for now, or raw MSE (which would be 255^2 for 8-bit)
        # The spec says "normalized difference score (0.0 to 1.0)".
        assert diff > 0.9

    def test_calculate_diff_partial(self):
        img1 = Image.new("RGB", (100, 100), color="white")
        img2 = Image.new("RGB", (100, 100), color="white")
        draw = ImageDraw.Draw(img2)
        draw.rectangle([0, 0, 50, 100], fill="black")

        diff = MotionDetector.calculate_diff(img1, img2)
        assert 0.4 < diff < 0.6  # Approx half the image changed

    def test_downscaling_performance(self):
        # Large images should still process quickly
        img1 = Image.new("RGB", (1920, 1080), color="white")
        img2 = Image.new("RGB", (1920, 1080), color="black")

        import time

        start = time.time()
        MotionDetector.calculate_diff(img1, img2)
        end = time.time()

        assert (end - start) < 0.1  # Should be faster than 100ms (relaxed for CI)
