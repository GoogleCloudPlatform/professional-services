#!/usr/bin/env python3
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
"""Parses an agent-eval eval_summary.json file and generates a markdown summary matrix table across all evaluation dialogues."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def extract_explanation(obj: dict[str, Any]) -> str:
    """Extracts explanation or failed rubric reasoning from a metric object."""
    explanation = obj.get("explanation")
    if explanation:
        return str(explanation).replace("\n", " ").strip()
    verdicts = obj.get("rubric_verdicts", [])
    failed_reasons = []
    for v in verdicts:
        if isinstance(v, dict) and v.get("verdict") is False:
            reason = v.get("reasoning", "").replace("\n", " ").strip()
            if reason:
                failed_reasons.append(reason)
    if failed_reasons:
        return " | ".join(failed_reasons)
    return ""


def parse_summary(summary_path: str, output_path: str | None = None) -> str:
    try:
        with Path(summary_path).open(encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        sys.stderr.write(f"Error loading {summary_path}: {e}\n")
        sys.exit(1)

    questions: list[dict[str, Any]] = data.get("per_question_summary", [])
    if not questions:
        sys.stderr.write("No per_question_summary found in JSON.\n")
        sys.exit(1)

    lines = [
        "| Q# | Question ID | Metrics Score Summary | Key Observations & Judge Explanations |",
        "|---|---|---|---|",
    ]

    target_metrics = [
        "general_quality",
        "tool_use_quality",
        "hallucination",
        "ambiguity_handling",
        "adversarial_refusal_rate",
        "business_logic_adherence",
    ]

    for idx, q_data in enumerate(questions):
        q_id = q_data.get("question_id") or q_data.get(
            "canonical_id") or f"Q{idx+1}"
        metrics = q_data.get("llm_metrics") or q_data.get(
            "llm_based_metrics") or {}
        m_summary = []
        issues = []

        for m in target_metrics:
            if m in metrics:
                obj = metrics[m]
                val = obj.get("score", obj) if isinstance(obj, dict) else obj
                if isinstance(val, (int, float)):
                    m_summary.append(f"`{m}`={val:.2f}")
                    if val < 1.0 and isinstance(obj, dict):
                        exp = extract_explanation(obj)
                        if exp:
                            short_exp = exp[:110] + ("..."
                                                     if len(exp) > 110 else "")
                            issues.append(f"**{m} ({val:.2f})**: {short_exp}")

        # Check other metrics that scored < 1.0
        for m, obj in sorted(metrics.items()):
            if m not in target_metrics:
                val = obj.get("score", obj) if isinstance(obj, dict) else obj
                if isinstance(val, (int, float)) and val < 1.0 and isinstance(
                        obj, dict):
                    exp = extract_explanation(obj)
                    if exp:
                        short_exp = exp[:110] + ("..."
                                                 if len(exp) > 110 else "")
                        issues.append(f"**{m} ({val:.2f})**: {short_exp}")

        obs = " ✅ PASS (All metrics 1.00)" if not issues else "<br>".join(
            issues)
        lines.append(f"| Q{idx+1} | `{q_id}` | " + ", ".join(m_summary[:4]) +
                     f" | {obs} |")

    result_md = "\n".join(lines) + "\n"

    if output_path and output_path != "-":
        with Path(output_path).open("w", encoding="utf-8") as out_f:
            out_f.write(result_md)
        sys.stdout.write(
            f"Successfully generated markdown matrix table to: {output_path}\n")

    return result_md


def main():
    parser = argparse.ArgumentParser(
        description="Parse eval_summary.json into markdown table.")
    parser.add_argument("--summary-path",
                        required=True,
                        help="Path to eval_summary.json")
    parser.add_argument("--output-path",
                        default="-",
                        help="Output markdown path (default: stdout)")
    args = parser.parse_args()

    md = parse_summary(args.summary_path, args.output_path)
    if args.output_path == "-":
        sys.stdout.write(md)


if __name__ == "__main__":
    main()
