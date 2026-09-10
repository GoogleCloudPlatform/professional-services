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
"""Empirical test coverage reporter using Python standard library trace instrumentation.

Provides deterministic, offline line coverage auditing across agent_builder_to_adk.
"""

from __future__ import annotations

import os
from pathlib import Path
import sys
import trace

import pytest

_PACKAGE_ROOT = Path(__file__).resolve().parent.parent
_PKG_DIR = _PACKAGE_ROOT / "agent_builder_to_adk"


def get_bytecode_lines(file_path: Path) -> set[int]:
    """Extracts executable statement line numbers from compiled bytecode."""
    with open(file_path, "r", encoding="utf-8") as f:
        code_obj = compile(f.read(), str(file_path), "exec")
    lines: set[int] = set()

    def walk_code(co):
        for _, _, line_no in co.co_lines():
            if line_no is not None and line_no > 0:
                lines.add(line_no)
        for const in co.co_consts:
            if hasattr(const, "co_lines"):
                walk_code(const)

    walk_code(code_obj)
    return lines


def run_coverage(threshold: float = 90.0) -> int:
    """Executes pytest under trace instrumentation and asserts coverage threshold."""
    py_files = sorted(list(_PKG_DIR.rglob("*.py")))
    lines_map = {f.resolve(): get_bytecode_lines(f) for f in py_files}

    tracer = trace.Trace(count=1, trace=0)
    ret_code = tracer.runfunc(pytest.main, ["-q", str(_PACKAGE_ROOT / "tests")])
    res = tracer.results()

    executed_map: dict[Path, set[int]] = {}
    for (filename, lineno) in res.counts:
        resolved = Path(filename).resolve()
        if resolved in lines_map:
            executed_map.setdefault(resolved, set()).add(lineno)

    print("\n" + "=" * 80)
    print(f"{'Module':<42} {'Stmts':>7} {'Miss':>7} {'Cover':>8}")
    print("-" * 80)

    total_stmts = 0
    total_missed = 0

    for py_file in py_files:
        resolved = py_file.resolve()
        stmts = len(lines_map[resolved])
        executed = len(lines_map[resolved] & executed_map.get(resolved, set()))
        missed = stmts - executed
        pct = (executed / stmts * 100.0) if stmts else 100.0
        rel_path = py_file.relative_to(_PACKAGE_ROOT)

        total_stmts += stmts
        total_missed += missed

        print(f"{str(rel_path):<42} {stmts:>7} {missed:>7} {pct:>7.1f}%")

    print("-" * 80)
    total_executed = total_stmts - total_missed
    total_pct = (total_executed / total_stmts * 100.0) if total_stmts else 100.0
    print(f"{'TOTAL':<42} {total_stmts:>7} {total_missed:>7} {total_pct:>7.1f}%")
    print("=" * 80)

    if ret_code != 0:
        print(f"\n[FAIL] Pytest run exited with non-zero code: {ret_code}")
        return 1

    if total_pct < threshold:
        print(f"\n[FAIL] Total coverage {total_pct:.1f}% is below required {threshold:.1f}% threshold.")
        return 1

    print(f"\n[PASS] Total coverage {total_pct:.1f}% satisfies the >={threshold:.1f}% requirement.")
    return 0


if __name__ == "__main__":
    sys.exit(run_coverage())
