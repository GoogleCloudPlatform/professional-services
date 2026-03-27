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

from computer_use_eval.core.middleware.stalemate_detection import (
    StalemateDetectionMiddleware,)
from unittest.mock import MagicMock


def test_semantic_hashing_ignores_volatile_elements():
    mw = StalemateDetectionMiddleware(MagicMock())

    # Base Tree
    tree_1 = "Root [focused] \n Button 12:00 PM \n Item 5 mins ago \n ID a1b2c3d4"

    # Semantically identical tree (different time/focus/id)
    tree_2 = "Root \n Button 1:05 PM \n Item 6 mins ago \n ID f8e7d6c5"

    # Different semantic tree
    tree_3 = "Root \n New Button \n Item 6 mins ago \n ID f8e7d6c5"

    hash_1 = mw._get_state_hash(tree_1)
    hash_2 = mw._get_state_hash(tree_2)
    hash_3 = mw._get_state_hash(tree_3)

    assert hash_1 == hash_2, "Semantic hashing failed to mask volatile elements."
    assert hash_1 != hash_3, "Semantic hashing masked too aggressively."
