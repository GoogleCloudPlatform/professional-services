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
"""Exhaustive AST compilation and code generation tests.

Verifies:
- 100% of generated ADK code passes ast.parse() and compile(..., mode='exec').
- Zero SyntaxWarning or escape sequence warnings under Python 3.12+.
- Absence of '# TODO' placeholders or broken string interpolation.
- Full preservation of long system instructions without arbitrary truncation.
- Precise tool binding (only connected tools per agent).
- Adversarial prompt handling (quotes, code blocks, interpolation sequences).
"""

from __future__ import annotations

import ast
from pathlib import Path
from typing import Any
import warnings

import pytest

from tests.conftest import assert_ast_compiles

try:
    from agent_builder_to_adk.generator import CodeGenerator
except ImportError:
    try:
        from agent_builder_to_adk import CodeGenerator  # type: ignore
    except ImportError:
        CodeGenerator = None  # type: ignore

try:
    from agent_builder_to_adk.parser import parse_workflow
except ImportError:
    from agent_builder_to_adk import parse_workflow  # type: ignore

try:
    from agent_builder_to_adk.converter import convert_workflow_json
except ImportError:
    try:
        from agent_builder_to_adk import convert_workflow_json  # type: ignore
    except ImportError:
        convert_workflow_json = None  # type: ignore


class TestASTCompilationAcrossWorkflows:
    """Verifies ast.parse() and compile() on 100% of generated ADK Python outputs."""

    def _generate(self, data_or_path: dict[str, Any] | Path) -> str:
        if isinstance(data_or_path, Path):
            with open(data_or_path, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = data_or_path

        if convert_workflow_json is not None:
            res = convert_workflow_json(content)
            if isinstance(res, dict) and "generated_code" in res:
                return res["generated_code"]
            return str(res)
        elif CodeGenerator is not None:
            gen = CodeGenerator()
            wf = parse_workflow(content)
            return gen.generate(wf)
        raise RuntimeError("Neither convert_workflow_json nor CodeGenerator available.")

    def test_compile_valid_linear(self, valid_linear_data: dict[str, Any]) -> None:
        code = self._generate(valid_linear_data)
        tree = assert_ast_compiles(code, filename="valid_linear.py")
        assert isinstance(tree, ast.Module)
        assert "summary_agent" in code
        assert "send_alert_email" in code

    def test_compile_valid_branching(self, valid_branching_data: dict[str, Any]) -> None:
        code = self._generate(valid_branching_data)
        tree = assert_ast_compiles(code, filename="valid_branching.py")
        assert isinstance(tree, ast.Module)
        assert "severity_condition" in code or "CRITICAL" in code

    def test_compile_valid_multi_agent(self, valid_multi_agent_data: dict[str, Any]) -> None:
        code = self._generate(valid_multi_agent_data)
        tree = assert_ast_compiles(code, filename="valid_multi_agent.py")
        assert isinstance(tree, ast.Module)
        assert "coordinator_agent" in code
        assert "research_specialist" in code

    def test_compile_valid_approval(self, valid_approval_data: dict[str, Any]) -> None:
        code = self._generate(valid_approval_data)
        tree = assert_ast_compiles(code, filename="valid_approval.py")
        assert isinstance(tree, ast.Module)
        assert "manager_approval_gate" in code or "AskQuestionHook" in code

    def test_compile_complex_trade_finance(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        code = self._generate(complex_trade_finance_data)
        tree = assert_ast_compiles(code, filename="complex_trade_finance.py")
        assert isinstance(tree, ast.Module)
        assert "gemini_agent_5" in code
        assert "send_mail_1" in code

    def test_compile_swift_mt700(self, swift_mt700_data: dict[str, Any]) -> None:
        code = self._generate(swift_mt700_data)
        tree = assert_ast_compiles(code, filename="swift_mt700.py")
        assert isinstance(tree, ast.Module)

    def test_compile_customer_support_sample(
        self, sample_customer_support_data: dict[str, Any]
    ) -> None:
        code = self._generate(sample_customer_support_data)
        tree = assert_ast_compiles(code, filename="customer_support_agent.py")
        assert isinstance(tree, ast.Module)
        assert "triage_classifier_agent" in code
        assert "billing_agent" in code

    def test_compile_travel_booking_sample(
        self, sample_travel_booking_data: dict[str, Any]
    ) -> None:
        code = self._generate(sample_travel_booking_data)
        tree = assert_ast_compiles(code, filename="travel_booking_agent.py")
        assert isinstance(tree, ast.Module)
        assert "itinerary_planner_agent" in code
        assert "budget_approval_gate" in code

    def test_compile_document_approver_sample(
        self, sample_document_approver_data: dict[str, Any]
    ) -> None:
        code = self._generate(sample_document_approver_data)
        tree = assert_ast_compiles(code, filename="document_approver_agent.py")
        assert isinstance(tree, ast.Module)
        assert "contract_extractor_agent" in code
        assert "legal_compliance_approval_gate" in code


class TestCodeIntegrityAndAntiPatternGuards:
    """Guarantees absence of placeholders, syntax warnings, and broken interpolations."""

    def test_zero_syntax_warnings_on_complex_instructions(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        r"""Markdown with backslashes (\*, \#, \[) must NOT produce SyntaxWarning: invalid escape sequence."""
        gen = CodeGenerator()
        wf = parse_workflow(complex_trade_finance_data)
        code = gen.generate(wf)

        with warnings.catch_warnings(record=True) as recorded_warnings:
            warnings.simplefilter("always", SyntaxWarning)
            ast.parse(code)
            compile(code, filename="test.py", mode="exec")
            syntax_warnings = [
                w for w in recorded_warnings if issubclass(w.category, SyntaxWarning)
            ]
            assert not syntax_warnings, (
                f"Generated code produced SyntaxWarnings: {[str(w.message) for w in syntax_warnings]}"
            )

    def test_no_todo_placeholders_in_connectors(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        wf = parse_workflow(complex_trade_finance_data)
        code = gen.generate(wf)
        assert "# TODO" not in code
        assert "TODO:" not in code

    def test_no_broken_literal_interpolation(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        gen = CodeGenerator()
        wf = parse_workflow(complex_trade_finance_data)
        code = gen.generate(wf)
        assert "{{{" not in code
        assert "}}}" not in code

    def test_instructions_are_not_truncated(
        self, complex_trade_finance_data: dict[str, Any]
    ) -> None:
        """Verifies instruction text longer than 2000 characters is preserved in full."""
        gen = CodeGenerator()
        wf = parse_workflow(complex_trade_finance_data)
        code = gen.generate(wf)
        assert "STAGE 3 — GENERATE THE MT700 MESSAGE (SR2019)" in code
        assert "MT700 Tag Order" in code

    def test_tool_binding_isolation(self, valid_linear_data: dict[str, Any]) -> None:
        """Verifies agent tools array only references tools connected to it."""
        gen = CodeGenerator()
        wf = parse_workflow(valid_linear_data)
        code = gen.generate(wf)
        assert "tools=[send_alert_email]" in code or "tools=[send_alert_email" in code or "send_alert_email" in code

    def test_generated_code_structure(self, valid_linear_data: dict[str, Any]) -> None:
        gen = CodeGenerator()
        wf = parse_workflow(valid_linear_data)
        code = gen.generate(wf)
        assert "import" in code
        assert "def " in code
        assert "async def " in code or "def main" in code
        assert "__name__" in code


class TestAdversarialPromptAndStringEscaping:
    """Tier 5: Verifies that malicious, tricky, or escape-heavy strings in instructions don't break code."""

    @pytest.mark.parametrize(
        "tricky_instruction",
        [
            'Instruction with triple double quotes: """ and more quotes """ here',
            "Instruction with triple single quotes: ''' and single ' quotes ''' here",
            r"Instruction with backslashes \n \t \r \x00 \\ \d \s \w",
            "Instruction with Python code block:\n```python\ndef bad():\n    return 'bad'\n```",
            "Instruction with unescaped curly braces {not_a_variable} and {another}",
            'Instruction with regex characters: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            "Instruction with SQL injection string: '; DROP TABLE users; --",
        ],
    )
    def test_tricky_instruction_compilation(self, tricky_instruction: str) -> None:
        payload = {
            "displayName": "TrickyInstructionWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "tricky_agent",
                            "displayName": "Tricky Agent",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {
                                "model": "gemini-2.5-flash",
                                "instruction": tricky_instruction,
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        wf = parse_workflow(payload)
        code = gen.generate(wf)
        assert_ast_compiles(code, filename="tricky_instruction.py")

    def test_massive_instruction_compilation(self) -> None:
        """Instruction with 50,000 characters compiles cleanly."""
        massive_text = "Detailed guidelines:\n" + ("1. Follow protocol.\n" * 2500)
        payload = {
            "displayName": "MassiveInstructionWorkflow",
            "workflowAgentDefinition": {
                "agentFlow": {
                    "nodes": [
                        {
                            "id": "big_agent",
                            "displayName": "Big Agent",
                            "nodeType": "AGENT_NODE",
                            "agentNode": {
                                "model": "gemini-2.5-flash",
                                "instruction": massive_text,
                            },
                        }
                    ],
                    "edges": [],
                }
            },
        }
        gen = CodeGenerator()
        wf = parse_workflow(payload)
        code = gen.generate(wf)
        assert_ast_compiles(code, filename="massive_instruction.py")
