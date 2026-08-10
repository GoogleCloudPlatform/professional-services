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
"""Unit tests for the agent-eval skills CLI command."""

from pathlib import Path

import pytest
from click.testing import CliRunner

from agent_eval.cli.main import cli


@pytest.fixture
def temp_skills_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Fixture providing an isolated global skills directory."""
    global_skills_dir = tmp_path / "global_skills"
    global_skills_dir.mkdir()
    monkeypatch.setenv("GEMINI_SKILLS_DIR", str(global_skills_dir))
    return global_skills_dir


def test_skills_list():
    """Verify that agent-eval skills list outputs bundled skills table."""
    runner = CliRunner()
    result = runner.invoke(cli, ["skills", "list"])
    assert result.exit_code == 0
    assert "Bundled agent-eval Skills" in result.output
    assert "agent-eval" in result.output


def test_skills_install(temp_skills_env: Path):
    """Verify that agent-eval skills install symlinks skills to destination."""
    runner = CliRunner()
    result = runner.invoke(cli, ["skills", "install"])
    assert result.exit_code == 0
    assert "Successfully installed" in result.output

    installed_skill = temp_skills_env / "agent-eval"
    assert installed_skill.exists()
    assert (installed_skill / "SKILL.md").exists()


def test_skills_show():
    """Verify that agent-eval skills show displays skill markdown."""
    runner = CliRunner()
    result = runner.invoke(cli, ["skills", "show", "agent-eval"])
    assert result.exit_code == 0
    assert "Agent Evaluation & GCS Registry Framework" in result.output
