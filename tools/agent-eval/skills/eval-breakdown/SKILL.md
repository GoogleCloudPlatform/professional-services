---
name: eval-breakdown
description: >-
  Performs an exhaustive, question-by-question narrative diagnostic breakdown of an agent-eval benchmark run by analyzing question_answer_log.md, eval_summary.json, and raw trajectory traces. Use when diagnosing low score causes, investigating the Memory Reuse vs. Traceability rubric clash, performing pre-release failure audits, or examining judge reasoning across individual scenarios. Don't use for running the benchmark CLI pipeline itself (use agent-eval) or automated genetic prompt tuning (use google-agents-cli-eval).
metadata:
  author: Google Cloud Professional Services
  license: Apache-2.0
  version: 1.0.0
  requires:
    bins:
      - agent-eval
---

# Eval Breakdown: Question-by-Question Diagnostic Analysis

This skill guides an agent through conducting a rigorous, evidence-grounded, question-by-question narrative diagnostic audit of an `agent-eval` benchmark run.

---

## 1. Input Sources & Directory Anatomy

An `agent-eval` results folder (`tests/eval/results/{run_id}/` or `gs://<bucket>/runs/{run_id}/`) contains three primary diagnostic artifacts:
1. `eval_summary.json`: Aggregated metrics, per-question score distributions, and AutoRater judge verdicts.
2. `question_answer_log.md`: Multi-turn conversational transcripts including user prompts, agent responses, tool calls, and tool outputs.
3. `gemini_analysis.md`: Automated executive diagnosis and loss cluster summary.

---

## 2. Step-by-Step Diagnostic Workflow

### Step 1: Generate the Baseline Matrix Table
Extract individual question scores and judge reasoning using the bundled script:

```bash
python3 tools/agent-eval/skills/agent-eval/scripts/parse_eval_summary.py \
  --summary-path tests/eval/results/{run_id}/eval_summary.json
```

### Step 2: Perform the Dialogue Audit Protocol
Inspect `question_answer_log.md` for each scenario, analyzing across:
1. **Turn-by-Turn User Intent**: What the user requested in Turn 1, Turn 2, etc.
2. **Tool Execution & Traceability**: Did the agent emit SQL/API tool calls on each turn where factual assertions were made, or did it answer from empirical dialogue memory?
3. **The Memory Reuse vs. Traceability Rubric Clash**:
   * *Diagnostic Pattern*: If `tool_use_quality` drops to `0.00` on Turn 2 follow-ups, verify if the agent answered correctly from dialogue memory without re-querying the backend. If the rubric expects a tool call on every turn, calibrate the rubric or prompt instructions accordingly.
4. **Judge Explanation Grounding**: Cross-reference any rubric score $< 1.00$ against the exact model response to verify whether the deduction was a genuine agent failure (Tier 1) or an overly strict judge rubric (Tier 2).

---

## 3. Executive Output Template

Conclude the audit with a structured summary table:

| Q# | Scenario ID | Metrics Summary | Root-Cause Finding |
| :--- | :--- | :--- | :--- |
| `Q1` | `TC-001` | `tool_use`=1.0, `business_logic`=1.0 | ✅ PASS (Strict parameter adherence) |
| `Q2` | `TC-002` | `tool_use`=0.0, `business_logic`=1.0 | ⚠️ Memory reuse on Turn 2; rubric expected re-query |
