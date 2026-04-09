# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Utility functions for text manipulation."""

import re
from typing import Any, Dict, List

from langchain_core.messages import AIMessage, HumanMessage


def sanitize_filename(name: str) -> str:
    """
    Standardizes filenames.
    'Place Order (Checkout).pdf' -> 'place_order_checkout.pdf'
    """
    # 1. Convert to lowercase
    clean = name.lower()
    # 2. Replace common separators and invalid characters with spaces
    clean = re.sub(r"[/\\-]", " ", clean)
    clean = re.sub(r"[^a-z0-9\s._]", "", clean)
    # 3. Replace one or more spaces with a single underscore.
    clean = re.sub(r"\s+", "_", clean)
    return clean


def convert_messages_to_dicts(messages: List[Any]) -> List[Dict[str, str]]:
    """
    Converts a list of messages (which can be BaseMessage objects or dicts)
    into a consistent list of dictionaries with 'role' and 'content'.
    """
    converted_messages = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            converted_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            converted_messages.append({"role": "assistant", "content": msg.content})
        elif isinstance(msg, dict) and "role" in msg and "content" in msg:
            converted_messages.append(msg)
        # Optionally, handle other message types or just ignore them.
        # For now, we'll only process HumanMessage, AIMessage, and valid dicts.
    return converted_messages
