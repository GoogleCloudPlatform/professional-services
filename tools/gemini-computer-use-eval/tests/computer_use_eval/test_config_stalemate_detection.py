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

from computer_use_eval.config import ContextConfig, Settings, ReflectionStrategy


def test_config_stalemate_detection_fields():
    # Test ContextConfig
    config = ContextConfig()
    assert hasattr(config, "reflection_strategy")
    assert config.reflection_strategy == ReflectionStrategy.NUDGE


def test_settings_stalemate_detection_fields():
    # Test BaseSettings
    settings = Settings()
    assert hasattr(settings, "STALEMATE_STRICT_THRESHOLD")
    assert hasattr(settings, "STALEMATE_LOOSE_THRESHOLD")
    assert hasattr(settings, "STALEMATE_HISTORY_WINDOW")
