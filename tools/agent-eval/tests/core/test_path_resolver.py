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
"""Tests for ``core.path_resolver`` — canonical/legacy eval-folder discovery."""

import tempfile
import unittest
from pathlib import Path

from agent_eval.core.path_resolver import (
    find_dataset_path,
    find_eval_dir,
    find_metrics_path,
)


def _touch(path: Path, content: str = "{}") -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return path


class TestFindEvalDir(unittest.TestCase):

    def test_prefers_canonical_tests_eval(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "tests" / "eval").mkdir(parents=True)
            (root / "eval").mkdir(parents=True)
            assert find_eval_dir(root) == root / "tests" / "eval"

    def test_falls_back_to_legacy_flat(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "eval").mkdir(parents=True)
            assert find_eval_dir(root) == root / "eval"

    def test_falls_back_to_legacy_nested_under_app(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "app" / "eval").mkdir(parents=True)
            assert find_eval_dir(root) == root / "app" / "eval"

    def test_returns_canonical_default_when_nothing_exists(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            assert find_eval_dir(root) == root / "tests" / "eval"


class TestFindMetricsPath(unittest.TestCase):

    def test_finds_canonical_metrics(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            target = _touch(root / "tests" / "eval" / "metrics" /
                            "metric_definitions.json")
            assert find_metrics_path(root) == target

    def test_falls_back_to_legacy_metrics(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            target = _touch(root / "eval" / "metrics" /
                            "metric_definitions.json")
            assert find_metrics_path(root) == target

    def test_returns_none_when_missing(self):
        with tempfile.TemporaryDirectory() as td:
            assert find_metrics_path(Path(td)) is None


class TestFindDatasetPath(unittest.TestCase):

    def test_finds_canonical_dataset(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            target = _touch(root / "tests" / "eval" / "dataset.jsonl",
                            '{"prompt": "x"}\n')
            assert find_dataset_path(root) == target

    def test_returns_none_when_missing(self):
        with tempfile.TemporaryDirectory() as td:
            assert find_dataset_path(Path(td)) is None


if __name__ == "__main__":
    unittest.main()
