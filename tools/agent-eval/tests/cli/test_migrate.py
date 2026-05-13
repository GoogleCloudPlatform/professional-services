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
"""Tests for `agent-eval migrate` and the underlying `migrate_legacy` helper."""

import json
import tempfile
import unittest
from pathlib import Path

from click.testing import CliRunner

from agent_eval.cli.commands.migrate import migrate
from agent_eval.core.dataset_io import _find_legacy_eval_dir, migrate_legacy


def _seed_legacy_layout(root: Path, *, nest_under_app: bool = False) -> Path:
    """Create a legacy eval/ tree with scenarios + golden + metrics files."""
    base = root / "app" / "eval" if nest_under_app else root / "eval"
    (base / "scenarios").mkdir(parents=True)
    (base / "eval_data").mkdir(parents=True)
    (base / "metrics").mkdir(parents=True)

    (base / "scenarios" / "conversation_scenarios.json").write_text(
        json.dumps({
            "scenarios": [{
                "starting_prompt": "Plan a trip",
                "conversation_plan": "Then refine"
            },],
        }))
    (base / "scenarios" / "session_input.json").write_text(
        json.dumps({
            "app_name": "my_app",
            "user_id": "eval_user",
            "state": {},
        }))
    (base / "eval_data" / "golden_dataset.json").write_text(
        json.dumps({
            "golden_questions": [{
                "user_inputs": ["What's the weather?"],
                "reference_data": {
                    "expected_behavior": "Foggy"
                },
            },],
        }))
    (base / "metrics" / "metric_definitions.json").write_text(
        json.dumps({
            "general_quality": {
                "type": "managed"
            },
        }))
    return base


class TestFindLegacyEvalDir(unittest.TestCase):

    def test_detects_flat_layout(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root, nest_under_app=False)
            assert _find_legacy_eval_dir(root) == root / "eval"

    def test_detects_app_nested_layout(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root, nest_under_app=True)
            assert _find_legacy_eval_dir(root) == root / "app" / "eval"

    def test_returns_none_when_missing(self):
        with tempfile.TemporaryDirectory() as td:
            assert _find_legacy_eval_dir(Path(td)) is None


class TestMigrateLegacy(unittest.TestCase):

    def test_writes_unified_dataset_with_rows_from_both_sources(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root)
            summary = migrate_legacy(root)

            out = Path(summary["output_path"])
            rows = [json.loads(l) for l in out.read_text().splitlines() if l]
            assert summary["scenario_rows"] == 1
            assert summary["golden_rows"] == 1
            assert summary["total_rows"] == 2
            assert rows[0]["prompt"] == "Plan a trip"
            assert rows[0]["session_inputs"]["app_name"] == "my_app"
            assert rows[1]["prompt"] == "What's the weather?"
            assert rows[1]["reference"] == "Foggy"

    def test_copies_metric_definitions(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root)
            summary = migrate_legacy(root)

            dst = Path(summary["metrics_copied"])
            assert dst == root / "tests" / "eval" / "metrics" / "metric_definitions.json"
            assert json.loads(dst.read_text()) == {
                "general_quality": {
                    "type": "managed"
                }
            }

    def test_creates_backup_by_default(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root)
            summary = migrate_legacy(root)

            backup = Path(summary["backup_dir"])
            assert backup.exists()
            assert (backup / "scenarios" /
                    "conversation_scenarios.json").exists()
            assert (backup / "eval_data" / "golden_dataset.json").exists()
            assert (backup / "metrics" / "metric_definitions.json").exists()

    def test_no_backup_when_disabled(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root)
            summary = migrate_legacy(root, backup=False)
            assert summary["backup_dir"] is None
            assert not (root / "tests" / "eval" / ".backup").exists()

    def test_handles_missing_legacy_folder(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            summary = migrate_legacy(root)
            assert summary["total_rows"] == 0
            assert summary["legacy_eval_dir"] is None


class TestMigrateCommand(unittest.TestCase):

    def test_command_writes_files_and_prints_summary(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root)
            runner = CliRunner()
            result = runner.invoke(migrate, ["--agent-dir", str(root)])

            assert result.exit_code == 0, result.output
            assert "Migration complete" in result.output
            out = root / "tests" / "eval" / "dataset.jsonl"
            assert out.exists()
            assert len(out.read_text().splitlines()) == 2

    def test_dry_run_writes_nothing(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            _seed_legacy_layout(root)
            runner = CliRunner()
            result = runner.invoke(
                migrate, ["--agent-dir", str(root), "--dry-run"])

            assert result.exit_code == 0, result.output
            assert "Dry run" in result.output
            assert not (root / "tests" / "eval" / "dataset.jsonl").exists()

    def test_no_legacy_folder_exits_cleanly(self):
        with tempfile.TemporaryDirectory() as td:
            runner = CliRunner()
            result = runner.invoke(migrate, ["--agent-dir", td])
            assert result.exit_code == 0, result.output
            assert "Nothing to migrate" in result.output


if __name__ == "__main__":
    unittest.main()
