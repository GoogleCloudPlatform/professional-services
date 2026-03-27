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

import os
from unittest.mock import patch
from computer_use_eval.utils import template_value, parse_resolutions

describe_template_value = "template_value"


class TestTemplateValue:

    def test_simple_string_substitution(self):
        """Should replace {{VAR}} with environment variable value."""
        with patch.dict(os.environ, {"MY_VAR": "Hello World"}):
            result = template_value("Start {{ MY_VAR }} End")
            assert result == "Start Hello World End"

    def test_env_namespace_substitution(self):
        """Should replace {{ env.VAR }} with environment variable value."""
        with patch.dict(os.environ, {"MY_VAR": "Hello Jinja"}):
            result = template_value("Start {{ env.MY_VAR }} End")
            assert result == "Start Hello Jinja End"

    def test_missing_variable_renders_empty(self):
        """Should replace missing {{VAR}} with an empty string."""
        with patch.dict(os.environ, {}, clear=True):
            result = template_value("Start {{ MISSING }} End")
            assert result == "Start  End"

    def test_jinja_filter_support(self):
        """Should correctly apply Jinja2 filters like | upper."""
        with patch.dict(os.environ, {"MY_VAR": "lowercase"}):
            result = template_value("{{ env.MY_VAR | upper }}")
            assert result == "LOWERCASE"

    def test_default_filter_support(self):
        """Should use the default value if the environment variable is missing."""
        with patch.dict(os.environ, {}, clear=True):
            result = template_value(
                "Value: {{ env.MISSING | default('fallback') }}")
            assert result == "Value: fallback"

    def test_no_template_returns_original_string(self):
        """Should return the original string if no template markers are present."""
        original_string = "This is a plain string."
        result = template_value(original_string)
        assert result == original_string

    def test_nested_dict(self):
        """Should recursively template values in dictionaries."""
        data = {
            "key1": "Value {{ VAR1 }}",
            "nested": {
                "key2": "{{ env.VAR2 | upper }}"
            },
        }
        with patch.dict(os.environ, {"VAR1": "A", "VAR2": "b"}):
            result = template_value(data)
            assert result["key1"] == "Value A"
            assert result["nested"]["key2"] == "B"

    def test_list_substitution(self):
        """Should recursively template values in lists."""
        data = ["Item {{ VAR }}", "Static", "{{ env.VAR2 | default('d') }}"]
        with patch.dict(os.environ, {"VAR": "1"}):
            result = template_value(data)
            assert result == ["Item 1", "Static", "d"]

    def test_mixed_types(self):
        """Should handle mixed types (int, None) gracefully by ignoring them."""
        data = {"id": 123, "val": None, "text": "{{ VAR }}"}
        with patch.dict(os.environ, {"VAR": "ok"}):
            result = template_value(data)
            assert result["id"] == 123
            assert result["val"] is None
            assert result["text"] == "ok"


describe_parse_resolutions = "parse_resolutions"


class TestParseResolutions:

    def test_parse_single_valid(self):
        """Should parse a single resolution string."""
        result = parse_resolutions("1920x1080")
        assert result == [(1920, 1080)]

    def test_parse_multiple_valid(self):
        """Should parse multiple comma-separated resolutions."""
        result = parse_resolutions("1024x768, 800x600")
        assert result == [(1024, 768), (800, 600)]

    def test_none_returns_default(self):
        """Should return default settings resolution if input is None."""
        # Mock settings to ensure stable test
        with patch("computer_use_eval.utils.settings") as mock_settings:
            mock_settings.SCREEN_WIDTH = 100
            mock_settings.SCREEN_HEIGHT = 100
            result = parse_resolutions(None)
            assert result == [(100, 100)]

    def test_empty_string_returns_default(self):
        """Should return default settings resolution if input is empty string."""
        with patch("computer_use_eval.utils.settings") as mock_settings:
            mock_settings.SCREEN_WIDTH = 100
            mock_settings.SCREEN_HEIGHT = 100
            result = parse_resolutions("")
            assert result == [(100, 100)]

    def test_ignore_invalid_format(self):
        """Should skip invalid formats but keep valid ones."""
        # "bad" is invalid, "100x100" is valid
        result = parse_resolutions("bad,100x100")
        assert result == [(100, 100)]

    def test_all_invalid_returns_default(self):
        """Should fallback to default if all inputs are invalid."""
        with patch("computer_use_eval.utils.settings") as mock_settings:
            mock_settings.SCREEN_WIDTH = 100
            mock_settings.SCREEN_HEIGHT = 100
            result = parse_resolutions("bad,alsobad")
            assert result == [(100, 100)]

    def test_case_insensitive(self):
        """Should handle 'X' separator case insensitively."""
        result = parse_resolutions("100X100")
        assert result == [(100, 100)]
