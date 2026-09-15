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

"""Unit test suite for cli/log_pipeline_tool.py subcommands and FinOps math.

Covers:
  1. generate-logs across json, proto, http, malformed, and mixed types.
  2. inspect-dlq offline mock file parsing and diagnostic output formatting.
  3. replay-dlq auto-repair payload wrapping and udf_error removal.
  4. analyze-savings ROI calculations and exit code 2 on invalid inputs.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

from cli.log_pipeline_tool import calculate_finops_savings, main

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CLI_SCRIPT = PROJECT_ROOT / "cli" / "log_pipeline_tool.py"


def test_generate_logs_all_payload_types(tmp_path: Path) -> None:
    """Verifies generate-logs produces valid JSON lines or malformed lines."""
    for ptype in ["json", "proto", "http", "mixed"]:
        out_file = tmp_path / f"logs_{ptype}.jsonl"
        ret = main(
            [
                "generate-logs",
                "--count",
                "5",
                "--payload-type",
                ptype,
                "--mode",
                "local",
                "--output-file",
                str(out_file),
            ]
        )
        assert ret == 0
        lines = out_file.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 5
        for line in lines:
            parsed = json.loads(line)
            assert "insertId" in parsed
            assert "logName" in parsed
            assert "timestamp" in parsed

    mal_file = tmp_path / "logs_malformed.txt"
    ret_mal = main(
        [
            "generate-logs",
            "--count",
            "3",
            "--payload-type",
            "malformed",
            "--mode",
            "local",
            "--output-file",
            str(mal_file),
        ]
    )
    assert ret_mal == 0
    mal_lines = mal_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(mal_lines) == 3


def test_inspect_dlq_offline_mock_file(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """Verifies inspect-dlq reads failed messages from mock file."""
    err_root = "Error: Root log payload must be a non-null JSON object"
    mock_dlq = [
        {
            "message_id": "dlq-101",
            "publish_time": "2026-09-15T01:00:00Z",
            "data": "CORRUPTED_RAW_PAYLOAD",
            "attributes": {"udf_error": "SyntaxError: Unexpected token C"},
        },
        {
            "message_id": "dlq-102",
            "publish_time": "2026-09-15T01:01:00Z",
            "data": "[1, 2, 3]",
            "attributes": {"udf_error": err_root},
        },
    ]
    mock_file = tmp_path / "dlq_mock.json"
    mock_file.write_text(json.dumps(mock_dlq), encoding="utf-8")

    ret = main(
        [
            "inspect-dlq",
            "--mock-file",
            str(mock_file),
            "--format",
            "json",
        ]
    )
    assert ret == 0
    captured = capsys.readouterr()
    report = json.loads(captured.out)
    assert isinstance(report, list)
    assert len(report) == 2
    assert report[0]["udf_error"] == "SyntaxError: Unexpected token C"


def test_replay_dlq_with_auto_repair(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """Verifies replay-dlq --auto-repair wraps payloads into textPayload."""
    mock_dlq = [
        {
            "message_id": "dlq-201",
            "data": "UNPARSEABLE_LOG_LINE_XYZ",
            "attributes": {"udf_error": "SyntaxError: Invalid JSON"},
        }
    ]
    mock_file = tmp_path / "dlq_to_repair.json"
    mock_file.write_text(json.dumps(mock_dlq), encoding="utf-8")
    repaired_file = tmp_path / "repaired_output.jsonl"

    ret = main(
        [
            "replay-dlq",
            "--mock-file",
            str(mock_file),
            "--output-file",
            str(repaired_file),
            "--auto-repair",
            "--format",
            "json",
        ]
    )
    assert ret == 0
    captured = capsys.readouterr()
    summary = json.loads(captured.out)
    assert summary["repaired_count"] == 1

    repaired_txt = repaired_file.read_text(encoding="utf-8").strip()
    repaired_lines = repaired_txt.splitlines()
    assert len(repaired_lines) == 1
    repaired_item = json.loads(repaired_lines[0])
    assert "udf_error" not in repaired_item.get("attributes", {})
    assert repaired_item["severity"] == "WARNING"
    assert repaired_item["textPayload"] == "UNPARSEABLE_LOG_LINE_XYZ"


def test_analyze_savings_financial_calculations() -> None:
    """Verifies FinOps savings calculation accuracy for 100 GB/day."""
    report = calculate_finops_savings(
        daily_gb=100.0,
        retention_days=365,
        default_exclusion_pct=80.0,
    )
    assert report["monthly_volume_gb"] == 3000.0
    assert report["baseline_monthly_cost_usd"] == 1500.0
    assert report["optimized_monthly_cost_usd"] < 375.0
    assert report["monthly_savings_usd"] > 1125.0
    assert report["savings_percentage"] > 75.0


def test_analyze_savings_invalid_inputs_exit_code_2() -> None:
    """Verifies zero or negative inputs to analyze-savings exit with code 2."""
    for invalid_args in [
        ["analyze-savings", "--daily-gb", "0"],
        ["analyze-savings", "--daily-gb", "-10.5"],
        ["analyze-savings", "--daily-gb", "50", "--retention-days", "0"],
        [
            "analyze-savings",
            "--daily-gb",
            "50",
            "--default-exclusion-pct",
            "120",
        ],
    ]:
        proc = subprocess.run(
            [sys.executable, str(CLI_SCRIPT)] + invalid_args,
            capture_output=True,
            text=True,
        )
        assert (
            proc.returncode == 2
        ), f"Expected exit code 2 for {invalid_args}, got {proc.returncode}"
