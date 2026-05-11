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
"""Tests for per-row capability routing in the evaluator.

Replaces the legacy `applies_to` source-type filter. The evaluator now decides
metric eligibility per-row by intersecting a row's detected capabilities with
the metric's `requires_*` flags.
"""

import pandas as pd

from agent_eval.core.evaluator import (
    _CAP_MULTI_TURN,
    _CAP_REFERENCE,
    _interaction_row_capabilities,
    _required_capabilities,
)


def _row(**kwargs) -> pd.Series:
    return pd.Series(kwargs)


class TestInteractionRowCapabilities:
    def test_reference_data_with_value_yields_reference_capability(self):
        row = _row(reference_data={"expected_behavior": "Foggy"})
        assert _CAP_REFERENCE in _interaction_row_capabilities(row)

    def test_reference_data_empty_dict_does_not_yield_reference(self):
        row = _row(reference_data={})
        assert _CAP_REFERENCE not in _interaction_row_capabilities(row)

    def test_reference_data_with_empty_value_does_not_yield_reference(self):
        # Common case: golden row scaffolded with empty placeholder
        row = _row(reference_data={"expected_behavior": ""})
        assert _CAP_REFERENCE not in _interaction_row_capabilities(row)

    def test_multi_user_inputs_yields_multi_turn(self):
        row = _row(user_inputs=["First", "Second"])
        assert _CAP_MULTI_TURN in _interaction_row_capabilities(row)

    def test_single_user_input_does_not_yield_multi_turn(self):
        row = _row(user_inputs=["only"])
        assert _CAP_MULTI_TURN not in _interaction_row_capabilities(row)

    def test_simulation_source_type_yields_multi_turn_even_with_one_input(self):
        # Simulations are inherently multi-turn even when only the seed is logged.
        row = _row(user_inputs=["seed"], source_type="simulation")
        assert _CAP_MULTI_TURN in _interaction_row_capabilities(row)


class TestRequiredCapabilities:
    def test_no_flags_means_no_requirements(self):
        assert _required_capabilities({}) == set()

    def test_requires_reference_flag(self):
        assert _required_capabilities({"requires_reference": True}) == {_CAP_REFERENCE}

    def test_requires_multi_turn_flag(self):
        assert _required_capabilities({"requires_multi_turn": True}) == {_CAP_MULTI_TURN}

    def test_both_flags(self):
        caps = _required_capabilities({
            "requires_reference": True,
            "requires_multi_turn": True,
        })
        assert caps == {_CAP_REFERENCE, _CAP_MULTI_TURN}


class TestRoutingIntegration:
    """Sanity check: the same logic the evaluator uses inline."""

    def _eligible(self, metric_info: dict, rows: list[dict]) -> list[int]:
        df = pd.DataFrame(rows)
        required = _required_capabilities(metric_info)
        if not required:
            return list(df.index)
        mask = df.apply(
            lambda r: required.issubset(_interaction_row_capabilities(r)),
            axis=1,
        )
        return list(df[mask].index)

    def test_reference_metric_skips_rows_without_reference(self):
        rows = [
            {"user_inputs": ["q1"], "reference_data": {"expected_behavior": "yes"}},
            {"user_inputs": ["q2"], "reference_data": {}},
            {"user_inputs": ["q3"], "reference_data": {"expected_behavior": "no"}},
        ]
        eligible = self._eligible({"requires_reference": True}, rows)
        assert eligible == [0, 2]

    def test_multi_turn_metric_skips_single_turn_rows(self):
        rows = [
            {"user_inputs": ["a", "b"], "source_type": "interaction"},
            {"user_inputs": ["only"], "source_type": "interaction"},
            {"user_inputs": ["seed"], "source_type": "simulation"},
        ]
        eligible = self._eligible({"requires_multi_turn": True}, rows)
        assert eligible == [0, 2]

    def test_no_requirements_keeps_all_rows(self):
        rows = [
            {"user_inputs": ["x"], "reference_data": {}},
            {"user_inputs": ["y"], "reference_data": {}},
        ]
        eligible = self._eligible({}, rows)
        assert eligible == [0, 1]
