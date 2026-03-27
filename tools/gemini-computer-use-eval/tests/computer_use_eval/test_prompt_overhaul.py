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

from computer_use_eval.prompts import DEFAULT_SYSTEM_PROMPT


def test_system_prompt_structure():
    """
    Test that the DEFAULT_SYSTEM_PROMPT maintains its expected structural
    XML tags rather than brittle substring copy assertions.
    Prompt copy will change frequently, but the structural contract
    should remain stable.
    """
    assert DEFAULT_SYSTEM_PROMPT.strip(), "Prompt should not be empty"

    # Verify core structural sections exist
    assert "<role>" in DEFAULT_SYSTEM_PROMPT
    assert "</role>" in DEFAULT_SYSTEM_PROMPT

    assert "<instructions>" in DEFAULT_SYSTEM_PROMPT
    assert "</instructions>" in DEFAULT_SYSTEM_PROMPT

    assert "<constraints>" in DEFAULT_SYSTEM_PROMPT
    assert "</constraints>" in DEFAULT_SYSTEM_PROMPT

    assert "<format>" in DEFAULT_SYSTEM_PROMPT
    assert "</format>" in DEFAULT_SYSTEM_PROMPT
