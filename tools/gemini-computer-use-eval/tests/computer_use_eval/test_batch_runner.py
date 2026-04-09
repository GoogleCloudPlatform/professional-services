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
from unittest.mock import patch, AsyncMock, MagicMock
from computer_use_eval.core import batch_runner


@pytest.fixture
def mock_settings():
    """Mock the settings object to control OUTPUT_DIR."""
    with patch("computer_use_eval.runner.settings") as mock_set:
        mock_set.OUTPUT_DIR = "/tmp/test_artifacts"
        mock_set.LOG_FORMAT = "%(message)s"
        yield mock_set


@pytest.fixture
def mock_bigquery_reporter():
    """Mock BigQueryReporter as it's used in runner.main."""
    with patch("computer_use_eval.runner.BigQueryReporter") as MockReporter:
        mock_reporter_instance = MockReporter.return_value
        mock_reporter_instance.report = MagicMock()
        yield mock_reporter_instance


@pytest.mark.asyncio
async def test_batch_runner_main_single_benchmark(mock_settings,):
    """Test batch_runner.run_batch with a single benchmark."""

    with patch("glob.glob",
               return_value=["config/benchmarks/test_benchmark.yaml"]):
        with patch(
                "computer_use_eval.core.batch_runner.run_benchmark_main",
                new_callable=AsyncMock,
        ) as mock_run_main:
            await batch_runner.run_batch(patterns=["config/benchmarks/*.yaml"])

            # Assert that runner.main was called once
            mock_run_main.assert_awaited_once()


@pytest.mark.asyncio
async def test_batch_runner_main_multiple_benchmarks(mock_settings,):
    """Test batch_runner.run_batch with multiple benchmarks."""

    benchmark_files = [
        "config/benchmarks/test_benchmark_1.yaml",
        "config/benchmarks/test_benchmark_2.yaml",
    ]

    with patch("glob.glob", return_value=benchmark_files):
        with patch(
                "computer_use_eval.core.batch_runner.run_benchmark_main",
                new_callable=AsyncMock,
        ) as mock_run_main:
            await batch_runner.run_batch(patterns=["config/benchmarks/*.yaml"])

            # Assert that runner.main was called twice
            assert mock_run_main.call_count == 2
