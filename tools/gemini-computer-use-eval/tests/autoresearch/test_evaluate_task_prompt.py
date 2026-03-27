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
import unittest.mock as mock
from autoresearch.evaluate_task_prompt import (
    calculate_reward,
    aggregate_results,
    log_to_tsv,
    run_evaluation,
)


def test_calculate_reward_failure():
    # Success rate == 0% should result in 0 reward
    assert (
        calculate_reward(
            success_rate=0.0,
            avg_steps=5,
            avg_tokens=500,
            step_variance=0.0,
            prompt_length=100,
        )
        == 0.0
    )

    # Success rate == 0.66 should yield partial reward
    # success_score = (0.66**2) * 1000 = 435.6
    # steps_penalty = 10 * 10 = 100
    # tokens_penalty = 1000 / 1000 = 1
    # total = 435.6 - 101 = 334.6
    reward = calculate_reward(
        success_rate=0.66,
        avg_steps=10,
        avg_tokens=1000,
        step_variance=0.0,
        prompt_length=100,
    )
    assert reward == pytest.approx(334.6, rel=1e-2)


def test_calculate_reward_success():
    # Success rate == 100% should use the new formulation
    # success_score = 1000
    # steps_penalty = 10 * 10 = 100
    # tokens_penalty = 1000 / 1000 = 1
    # total = 1000 - 100 - 1 = 899.0
    reward = calculate_reward(
        success_rate=1.0,
        avg_steps=10,
        avg_tokens=1000,
        step_variance=0.0,
        prompt_length=0,
    )
    assert reward == pytest.approx(899.0, rel=1e-2)


def test_aggregate_results():
    # Test aggregation of multiple runs
    runs = [
        {
            "success": True,
            "success_score": 1.0,
            "steps": 5,
            "metadata": {
                "total_input_tokens": 250,
                "total_cached_tokens": 0,
                "total_output_tokens": 250,
            },
        },
        {
            "success": True,
            "success_score": 1.0,
            "steps": 7,
            "metadata": {
                "total_input_tokens": 350,
                "total_cached_tokens": 0,
                "total_output_tokens": 350,
            },
        },
        {
            "success": False,
            "success_score": 0.0,
            "steps": 10,
            "metadata": {
                "total_input_tokens": 500,
                "total_cached_tokens": 0,
                "total_output_tokens": 500,
            },
        },
    ]
    agg = aggregate_results(runs)
    assert agg["success_rate"] == pytest.approx(0.666, rel=1e-2)
    assert agg["avg_steps"] == pytest.approx(7.333, rel=1e-2)
    assert agg["avg_tokens"] == pytest.approx(733.333, rel=1e-2)


def test_log_to_tsv(tmp_path):
    # Mock results.tsv path
    with (
        mock.patch(
            "autoresearch.evaluate_task_prompt.os.path.exists", return_value=False
        ),
        mock.patch(
            "autoresearch.evaluate_task_prompt.open", mock.mock_open()
        ) as mocked_file,
        mock.patch("autoresearch.evaluate_task_prompt.datetime") as mock_datetime,
    ):
        mock_datetime.datetime.now.return_value.strftime.return_value = (
            "20260316_120000"
        )

        aggregated = {
            "reward": 100.1,
            "avg_steps": 10.0,
            "avg_tokens": 1000.0,
            "success_rate": 1.0,
        }

        log_to_tsv(aggregated, "bench.yaml", "test desc")

        # Check if header and line were written
        mocked_file().write.assert_any_call(
            "run_id\tscore\tavg_steps\tavg_tokens\tstatus\tdescription\n"
        )
        mocked_file().write.assert_any_call(
            "20260316_120000\t100.100000\t10.0\t1000.0\tKEEP\ttest desc\n"
        )


@pytest.mark.asyncio
async def test_run_evaluation(tmp_path):
    # Mock benchmark file
    bench_file = tmp_path / "test_bench.yaml"
    bench_file.write_text("name: Test Task\ntask:\n  goal: do something")

    # Mock run_single_resolution to avoid actual browser/API calls
    mock_result = {
        "success": True,
        "success_score": 1.0,
        "steps": 5,
        "metadata": {
            "total_input_tokens": 100,
            "total_cached_tokens": 0,
            "total_output_tokens": 100,
        },
        "judges": {
            "assertion": {"score": 1.0, "reasoning": "passed"},
            "visual": {"score": 1.0, "reasoning": "looks good"},
            "trace": {"score": 1.0, "reasoning": "trace good"},
        },
    }

    with (
        mock.patch(
            "autoresearch.evaluate_task_prompt.run_single_resolution",
            return_value=mock_result,
        ),
        mock.patch(
            "autoresearch.evaluate_task_prompt.resolve_config_files",
            side_effect=lambda c, d: c,
        ),
        mock.patch(
            "autoresearch.evaluate_task_prompt.template_value", side_effect=lambda c: c
        ),
    ):
        # We need to mock os.makedirs to prevent directory creation
        with mock.patch("os.makedirs"):
            result = await run_evaluation(str(bench_file), num_runs=2)

            assert result["success_rate"] == 1.0
            assert result["avg_steps"] == 5.0
            assert result["avg_tokens"] == 200.0
            assert result["reward"] > 0
