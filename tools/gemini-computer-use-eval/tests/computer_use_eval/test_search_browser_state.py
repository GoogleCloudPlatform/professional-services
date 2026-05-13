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
from computer_use_eval.custom_tools import search_browser_state


def test_search_browser_state_finds_match(tmp_path):
    file_path = tmp_path / "browser_state.json"

    content = [
        "=== ARIA ACCESSIBILITY TREE ===",
        "{",
        '  "role": "root",',
        '  "children": [',
        "    {",
        '      "role": "textbox",',
        '      "name": "Search Query"',
        "    },",
        "    {",
        '      "role": "button",',
        '      "name": "Submit"',
        "    }",
        "  ]",
        "}",
        "=== RECENT CONSOLE LOGS ===",
        "Loading complete.",
    ]
    file_path.write_text("\n".join(content))

    old_run_dir = os.environ.get("RUN_DIR")
    os.environ["RUN_DIR"] = str(tmp_path)

    try:
        result = search_browser_state("Submit", context_lines=2)
        assert "--- Match 1 ---" in result
        assert "button" in result
        assert '>       "name": "Submit"' in result

        result2 = search_browser_state("Loading", context_lines=1)
        assert "> Loading complete." in result2

        result3 = search_browser_state("NonExistent", context_lines=1)
        assert "No matches found" in result3
    finally:
        if old_run_dir is not None:
            os.environ["RUN_DIR"] = old_run_dir
        else:
            del os.environ["RUN_DIR"]
