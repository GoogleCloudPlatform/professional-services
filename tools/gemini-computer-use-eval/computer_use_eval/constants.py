# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

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
