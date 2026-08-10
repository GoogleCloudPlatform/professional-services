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
"""Regression tests for detecting a wholly-failed interact phase.

``agent-eval`` never starts the agent — ``interact`` POSTs to whatever is
already listening on ``--base-url``. A leftover ``adk web`` serving a
*different* agent answers every request with a 5xx, so the runner still
returns N rows and the phase used to be marked ``completed``. Downstream, the
judges then received empty responses and failed with confusing errors that
pointed nowhere near the real cause.
"""

import json

import pandas as pd

from agent_eval.cli.commands.run import _interaction_failures

OK = json.dumps({"boolean": "success"})
BAD = json.dumps({"boolean": "failed", "error_message": "500 Server Error"})


def test_all_rows_failed_is_detected():
    failed, error = _interaction_failures(
        pd.DataFrame({"status": [BAD, BAD, BAD]}))
    assert failed == 3
    assert error == "500 Server Error"


def test_partial_failure_reports_only_the_failures():
    failed, error = _interaction_failures(
        pd.DataFrame({"status": [OK, BAD, OK]}))
    assert failed == 1
    assert error == "500 Server Error"


def test_all_successful_reports_no_failures():
    failed, error = _interaction_failures(pd.DataFrame({"status": [OK, OK]}))
    assert failed == 0
    assert error is None


def test_missing_status_column_is_not_treated_as_failure():
    assert _interaction_failures(pd.DataFrame({"prompt": ["hi"]})) == (0, None)


def test_already_parsed_status_dicts_are_handled():
    rows = [{
        "boolean": "failed",
        "error_message": "boom"
    }, {
        "boolean": "success"
    }]
    failed, error = _interaction_failures(pd.DataFrame({"status": rows}))
    assert failed == 1
    assert error == "boom"


def test_unparseable_status_is_skipped_not_counted():
    failed, error = _interaction_failures(
        pd.DataFrame({"status": ["not json", OK]}))
    assert failed == 0
    assert error is None
