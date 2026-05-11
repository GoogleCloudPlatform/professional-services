# Copyright 2024 Google LLC
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
"""Builds the prompt for the Gemini analysis report."""

from __future__ import annotations

import json
from typing import Any, Dict, Optional


class GeminiAnalysisPrompter:
    """Constructs a detailed prompt for the Gemini analysis report."""

    # Default values
    DEFAULT_AUDIENCE = "technical stakeholders"
    DEFAULT_TONE = "objective, analytical, and professional"
    DEFAULT_LENGTH = "comprehensive"

    BASE_TEMPLATE = """
You are an expert AI evaluation analyst. Your task is to produce a deep technical diagnosis of an AI agent's performance for {audience}.

**Tone:** {tone}
**Report Length:** {length}

{focus_section}

{custom_strategy_section}

**CRITICAL INSTRUCTIONS:**
1.  **Diagnose AND Recommend:** Your primary goal is to explain *why* the metrics are what they are. Then, provide actionable recommendations using the ADK Design Patterns reference below. Each recommendation must cite a specific pattern and include a code example.
2.  **Synthesize, Don't Summarize:** Do not simply repeat the scores. Your value is in synthesizing insights by connecting the metric scores, the metric definitions, the source code, and the raw explanations.
3.  **Reference Your Sources:** When you make a claim or analyze a metric, you MUST reference the specific source file (e.g., `metric_definitions.json`, `deterministic_metrics.py`, `agent.py`).
4.  **Analyze Calculation Methods:** For each metric you discuss, you MUST explain how its calculation method (deterministic vs. LLM-judged) influences its interpretation.
5.  **Cite Quantitative and Qualitative Evidence:** You MUST quote specific examples from the conversation logs (user inputs, tool calls, or agent responses) AND cite the corresponding metric scores to justify your findings. Don't just say "the agent failed"; say "The agent's score of 1.2 on `tool_usage_accuracy` is justified by question `q_billing_01`, where it failed to call `lookup_invoice` despite the user explicitly asking for it."
6.  **If a developer focus is provided:** Dedicate the opening section of your report to the focus area before proceeding with the general analysis. Highlight metrics, code patterns, and evidence most relevant to the developer's priority.

---

**Context for Your Analysis**

You are provided with the following context files to perform your diagnosis. Use them to connect the agent's behavior (the metrics) to its underlying implementation (the code).

**1. Overall Performance Data:**
*   **Evaluation Summary:** High-level average scores for all metrics. Use this to identify the most significant areas of success and failure.
{summary_section}

*   **Detailed Explanations:** Raw, detailed explanations from the LLM judge for each metric on a per-question basis. Use this to find patterns in *why* a metric scored high or low.
{explanations_section}

**2. Metric Calculation & Definitions:**
*   **Metric Definitions:** The rubrics and descriptions for each metric. You MUST use these files to understand what each metric is actually measuring and whether it is `llm` judged or `deterministic`.
{metric_definitions_section}

*   **Deterministic Logic:** The Python code that calculates the deterministic metrics. Refer to this file to understand the precise logic behind scores for metrics like `token_usage` or `latency_metrics`.
{deterministic_logic_section}

**3. Agent Implementation Details:**
*   **Agent Source Code:** The source code for the agent being evaluated. This is your primary source for forming hypotheses about *why* the agent behaves a certain way.
{source_code_section}

**4. Evaluation Questions:**
*   **Questions Evaluated:** The full set of questions used in the evaluation. This can provide context if certain types of questions are causing specific failures.
{questions_section}

**5. ADK Design Patterns Reference:**
*   **Optimization Patterns:** Use these ADK-specific patterns to provide actionable recommendations. Map each diagnosed issue to a concrete pattern with code examples.
{adk_patterns_section}

---
**FINAL SECTION REQUIREMENT:** End your report with a **## Recommended Next Steps** section. For each recommendation:
1. Name the optimization pillar (Offload, Reduce, Retrieve, Isolate, or Cache)
2. Reference the specific ADK pattern from the reference above
3. Provide a concrete code change the developer can make
4. Predict the expected metric impact (e.g., "should reduce `latency_metrics.total_latency_seconds` by ~30%")

Format your entire response as a single Markdown document.
"""

    COMPARISON_TEMPLATE = """
You are an expert evaluating how an AI agent's performance changed between two evaluation runs.

Your task is to explain *what changed in the code* and *what was the impact on metrics*. This analysis will be appended to a cumulative optimization log that tracks the agent's improvement over time.

{focus_section}

**Baseline Run:** {baseline_run_name} (experiment: {baseline_id})
**Current Run:** {current_run_name} (experiment: {current_id})

---

**1. Metric Deltas:**

The following table shows how each metric changed. 🟢 = improvement, 🔴 = regression, ⚪ = neutral (<1% change).

{comparison_table}

**2. What Changed in the Code:**

{git_diff_section}

**3. Current Run Summary:**

```json
{current_summary}
```

**4. Agent Source Code:**

{source_code_section}

---

**Instructions:**
1.  Start with a **## What Changed** section: describe the code changes in plain language. What did the developer modify? Reference specific files, functions, or prompt changes from the git diff.
2.  Follow with an **## Impact Analysis** section: for each significant metric delta (🟢 or 🔴), explain *why* it changed. Connect the code change to the metric movement. Be specific — cite the metric name, the delta, and the code change that caused it.
3.  End with a **## Summary** section: 2-3 sentences summarizing the overall impact. Was this iteration a net positive? What should the developer focus on next?
4.  Use the emoji indicators (🟢/🔴/⚪) consistently throughout your analysis.

**Noise awareness — important:**
LLM-as-judge metric scores carry stochastic variance. With small dataset sizes (typical eval runs have ≤20 rows per metric) and binary or low-resolution rating scales, deltas under ±5% on a single LLM metric are usually noise from autorater variance, NOT real improvements or regressions. Treat them accordingly:
- For LLM metrics with small deltas (|Δ| < 5%) on small datasets, label them as "within noise" rather than calling them improvements/regressions. Do not propose code changes to "fix" a 1-3% LLM metric drift.
- Deterministic metrics (latency, tokens, cost, cache hits) are exact measurements — even small deltas are real.
- Large LLM deltas (|Δ| ≥ 10%) or consistent directional shifts across multiple related rubrics ARE meaningful signals worth investigating.

Format your entire response as a single Markdown document.
"""

    def __init__(
        self,
        summary_data: Dict[str, Any],
        analysis_content: str,
        context_files: Dict[str, str],
        question_file_path: str,
        consolidated_metrics_path: str,
        # Customizable parameters
        audience: Optional[str] = None,
        tone: Optional[str] = None,
        length: Optional[str] = None,
        custom_strategy_content: Optional[str] = None,
        focus_directive: Optional[str] = None,
    ):
        self.summary_data = summary_data
        self.analysis_content = analysis_content
        self.context_files = context_files
        self.question_file_path = question_file_path
        self.consolidated_metrics_path = consolidated_metrics_path

        self.audience = audience or self.DEFAULT_AUDIENCE
        self.tone = tone or self.DEFAULT_TONE
        self.length = length or self.DEFAULT_LENGTH
        self.custom_strategy_content = custom_strategy_content
        self.focus_directive = focus_directive

    def _format_context_section(self,
                                title: str,
                                content: str,
                                lang: str = "") -> str:
        return f"**{title}**\n```{lang}\n{content}\n```"

    def _format_code_section(self, file_path: str, lang: str = "python") -> str:
        content = self.context_files.get(
            file_path, f"Error: File '{file_path}' not found.")
        return self._format_context_section(f"File: `{file_path}`", content,
                                            lang)

    def _build_focus_section(self) -> str:
        """Build the focus directive section for prompts."""
        if not self.focus_directive:
            return ""
        return (
            "**DEVELOPER PRIORITY:**\n"
            f"The developer has indicated the following priority for this analysis:\n"
            f"> {self.focus_directive}\n\n"
            "Weight your analysis toward these areas. Highlight metrics, code patterns, "
            "and evidence that are most relevant to this priority.")

    def build_prompt(self) -> str:
        """Builds the final prompt string for Call 1 (current run diagnosis)."""
        summary_section = self._format_context_section(
            "Evaluation Summary", json.dumps(self.summary_data, indent=2),
            "json")

        explanations_section = (
            f"**Detailed Explanations per Metric:**\n{self.analysis_content}")

        metric_definitions_section = self._format_code_section(
            self.consolidated_metrics_path, "json")

        deterministic_logic_section = self._format_code_section(
            "evaluation/core/deterministic_metrics.py")

        # Dynamically include all .py files except deterministic_metrics.py
        source_code_parts = []
        for file_path in self.context_files:
            if (file_path.endswith(".py") and
                    "deterministic_metrics.py" not in file_path):
                source_code_parts.append(self._format_code_section(file_path))

        source_code_section = ("\n".join(source_code_parts) if source_code_parts
                               else "No agent source code provided.")

        questions_section = self._format_context_section(
            "Questions Evaluated",
            self.context_files.get(self.question_file_path,
                                   "Questions file not found."),
            "json",
        )

        # Format the custom strategy section if provided
        custom_strategy_section = ""
        if self.custom_strategy_content:
            custom_strategy_section = (
                f"**STRATEGIC FRAMEWORK:**\n"
                f"Please adhere to the following framework when analyzing the agent:\n\n"
                f"{self.custom_strategy_content}\n\n"
                f"---")

        # ADK optimization patterns
        from agent_eval.core.adk_optimization_patterns import ADK_OPTIMIZATION_PATTERNS
        adk_patterns_section = f"```markdown\n{ADK_OPTIMIZATION_PATTERNS}\n```"

        return self.BASE_TEMPLATE.format(
            audience=self.audience,
            tone=self.tone,
            length=self.length,
            focus_section=self._build_focus_section(),
            custom_strategy_section=custom_strategy_section,
            summary_section=summary_section,
            explanations_section=explanations_section,
            metric_definitions_section=metric_definitions_section,
            deterministic_logic_section=deterministic_logic_section,
            source_code_section=source_code_section,
            questions_section=questions_section,
            adk_patterns_section=adk_patterns_section,
        )

    def build_comparison_prompt(
        self,
        comparison_data: dict,
        comparison_table: str,
    ) -> str:
        """Builds the prompt for Call 2 (comparison analysis).

        Args:
            comparison_data: Output from compute_comparison().
            comparison_table: Pre-formatted markdown table from format_comparison_table().

        Returns:
            Prompt string for the comparison Gemini call.
        """
        # Git diff section
        git_diff = comparison_data.get("git_diff", "")
        if git_diff:
            git_diff_section = f"```diff\n{git_diff}\n```"
        else:
            b_git = comparison_data.get("baseline_git", {})
            c_git = comparison_data.get("current_git", {})
            if not b_git.get("commit") or not c_git.get("commit"):
                git_diff_section = (
                    "*No git information available. The runs were either made outside a git repo "
                    "or git info was not captured. Analyze metric changes based on the agent source code below.*"
                )
            elif b_git["commit"] == c_git["commit"]:
                git_diff_section = (
                    "*Both runs share the same git commit (`{}`). The metric changes are likely due "
                    "to non-determinism in LLM responses, not code changes.*".
                    format(b_git["commit"][:8]))
            else:
                git_diff_section = "*Git diff could not be computed between the two commits.*"

        # Agent source code
        source_code_parts = []
        for file_path in self.context_files:
            if file_path.endswith(
                    ".py") and "deterministic_metrics.py" not in file_path:
                source_code_parts.append(self._format_code_section(file_path))
        source_code_section = ("\n".join(source_code_parts) if source_code_parts
                               else "No agent source code provided.")

        # Current summary (compact)
        current_summary = json.dumps(self.summary_data.get(
            "overall_summary", {}),
                                     indent=2)

        return self.COMPARISON_TEMPLATE.format(
            focus_section=self._build_focus_section(),
            baseline_id=comparison_data.get("baseline_id", "unknown"),
            current_id=comparison_data.get("current_id", "unknown"),
            baseline_run_name=comparison_data.get(
                "baseline_run_name",
                comparison_data.get("baseline_id", "unknown")),
            current_run_name=comparison_data.get(
                "current_run_name", comparison_data.get("current_id",
                                                        "unknown")),
            comparison_table=comparison_table,
            git_diff_section=git_diff_section,
            current_summary=current_summary,
            source_code_section=source_code_section,
        )
