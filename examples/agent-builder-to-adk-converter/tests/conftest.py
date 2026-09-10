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
"""Pytest fixtures and configuration for Agent Builder to ADK Converter test suite.

Provides 100% offline test infrastructure:
- AST compilation assertion helper verifying zero SyntaxErrors and zero SyntaxWarnings.
- Offline mock infrastructure for google.antigravity SDK.
- Fixture path and loaded payload providers across linear, branching, multi-agent,
  approval, and malformed workflow topologies.
"""

from __future__ import annotations

import ast
import json
from pathlib import Path
import sys
from typing import Any
from unittest.mock import MagicMock
import warnings

import pytest

# Ensure package root is in sys.path for direct imports
_PACKAGE_ROOT = Path(__file__).resolve().parent.parent
if str(_PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(_PACKAGE_ROOT))

# Setup offline mock for google.antigravity if not present
if "google.antigravity" not in sys.modules:
    mock_antigravity = MagicMock()
    mock_antigravity.__name__ = "google.antigravity"

    class _MockAgent:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            self.args = args
            self.kwargs = kwargs

    class _MockLocalAgentConfig:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            self.args = args
            self.kwargs = kwargs

    class _MockAskQuestionHook:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            self.args = args
            self.kwargs = kwargs

    mock_antigravity.Agent = _MockAgent
    mock_antigravity.LlmAgent = _MockAgent
    mock_antigravity.LocalAgentConfig = _MockLocalAgentConfig
    mock_antigravity.AskQuestionHook = _MockAskQuestionHook
    mock_antigravity.types = MagicMock()

    # Ensure parent namespace exists
    if "google" not in sys.modules:
        mock_google = MagicMock()
        mock_google.__name__ = "google"
        mock_google.antigravity = mock_antigravity
        sys.modules["google"] = mock_google
    else:
        sys.modules["google"].antigravity = mock_antigravity

    sys.modules["google.antigravity"] = mock_antigravity


def assert_ast_compiles(source_code: str, filename: str = "<generated_adk_code>") -> ast.AST:
    """Parses and compiles Python source code, asserting zero SyntaxErrors and SyntaxWarnings.

    Args:
        source_code: The Python source code string to compile.
        filename: Optional filename identifier for syntax tracking.

    Returns:
        The compiled ast.AST tree.

    Raises:
        AssertionError: If parsing fails or emits SyntaxWarnings.
    """
    assert isinstance(source_code, str), f"Expected str source code, got {type(source_code)}"
    assert len(source_code.strip()) > 0, "Source code cannot be empty"

    with warnings.catch_warnings(record=True) as recorded_warnings:
        warnings.simplefilter("always", SyntaxWarning)
        tree = ast.parse(source_code, filename=filename)
        # Bytecode compile mode='exec' to guarantee runnable code
        compile(tree, filename=filename, mode="exec")

        syntax_warnings = [w for w in recorded_warnings if issubclass(w.category, SyntaxWarning)]
        assert not syntax_warnings, (
            f"Generated code emitted SyntaxWarnings under Python {sys.version}: "
            f"{[str(w.message) for w in syntax_warnings]}\nSource:\n{source_code}"
        )

    return tree


@pytest.fixture(scope="session")
def fixtures_dir() -> Path:
    """Returns absolute Path to tests/fixtures directory."""
    return Path(__file__).resolve().parent / "fixtures"


@pytest.fixture(scope="session")
def sample_workflows_dir(fixtures_dir: Path) -> Path:
    """Returns absolute Path to tests/fixtures/sample_workflows directory."""
    return fixtures_dir / "sample_workflows"


# --- Valid Fixture Paths & Payloads ---


@pytest.fixture(scope="session")
def valid_linear_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "valid_linear.json"


@pytest.fixture(scope="session")
def valid_linear_data(valid_linear_path: Path) -> dict[str, Any]:
    with open(valid_linear_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def valid_branching_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "valid_branching.json"


@pytest.fixture(scope="session")
def valid_branching_data(valid_branching_path: Path) -> dict[str, Any]:
    with open(valid_branching_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def valid_multi_agent_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "valid_multi_agent.json"


@pytest.fixture(scope="session")
def valid_multi_agent_data(valid_multi_agent_path: Path) -> dict[str, Any]:
    with open(valid_multi_agent_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def valid_approval_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "valid_approval.json"


@pytest.fixture(scope="session")
def valid_approval_data(valid_approval_path: Path) -> dict[str, Any]:
    with open(valid_approval_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def complex_trade_finance_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "complex_trade_finance.json"


@pytest.fixture(scope="session")
def complex_trade_finance_data(complex_trade_finance_path: Path) -> dict[str, Any]:
    with open(complex_trade_finance_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def swift_mt700_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "swift_mt700.json"


@pytest.fixture(scope="session")
def swift_mt700_data(swift_mt700_path: Path) -> dict[str, Any]:
    with open(swift_mt700_path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- Malformed Fixture Paths & Payloads ---


@pytest.fixture(scope="session")
def malformed_syntax_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "malformed_syntax.json"


@pytest.fixture(scope="session")
def malformed_syntax_text(malformed_syntax_path: Path) -> str:
    with open(malformed_syntax_path, "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture(scope="session")
def malformed_missing_flow_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "malformed_missing_flow.json"


@pytest.fixture(scope="session")
def malformed_missing_flow_data(malformed_missing_flow_path: Path) -> dict[str, Any]:
    with open(malformed_missing_flow_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def malformed_invalid_edges_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "malformed_invalid_edges.json"


@pytest.fixture(scope="session")
def malformed_invalid_edges_data(malformed_invalid_edges_path: Path) -> dict[str, Any]:
    with open(malformed_invalid_edges_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def malformed_invalid_schema_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "malformed_invalid_schema.json"


@pytest.fixture(scope="session")
def malformed_invalid_schema_data(malformed_invalid_schema_path: Path) -> dict[str, Any]:
    with open(malformed_invalid_schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def malformed_cyclic_path(fixtures_dir: Path) -> Path:
    return fixtures_dir / "malformed_cyclic.json"


@pytest.fixture(scope="session")
def malformed_cyclic_data(malformed_cyclic_path: Path) -> dict[str, Any]:
    with open(malformed_cyclic_path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- Bundled Sample Workflows ---


@pytest.fixture(scope="session")
def sample_customer_support_path(sample_workflows_dir: Path) -> Path:
    return sample_workflows_dir / "customer_support_agent.json"


@pytest.fixture(scope="session")
def sample_customer_support_data(sample_customer_support_path: Path) -> dict[str, Any]:
    with open(sample_customer_support_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def sample_travel_booking_path(sample_workflows_dir: Path) -> Path:
    return sample_workflows_dir / "travel_booking_agent.json"


@pytest.fixture(scope="session")
def sample_travel_booking_data(sample_travel_booking_path: Path) -> dict[str, Any]:
    with open(sample_travel_booking_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def sample_document_approver_path(sample_workflows_dir: Path) -> Path:
    return sample_workflows_dir / "document_approver_agent.json"


@pytest.fixture(scope="session")
def sample_document_approver_data(sample_document_approver_path: Path) -> dict[str, Any]:
    with open(sample_document_approver_path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- Aggregate Collections ---


@pytest.fixture(scope="session")
def all_valid_fixture_paths(
    valid_linear_path: Path,
    valid_branching_path: Path,
    valid_multi_agent_path: Path,
    valid_approval_path: Path,
    complex_trade_finance_path: Path,
    swift_mt700_path: Path,
    sample_customer_support_path: Path,
    sample_travel_booking_path: Path,
    sample_document_approver_path: Path,
) -> list[Path]:
    """Returns list of all valid workflow fixture paths."""
    return [
        valid_linear_path,
        valid_branching_path,
        valid_multi_agent_path,
        valid_approval_path,
        complex_trade_finance_path,
        swift_mt700_path,
        sample_customer_support_path,
        sample_travel_booking_path,
        sample_document_approver_path,
    ]


@pytest.fixture(scope="session")
def all_sample_workflow_paths(
    sample_customer_support_path: Path,
    sample_travel_booking_path: Path,
    sample_document_approver_path: Path,
) -> list[Path]:
    """Returns list of 3 bundled sample workflow paths."""
    return [
        sample_customer_support_path,
        sample_travel_booking_path,
        sample_document_approver_path,
    ]


@pytest.fixture(scope="session")
def all_malformed_fixture_paths(
    malformed_syntax_path: Path,
    malformed_missing_flow_path: Path,
    malformed_invalid_edges_path: Path,
    malformed_invalid_schema_path: Path,
    malformed_cyclic_path: Path,
) -> list[Path]:
    """Returns list of all malformed workflow fixture paths."""
    return [
        malformed_syntax_path,
        malformed_missing_flow_path,
        malformed_invalid_edges_path,
        malformed_invalid_schema_path,
        malformed_cyclic_path,
    ]
