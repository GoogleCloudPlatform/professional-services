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

from enum import StrEnum


class ToolNames(StrEnum):
    CLICK_AT = "click_at"
    DOUBLE_CLICK_AT = "double_click_at"
    TYPE_TEXT_AT = "type_text_at"
    NAVIGATE = "navigate"
    SCROLL_AT = "scroll_at"
    HOVER_AT = "hover_at"
    KEY_COMBINATION = "key_combination"
    DRAG_AND_DROP = "drag_and_drop"
    OPEN_WEB_BROWSER = "open_web_browser"
    WAIT_5_SECONDS = "wait_5_seconds"
    SCROLL_DOCUMENT = "scroll_document"
    GO_BACK = "go_back"
    GO_FORWARD = "go_forward"
    SEARCH = "search"


# Action Execution Constants
