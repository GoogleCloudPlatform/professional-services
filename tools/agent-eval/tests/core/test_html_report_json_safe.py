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
"""Regression tests for HTML-report JSON embedding.

A non-finite float (NaN / ±Infinity) anywhere in the report payload used to be
serialized by ``json.dumps`` as a bare ``NaN`` / ``Infinity`` token — invalid
JSON that makes the browser's ``JSON.parse`` on the embedded
``<script type="application/json">`` payload throw, leaving a blank / broken
report. ``_json_safe`` sanitizes those to ``null`` at the serialization
boundary so the embedded payload is always valid JSON.
"""

import json
import math

from agent_eval.core.html_report import _json_safe


def _has_non_finite_token(s: str) -> bool:
    """True if the serialized string contains a bare NaN/Infinity JSON token."""
    found = False

    def _raise(_c):
        nonlocal found
        found = True
        return None

    json.loads(s, parse_constant=_raise)
    return found


def test_nan_and_infinity_become_null():
    payload = {"score": float("nan"), "delta": float("inf"), "neg": float("-inf")}
    safe = _json_safe(payload)
    assert safe == {"score": None, "delta": None, "neg": None}


def test_finite_values_are_preserved():
    payload = {"a": 0.82, "b": 3, "c": "text", "d": True, "e": None}
    assert _json_safe(payload) == payload


def test_nested_structures_are_sanitized():
    payload = {
        "rows": [{"x": float("nan")}, {"x": 1.5}],
        "nested": {"vals": [1, float("-inf"), 3.0]},
        "tuple_becomes_list": (float("inf"), 2),
    }
    safe = _json_safe(payload)
    assert safe["rows"][0]["x"] is None
    assert safe["rows"][1]["x"] == 1.5
    assert safe["nested"]["vals"] == [1, None, 3.0]
    assert safe["tuple_becomes_list"] == [None, 2]


def test_serialized_output_is_always_valid_json():
    payload = {
        "m": {"coherence": float("nan")},
        "deltas": [{"pct_change": float("inf")}],
    }
    dumped = json.dumps(_json_safe(payload))
    assert "NaN" not in dumped
    assert "Infinity" not in dumped
    assert not _has_non_finite_token(dumped)


def test_isfinite_contract():
    # Guards the assumption _json_safe relies on.
    assert not math.isfinite(float("nan"))
    assert not math.isfinite(float("inf"))
    assert math.isfinite(0.0)
