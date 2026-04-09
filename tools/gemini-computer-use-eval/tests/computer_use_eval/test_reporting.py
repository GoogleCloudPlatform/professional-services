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

import pytest
from unittest.mock import patch
from computer_use_eval.evaluation.reporting import BigQueryReporter
from computer_use_eval.config import settings


def test_bq_reporter_disabled_by_default():
    """Verify BQ reporter does nothing if disabled in settings."""
    # Ensure disabled
    with patch.object(settings, "ENABLE_BIGQUERY", False):
        reporter = BigQueryReporter()
        assert reporter.client is None

        # Should be safe to call report
        reporter.report({"some": "data"})


@pytest.fixture
def mock_bigquery():
    with patch("google.cloud.bigquery.Client") as mock_client:
        yield mock_client


def test_bq_reporter_enabled(mock_bigquery):
    """Verify BQ reporter initializes and sends data if enabled."""
    with patch.object(settings, "ENABLE_BIGQUERY", True):
        with patch.object(settings, "PROJECT_ID", "test-proj"):
            reporter = BigQueryReporter()

            # Check init
            mock_bigquery.assert_called_with(project="test-proj")
            reporter.client.create_dataset.assert_called()
            reporter.client.create_table.assert_called()

            # Check report
            data = {
                "run_id": "test_run",
                "timestamp": "2024-01-01T00:00:00",
                "benchmark": "test_bench",
                "global_success": True,
                "aggregates": {
                    "deterministic": 1.0,
                    "visual": 1.0,
                    "trace": 1.0
                },
                "resolutions": {},
            }
            reporter.report(data)

            reporter.client.insert_rows_json.assert_called_once()
            args = reporter.client.insert_rows_json.call_args
            assert args[0][0].endswith("runs")  # Table ID check
            assert args[0][1][0]["run_id"] == "test_run"
