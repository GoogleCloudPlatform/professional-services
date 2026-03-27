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

from computer_use_eval.utils import CoordinateScaler


def test_coordinate_scaler_denormalize():
    """
    Test denormalization from 0-1000 scale to absolute pixels.
    Target resolution: 1440x900
    """
    scaler = CoordinateScaler(width=1440, height=900)

    # Center
    assert scaler.denormalize(500, 500) == (720, 450)

    # Top-Left
    assert scaler.denormalize(0, 0) == (0, 0)

    # Bottom-Right
    assert scaler.denormalize(1000, 1000) == (1440, 900)

    # Arbitrary point
    # x: (250 / 1000) * 1440 = 360
    # y: (750 / 1000) * 900 = 675
    assert scaler.denormalize(250, 750) == (360, 675)


def test_coordinate_scaler_normalize():
    """
    Test normalization from absolute pixels to 0-1000 scale.
    Target resolution: 1440x900
    """
    scaler = CoordinateScaler(width=1440, height=900)

    # Center
    assert scaler.normalize(720, 450) == (500, 500)

    # Top-Left
    assert scaler.normalize(0, 0) == (0, 0)

    # Bottom-Right
    assert scaler.normalize(1440, 900) == (1000, 1000)

    # Arbitrary point
    # x: (360 / 1440) * 1000 = 250
    # y: (675 / 900) * 1000 = 750
    assert scaler.normalize(360, 675) == (250, 750)


def test_coordinate_scaler_clamping():
    """
    Test that the scaler clamps out-of-bounds coordinates correctly.
    """
    scaler = CoordinateScaler(width=1440, height=900)

    # Denormalize clamping
    assert scaler.denormalize(1100, -100) == (1440, 0)

    # Normalize clamping
    assert scaler.normalize(1500, -50) == (1000, 0)
