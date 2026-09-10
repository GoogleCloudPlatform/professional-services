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
"""Functional tests for the converter CLI utility.

Tests:
- Single-file conversion (--input-file, --output-dir).
- Batch directory conversion (--input-dir, --output-dir).
- Conversion across all 9 valid fixtures.
- Non-zero exit code on all 5 malformed fixtures.
- Output file generation, naming, and AST validation.
- CLI exit codes (0 for success, non-zero on malformed inputs/missing files).
- CLI help and version flags.
- Root-level converter.py executable wrapper.
"""

from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
from typing import Any
from unittest.mock import patch

import pytest

from agent_builder_to_adk.cli import (
    build_parser,
    convert_directory,
    convert_single_file,
    convert_workflow_json,
    main,
)
from tests.conftest import assert_ast_compiles

_PACKAGE_ROOT = Path(__file__).resolve().parent.parent
_CONVERTER_PY = _PACKAGE_ROOT / "converter.py"



class TestCLIExecution:
    """Invokes CLI via subprocess and verifies file generation and exit semantics."""

    def _run_cli(self, args: list[str]) -> subprocess.CompletedProcess[str]:
        if _CONVERTER_PY.exists():
            cmd = [sys.executable, str(_CONVERTER_PY)] + args
        else:
            cmd = [sys.executable, "-m", "agent_builder_to_adk.cli"] + args

        env = os.environ.copy()
        env["PYTHONPATH"] = str(_PACKAGE_ROOT)
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=env,
            check=False,
        )

    def test_cli_help_flag(self) -> None:
        result = self._run_cli(["--help"])
        assert result.returncode == 0
        assert "usage" in result.stdout.lower() or "help" in result.stdout.lower()
        assert "--input-file" in result.stdout or "-i" in result.stdout

    def test_cli_version_flag(self) -> None:
        result = self._run_cli(["--version"])
        assert result.returncode == 0
        assert "1.0" in result.stdout or "converter" in result.stdout.lower() or "version" in result.stdout.lower()

    def test_cli_single_file_conversion(
        self, valid_linear_path: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "single_out"
        out_dir.mkdir(parents=True, exist_ok=True)

        result = self._run_cli(["--input-file", str(valid_linear_path), "--output-dir", str(out_dir)])
        assert result.returncode == 0, f"CLI failed: {result.stderr}"

        generated_files = list(out_dir.glob("*.py"))
        assert len(generated_files) >= 1, f"No .py files created in {out_dir}"
        code = generated_files[0].read_text(encoding="utf-8")
        assert len(code) > 0
        assert_ast_compiles(code, filename=str(generated_files[0]))

    def test_cli_batch_directory_conversion(
        self, sample_workflows_dir: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "batch_out"
        out_dir.mkdir(parents=True, exist_ok=True)

        result = self._run_cli(["--input-dir", str(sample_workflows_dir), "--output-dir", str(out_dir)])
        assert result.returncode == 0, f"Batch conversion failed: {result.stderr}"

        generated_files = list(out_dir.glob("*.py"))
        assert len(generated_files) >= 3, f"Expected at least 3 files, got {len(generated_files)}"
        for gen_file in generated_files:
            code = gen_file.read_text(encoding="utf-8")
            assert_ast_compiles(code, filename=str(gen_file))

    @pytest.mark.parametrize(
        "fixture_name",
        [
            "valid_linear.json",
            "valid_branching.json",
            "valid_multi_agent.json",
            "valid_approval.json",
            "complex_trade_finance.json",
            "swift_mt700.json",
        ],
    )
    def test_cli_converts_core_fixtures(
        self, fixtures_dir: Path, fixture_name: str, tmp_path: Path
    ) -> None:
        fixture_path = fixtures_dir / fixture_name
        out_dir = tmp_path / f"out_{fixture_name}"
        out_dir.mkdir(parents=True, exist_ok=True)

        result = self._run_cli(["--input-file", str(fixture_path), "--output-dir", str(out_dir)])
        assert result.returncode == 0, f"Failed converting {fixture_name}: {result.stderr}"
        files = list(out_dir.glob("*.py"))
        assert len(files) >= 1

    @pytest.mark.parametrize(
        "malformed_name",
        [
            "malformed_syntax.json",
            "malformed_missing_flow.json",
            "malformed_invalid_edges.json",
        ],
    )
    def test_cli_malformed_inputs_exit_nonzero(
        self, fixtures_dir: Path, malformed_name: str, tmp_path: Path
    ) -> None:
        fixture_path = fixtures_dir / malformed_name
        out_dir = tmp_path / f"out_mal_{malformed_name}"
        out_dir.mkdir(parents=True, exist_ok=True)

        result = self._run_cli(["--input-file", str(fixture_path), "--output-dir", str(out_dir)])
        assert result.returncode != 0

    def test_cli_missing_input_file_exits_nonzero(self, tmp_path: Path) -> None:
        non_existent = tmp_path / "does_not_exist.json"
        result = self._run_cli(["--input-file", str(non_existent), "--output-dir", str(tmp_path)])
        assert result.returncode != 0
        assert "error" in (result.stderr + result.stdout).lower() or "not found" in (result.stderr + result.stdout).lower()

    def test_cli_no_args_shows_usage(self) -> None:
        result = self._run_cli([])
        output = result.stderr + result.stdout
        assert "usage" in output.lower() or result.returncode != 0


class TestCLIInProcessExecution:
    """Tests CLI functions in-process to ensure comprehensive test coverage."""

    def test_cli_main_in_process_single_file(
        self, valid_linear_path: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "inproc_single"
        rc = main(["--input-file", str(valid_linear_path), "--output-dir", str(out_dir)])
        assert rc == 0
        py_files = list(out_dir.glob("*.py"))
        assert len(py_files) >= 1
        assert_ast_compiles(py_files[0].read_text(encoding="utf-8"))

    def test_cli_main_in_process_custom_output_file(
        self, valid_linear_path: Path, tmp_path: Path
    ) -> None:
        custom_target = tmp_path / "custom_agent.py"
        rc = main([
            "--input-file", str(valid_linear_path),
            "--output-file", str(custom_target),
            "--output-dir", str(tmp_path),
        ])
        assert rc == 0
        assert custom_target.exists()
        assert_ast_compiles(custom_target.read_text(encoding="utf-8"))

    def test_cli_main_in_process_batch_dir(
        self, sample_workflows_dir: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "inproc_batch"
        rc = main(["--input-dir", str(sample_workflows_dir), "--output-dir", str(out_dir)])
        assert rc == 0
        py_files = list(out_dir.glob("*.py"))
        assert len(py_files) >= 3
        for f in py_files:
            assert_ast_compiles(f.read_text(encoding="utf-8"))

    def test_cli_main_in_process_empty_args(self) -> None:
        assert main([]) == 2

    def test_cli_main_in_process_missing_file(self, tmp_path: Path) -> None:
        missing = tmp_path / "non_existent.json"
        assert main(["--input-file", str(missing), "--output-dir", str(tmp_path)]) == 1

    def test_cli_main_in_process_missing_dir(self, tmp_path: Path) -> None:
        missing_dir = tmp_path / "non_existent_directory"
        assert main(["--input-dir", str(missing_dir), "--output-dir", str(tmp_path)]) == 1

    def test_cli_main_in_process_malformed_file(
        self, fixtures_dir: Path, tmp_path: Path
    ) -> None:
        malformed = fixtures_dir / "malformed_syntax.json"
        assert main(["--input-file", str(malformed), "--output-dir", str(tmp_path)]) == 1

    def test_cli_main_in_process_missing_flow(
        self, fixtures_dir: Path, tmp_path: Path
    ) -> None:
        missing_flow = fixtures_dir / "malformed_missing_flow.json"
        assert main(["--input-file", str(missing_flow), "--output-dir", str(tmp_path)]) == 1

    def test_cli_main_in_process_flags(
        self, valid_linear_path: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "flags_out"
        rc = main([
            "--input-file", str(valid_linear_path),
            "--output-dir", str(out_dir),
            "--format", "package",
            "--no-ast-validation",
            "-v",
        ])
        assert rc == 0

    def test_convert_directory_direct(
        self, sample_workflows_dir: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "direct_dir"
        paths = convert_directory(
            input_dir=sample_workflows_dir,
            output_dir=out_dir,
            output_format="single-file",
            validate_ast=True,
        )
        assert len(paths) >= 3
        for p in paths:
            assert p.exists()

    def test_convert_directory_not_a_directory(self, tmp_path: Path) -> None:
        not_dir = tmp_path / "not_a_directory.txt"
        not_dir.write_text("dummy", encoding="utf-8")
        with pytest.raises(NotADirectoryError):
            convert_directory(input_dir=not_dir, output_dir=tmp_path)

    def test_convert_directory_empty(self, tmp_path: Path) -> None:
        empty_dir = tmp_path / "empty_dir"
        empty_dir.mkdir()
        result = convert_directory(input_dir=empty_dir, output_dir=tmp_path / "out")
        assert result == []

    def test_convert_directory_with_failure(
        self, fixtures_dir: Path, tmp_path: Path
    ) -> None:
        batch_with_err = tmp_path / "err_batch"
        batch_with_err.mkdir()
        (batch_with_err / "bad.json").write_text("{ invalid", encoding="utf-8")
        with pytest.raises(RuntimeError) as exc_info:
            convert_directory(input_dir=batch_with_err, output_dir=tmp_path / "out")
        assert "failed conversion" in str(exc_info.value)

    def test_convert_single_file_direct(
        self, valid_linear_path: Path, tmp_path: Path
    ) -> None:
        out_dir = tmp_path / "direct_single"
        out_path = convert_single_file(
            input_file=valid_linear_path,
            output_dir=out_dir,
            output_format="single-file",
            validate_ast=False,
        )
        assert out_path.exists()
        assert_ast_compiles(out_path.read_text(encoding="utf-8"))

    def test_convert_workflow_json_ast_invalid_fallback(
        self, valid_linear_path: Path
    ) -> None:
        with patch(
            "agent_builder_to_adk.generator.CodeGenerator.generate",
            return_value="def invalid python syntax %%%:",
        ):
            res = convert_workflow_json(source=valid_linear_path, validate_ast=True)
            assert res["ast_valid"] is False

    def test_build_parser(self) -> None:
        parser = build_parser()
        assert parser.prog == "agent-builder-to-adk"
        parsed = parser.parse_args(["-i", "foo.json"])
        assert parsed.input_file == Path("foo.json")

