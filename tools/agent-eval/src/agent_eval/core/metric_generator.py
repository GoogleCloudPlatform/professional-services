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
"""AI-powered metric generation and evaluation advisory using Gemini.

Analyzes agent source code, existing eval files, and developer priorities
to generate tailored evaluation metrics and provide recommendations on
scenarios, golden datasets, and evaluation strategy.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from agent_eval.core.metric_discovery import (
    format_adk_knowledge_for_prompt,
    format_metrics_for_prompt,
)
from agent_eval.core.scaffold import METRIC_TEMPLATES
from agent_eval.core.utils import discover_agent_context


class MetricGenerationError(Exception):
    """Raised when metric generation fails."""

    pass


# All valid source_column values that dataset_mapping can reference.
VALID_SOURCE_COLUMNS = {
    "user_inputs",
    "final_response",
    "trace_summary",
    "extracted_data:tool_interactions",
    "extracted_data:tool_declarations",
    "extracted_data:state_variables",
    "extracted_data:conversation_history",
    "extracted_data:system_instruction",
    "extracted_data:thinking_trace",
    "extracted_data:grounding_chunks",
    "extracted_data:per_turn_tokens",
    "extracted_data:sub_agent_trace",
    "extracted_data:stop_reasons",
}

# ---------------------------------------------------------------------------
# Multi-step prompts for focused Gemini calls (reduced hallucination)
# ---------------------------------------------------------------------------

AGENT_ANALYSIS_PROMPT = """You are a Senior Evaluation Architect analyzing an ADK agent's source code to identify all data available for evaluation.

## Agent Source Code

{agent_source_code}

## Instructions

Read the source code carefully and identify:

1. **tools** — Every tool the agent can use (name, purpose, argument types, return types)
2. **state_variables** — Session state variables the agent reads/writes. Look for `state["key"]`, `state.get("key")`, or state assignments. These are critical — they bridge agent logic and evaluation. Data saved to state during execution becomes available for evaluation metrics via `extracted_data:state_variables.<key>`.
3. **sub_agents** — Sub-agents delegated to (name, purpose, when triggered)
4. **key_behaviors** — Behaviors worth evaluating: capability boundaries (what the agent refuses), error handling, domain-specific logic, multi-step workflows, edge cases
5. **suggested_state_variables** — State variables the agent DOES NOT currently have but WOULD benefit from for evaluation. For each tool or key behavior, consider: would saving intermediate results, decisions, or status to session state make it easier to evaluate the agent? Only suggest variables that have clear evaluation value. For each suggestion include:
   - `name`: Variable name (snake_case, max 30 chars)
   - `purpose`: Why this variable helps evaluation (1 sentence)
   - `code_snippet`: Actual Python code showing how to add it. Follow ADK conventions:
     - For tools: add `tool_context: ToolContext` parameter (from `google.adk.tools`) if not already present, then use `tool_context.state["name"] = value`
     - For callbacks: use `ctx: CallbackContext` parameter (from `google.adk.agents.callback_context`), then use `ctx.state["name"] = value`
     Show the minimal code change — include the function signature and the line where the value is computed so the user knows exactly where to paste it.
     Snippet quality rules — REQUIRED for safe copy/paste:
     - PRESERVE the original function's docstring exactly as written; do not omit or shorten it
     - Show the COMPLETE function body, not a partial fragment — include the return statement and any existing logic before/after the new state assignment
     - Use 4-space indentation consistently — no tabs, no mixed indentation, no leading/trailing whitespace lines
     - Begin with the necessary `from google.adk.tools import ToolContext` (or callback_context import) on its own line at the top of the snippet
   - `evaluation_use`: What kind of metric could use this data (1 sentence)

   IMPORTANT: Do NOT suggest state variables that already exist (listed in item 2). If the agent already has 3+ meaningful state variables, return an empty list — the agent likely has enough observability. Only suggest 1-3 variables maximum.
6. **data_summary** — A concise human-readable summary of what evaluation data is available

**IMPORTANT:** Be factual — only report what is explicitly in the code. Do not invent tools, state variables, or behaviors. For suggested_state_variables, base suggestions on actual code patterns you see.

**Respond with ONLY a JSON object:**

{{
    "tools": [
        {{"name": "tool_name", "description": "what it does", "args": ["arg1", "arg2"]}}
    ],
    "state_variables": {{
        "variable_name": "description of what it stores and when"
    }},
    "sub_agents": [
        {{"name": "agent_name", "purpose": "what it handles"}}
    ],
    "key_behaviors": [
        "description of a behavior worth evaluating"
    ],
    "suggested_state_variables": [
        {{"name": "variable_name", "purpose": "Why this helps evaluation", "code_snippet": "from google.adk.tools import ToolContext\\n\\ndef tool_name(args: str, tool_context: ToolContext) -> dict:\\n    \\"\\"\\"Original docstring preserved verbatim — describes what the tool does.\\"\\"\\"\\n    result = compute_result(args)\\n    tool_context.state[\\"variable_name\\"] = result\\n    return result", "evaluation_use": "What metric could use this"}}
    ],
    "data_summary": "Human-readable summary of available evaluation data."
}}
"""

METRIC_DEFINITIONS_PROMPT = """You are a Senior Evaluation Architect generating custom evaluation metrics for an ADK agent. Your output is a `metric_definitions.json` file that mirrors the canonical Vertex AI Gen AI Evaluation SDK schema.

Reference docs (these are the source of truth — every kind below maps directly to one of these):
  https://cloud.google.com/vertex-ai/generative-ai/docs/models/determine-eval
  https://cloud.google.com/vertex-ai/generative-ai/docs/models/rubric-metric-details

{user_priorities_section}

---

## Agent Analysis (from source code inspection)

{agent_analysis_json}

## Selected Managed Metrics (already chosen by the user — include as-is)

The user has selected these managed metrics. Include them in your output EXACTLY as shown below — do not modify, remove, or re-generate them:

{selected_managed_json}

---

{existing_metrics_section}

---

## Metric schema — six canonical kinds

Every entry in `metric_definitions.json` declares one `kind`. The kind tells the evaluator which SDK constructor to call. There are exactly six kinds — all six map directly to the docs:

### 1. `managed` — predefined Vertex rubric (no parameters)

```json
{{
  "general_quality": {{
    "kind": "managed",
    "base": "GENERAL_QUALITY"
  }}
}}
```
SDK call: `types.RubricMetric.GENERAL_QUALITY`. The full list of `base` values lives in the rubric-metric-details doc above.

### 2. `parametrized_managed` — predefined rubric with custom guidelines or rubric groups

```json
{{
  "general_quality_styled": {{
    "kind": "parametrized_managed",
    "base": "GENERAL_QUALITY",
    "guidelines": "The response must maintain a professional tone and include a refund-policy reference when discussing returns."
  }}
}}
```
SDK call: `types.RubricMetric.GENERAL_QUALITY(metric_spec_parameters={{"guidelines": "..."}})`. Use this when you want the docs' built-in rubrics PLUS a domain-specific overlay.

### 3. `custom_llm_judge` — fully custom rubric (the docs' `MetricPromptBuilder` pattern)

```json
{{
  "cites_source_when_required": {{
    "kind": "custom_llm_judge",
    "instruction": "Evaluate whether the agent cited a source for any factual claim that needs one.",
    "criteria": {{
      "factual_claim_present": "The response contains at least one factual claim about a date, person, policy, or number.",
      "citation_present": "Each factual claim is followed by a citation (URL, doc id, or 'per <source>')."
    }},
    "rating_scores": {{
      "1": "Pass: every factual claim has a citation, OR there are no factual claims",
      "0": "Fail: at least one factual claim is missing a citation"
    }}
  }}
}}
```
SDK call: `types.LLMMetric(name=..., prompt_template=types.MetricPromptBuilder(instruction=..., criteria=..., rating_scores=...))`. THIS IS THE PATTERN YOU WILL GENERATE FOR ALMOST EVERY CUSTOM METRIC.

### 4. `computation` — deterministic score (BLEU, ROUGE, exact_match, tool_*)

```json
{{
  "answer_match": {{
    "kind": "computation",
    "metric_name": "exact_match"
  }}
}}
```
SDK call: `types.Metric(name='exact_match')`. Use ONLY when the user has reference data and you want a non-LLM score (e.g. exact-match for ID lookups). Most agents won't use this.

### 5. `python_function` — local Python callable

```json
{{
  "keyword_check": {{
    "kind": "python_function",
    "module": "tests/eval/custom_metrics.py",
    "function": "contains_keyword"
  }}
}}
```
SDK call: `types.Metric(name=..., custom_function=callable)`. The user writes the function signature `(instance: dict) -> dict` returning `{{"score": float}}`. Don't generate this from the prompt — flag it in the rationale if a non-LLM check is more appropriate.

### 6. `remote_code` — sandboxed code snippet

```json
{{
  "exact_check": {{
    "kind": "remote_code",
    "code_snippet": "def evaluate(instance):\\n    return {{'score': 1.0 if instance['response'] == instance['reference'] else 0.0}}"
  }}
}}
```
SDK call: `types.Metric(name=..., remote_custom_function=code_str)`. Same as 5 but runs in Vertex's sandbox. Rare — don't generate unless the user explicitly asked.

---

## Custom-metric design rules (kind: custom_llm_judge)

Default to **binary `rating_scores` with two keys**: `{{"1": "Pass: ...", "0": "Fail: ..."}}`. This matches how the SDK's static rubric metrics (SAFETY, FINAL_RESPONSE_MATCH, GROUNDING, HALLUCINATION) score, and is consistent with the docs' rubric-metric-details page where most managed metrics output a 0-1 passing rate.

**Why binary**: LLM-as-judge models have poor inter-rater reliability on multi-point scales — ask the same judge twice on 0-5 and you get different numbers; ask it binary on a concrete observable and you get the same answer. Aggregating binary signals over a dataset (% pass rate) gives you a continuous score with much better statistical properties than a fuzzy 0-5.

**Decompose, don't tier.** If a quality dimension feels tiered ("how helpful is this response?"), generate MULTIPLE binary metrics instead of one multi-tier metric. Example: `addresses_question`, `provides_actionable_steps`, `cites_when_relevant` (three binary metrics) is better than `helpfulness_score: 1-5` (one fuzzy metric). The aggregated pass rate IS the tiered score. **Prefer 4 sharply-defined binary metrics over 2 fuzzy 0-5 metrics** — same number of API calls, far cleaner signal.

The docs' simplicity_metric example uses `rating_scores={{"5":...,"4":...,...,"1":...}}` (1-5 scale) and that IS structurally valid — but only use it when (a) the criterion genuinely cannot be decomposed AND (b) you can write a sentence per integer that names an observable anchor (e.g. "5 = exact match, 3 = same fact wrong wording, 0 = wrong fact"). If you can't, use binary.

`criteria` is a dict of `criterion_name → description`. Each criterion is something the judge can evaluate independently. The judge sees the full criteria dict in its prompt; it doesn't need scoring guidance per criterion (the rating_scores handle that at the meta level).

`instruction` is a single sentence telling the judge what to evaluate overall. Optional but recommended.

---

## Per-row capability flags (agent-eval extension)

Every entry MAY carry these optional fields. They route which rows the metric runs on — orthogonal to `kind`:

| Flag | When to set | Effect |
|---|---|---|
| `requires_reference: true` | Metric uses a curated expected output (compares response to a known-good answer) | Only runs on rows with non-empty `reference_data`. |
| `requires_multi_turn: true` | Metric evaluates conversation flow or trajectory | Only runs on rows with multi-turn history. |
| both unset (default) | Single-turn quality, works on any row | Runs on every row. |

---

## Per-row column projection (agent-eval extension)

`dataset_mapping` projects ADK trace columns into the SDK's per-metric column names. The SDK's FLATTEN schema accepts these column names: `prompt`, `response`, `reference`, `history`, `instruction`, `intermediate_events`, `rubric_groups`, plus arbitrary extras passed through to the metric's prompt template as `{{column_name}}`.

Most custom_llm_judge metrics don't need `dataset_mapping` at all — the defaults (`prompt` ← `user_inputs[-1]`, `response` ← `final_response`) work. Add a mapping only when you need a specific source column.

### Combining multiple sources into one column:

```json
"reference": {{
  "template": "Available Tools: {{extracted_data_tool_declarations}}\\n\\nTool Calls: {{extracted_data_tool_interactions}}",
  "source_columns": ["extracted_data:tool_declarations", "extracted_data:tool_interactions"]
}}
```

(Inside the `template` string, colons in source-column names are replaced with underscores.)

### Valid `source_column` values:

| source_column | Description |
|---|---|
| `user_inputs` | User messages (JSON list of strings) |
| `final_response` | Agent's final text response |
| `trace_summary` | Execution trajectory summary |
| `extracted_data:tool_interactions` | Tool calls + results |
| `extracted_data:tool_declarations` | Available tools and their descriptions |
| `extracted_data:state_variables` | Session state variables (dict) |
| `extracted_data:conversation_history` | Full multi-turn conversation |
| `extracted_data:system_instruction` | Agent's system prompt |
| `extracted_data:sub_agent_trace` | Agent's step-by-step reasoning trace |
| `extracted_data:<state_var_name>` | Any agent-specific state variable |
| `reference_data:<field_name>` | User-curated expected output (only on rows with reference_data; pair with `requires_reference: true`) |

For `reference_data:<field_name>`, pick a field name that fits the agent's domain — `expected_response` for chatbots, `expected_docs` for RAG, `expected_tool_calls` for tool-using agents, `expected_citations` for research agents. The same field name MUST be populated by the golden data generated in the next step.

---

## Example custom metrics (canonical schema):

{example_metrics}

---

## Available Managed (Predefined) Metrics

{managed_metrics_reference}

---

{adk_knowledge_section}

---

## Instructions

1. Generate **EXACTLY {n_custom_metrics} custom_llm_judge metric(s)** (no more, no less — the developer asked for this exact count). Each metric is BINARY (`rating_scores` has exactly two keys: `"1"` for pass, `"0"` for fail) UNLESS you can write the multi-tier justification described above.

2. **Decompose, don't tier.** Prefer multiple sharp binary metrics over fewer fuzzy multi-tier ones. Each binary metric should name a CONCRETE OBSERVABLE behavior that a human reviewer would answer the same way every time.

3. If existing custom metrics are provided: **preserve them**. Include every existing metric in your output. Don't silently drop. If an existing metric is multi-tier and could be decomposed, propose the decomposed versions in the rationale (don't auto-rewrite — let the user decide).

4. Each custom metric targets a DISTINCT observable behavior relevant to this agent. No duplicates, no near-duplicates.

5. Set per-row capability flags correctly: `requires_reference: true` for metrics that need a curated expected answer, `requires_multi_turn: true` for trajectory/flow metrics, omit both for single-turn quality checks. **Both flags MAY be `true` on the same metric** — the evaluator handles per-row routing for "judge the trajectory AND compare the final answer to a reference". When you produce such a metric, the next step (data generation) MUST emit at least one multi-turn scenario carrying `reference_data` for the field this metric expects.

6. Reference the agent's ACTUAL tool names, state variables, and capabilities (from the analysis above) in your `criteria` descriptions. Concrete > generic.

7. **Do NOT generate generic metrics** (safety, fluency, coherence) — the user has already selected managed metrics for those.

8. Include the user-selected managed metrics EXACTLY as shown in the "Selected Managed Metrics" section.

9. **Include AT LEAST ONE metric with `requires_reference: true`** that compares the agent's response against `reference_data:<field>`. This is the most common eval pattern (golden-answer comparison). Pick a `<field>` that fits the agent's domain (`expected_response` / `expected_docs` / `expected_tool_calls` / etc.) — the same name MUST be populated by the golden data generated next.

10. **For each user-selected managed metric with `requires_reference: true` (e.g. FINAL_RESPONSE_MATCH)**, add `"reference_field": "<field_name>"` pointing at the same golden-data field your custom reference metric uses. This tells the evaluator which slot in `reference_data` to compare against.

**Respond with ONLY a JSON object** (no markdown fences):

{{
    "metrics": {{
        ... include selected managed metrics as-is ...
        ... include new custom_llm_judge metrics ...
    }},
    "rationale": "Brief explanation of why these custom metrics were chosen and how each criterion maps to a concrete observable behavior."
}}
"""

EVAL_DATA_PROMPT = """You are a Senior Evaluation Architect generating test data for evaluating an ADK agent.

## Agent Source Code

{agent_source_code}

## Agent Analysis

{agent_analysis_json}

## Metric Definitions (what will be evaluated)

These are the EXACT metrics that will score every test case you generate. Your job is to design test cases that EXERCISE these metrics — not generic happy-path queries.

{metric_definitions_json}

---

{rationale_section}

---

{required_fields_section}

---

{existing_data_section}

{user_priorities_section}

---

## Instructions

Generate evaluation test data for this agent. Every row must EXERCISE the metrics defined above — design queries that probe the criteria each metric checks.

### 1. Conversation Scenarios (for ADK User Sim multi-turn evaluation)

Generate **EXACTLY {rows_per_kind} scenarios** (no more, no less). Each simulates a multi-turn conversation:
- `starting_prompt` (string): The first message the simulated user sends.
- `conversation_plan` (**JSON ARRAY of strings**): One string per follow-up turn.
  Each string is the next message the simulated user will send AFTER seeing the agent's reply.
  **Do NOT use a single numbered string like "1. ... 2. ...".** ADK's UserSim splits this
  into individual turns — a single string makes it iterate over CHARACTERS and breaks the simulation.

Good scenarios test:
- Happy paths with different tools/workflows
- Edge cases and error handling
- Multi-step workflows requiring multiple tools
- Boundary testing (requests the agent should refuse or clarify)
- Ambiguous requests that test understanding

### 2. Golden Data (for single-turn regression testing)

Generate **EXACTLY {rows_per_kind} golden test entries** (no more, no less). Each is a single-turn query:
- `user_inputs`: List of queries (usually just one).
- `agents_evaluated`: List of agent names to evaluate.
- `reference_data` (**NESTED DICT**): Expected outputs the metrics will compare against.

**ABOUT `reference_data` — CRITICAL:** This is a NESTED DICT (NOT flattened to top-level
fields). The evaluator looks up reference fields via `reference_data:<field>` source columns
(e.g. `reference_data:expected_response`). If you put `expected_response` as a top-level field
on the row instead of inside `reference_data`, the metric will SILENTLY SKIP every row at
evaluate time. Always nest under `reference_data`.

The EXACT field names inside `reference_data` MUST match what the metrics expect — see the
"REQUIRED `reference_data` field names" section above for the per-metric list. Always include
`expected_behavior` as a plain-English description; ADDITIONALLY populate the metric-specific
field names from the required list (e.g. if a metric expects `expected_docs`, `reference_data`
must have an `expected_docs` key). The user will sharpen each field into precise expected values.

Good golden data covers:
- Typical queries the agent handles
- Edge cases and out-of-scope requests
- Queries that require specific tools
- Queries where the expected response can be verified

**CRITICAL quality requirements:**
- Every entry MUST test a DISTINCT scenario — no near-duplicate queries
- `expected_behavior` MUST NOT be empty — always describe what the agent should do
- All required `reference_data` field names from the list above MUST be populated
  on rows that exercise those metrics (an empty/missing field → metric skips that row)
- Vary the query style and complexity across entries
- Each `user_inputs` list should contain a unique query not repeated in other entries
- `conversation_plan` MUST be a JSON array of strings (NOT a single numbered string)

{existing_data_instructions}

**Respond with ONLY a JSON object** (no markdown fences):

{{
    "scenarios": [
        {{
            "description": "What this scenario tests",
            "starting_prompt": "The first user message",
            "conversation_plan": [
                "First follow-up the user sends after seeing the agent's reply",
                "Second follow-up — natural conversational continuation",
                "Third follow-up if needed"
            ],
            "reference_data": {{
                "expected_behavior": "OPTIONAL — include ONLY when a metric flags BOTH requires_multi_turn: true AND requires_reference: true. Same field names as golden_data.reference_data (see REQUIRED fields above)."
            }}
        }}
    ],
    "golden_data": [
        {{
            "description": "What this test case covers",
            "user_inputs": ["The test query"],
            "agents_evaluated": ["{agent_name}"],
            "reference_data": {{
                "expected_behavior": "Plain-English description of what the agent should do",
                "<metric_specific_field>": "Value matching the metric's expected format (e.g. expected_docs, expected_route, expected_tool_calls — see REQUIRED fields above)"
            }}
        }}
    ],
    "strategy": "Overall evaluation strategy advice for this agent."
}}

**When a metric flags BOTH `requires_multi_turn: true` AND `requires_reference: true`** (a "trajectory + final-answer" metric like `dynamic_retrieval_and_routing_success`), AT LEAST ONE multi-turn scenario MUST include a `reference_data` block carrying the field that metric reads. Without it, the metric will skip every row at evaluation time.
"""

# ---------------------------------------------------------------------------
# Multi-step generation functions
# ---------------------------------------------------------------------------


def analyze_agent_data(
    agent_dir: Path,
    agent_name: str,
    model: str = "gemini-3.1-pro-preview",
) -> Dict[str, Any]:
    """Gemini Call 1: Analyze agent source code to identify evaluation data.

    This is a factual extraction task — low hallucination risk. The model
    reads agent source code and identifies tools, state variables, sub-agents,
    and key behaviors worth evaluating.

    Returns:
        Dict with keys: tools, state_variables, sub_agents, key_behaviors, data_summary
    """
    agent_context = discover_agent_context(agent_dir, quiet=True)
    if not agent_context:
        raise MetricGenerationError(
            f"No agent source code found in {agent_dir}. "
            "Make sure the directory contains agent.py."
        )

    source_parts = _format_source_code(agent_context)
    prompt = AGENT_ANALYSIS_PROMPT.format(agent_source_code=source_parts)

    raw = _call_gemini(prompt, model)
    parsed = _extract_json(raw)
    if not parsed:
        raise MetricGenerationError(
            "Could not parse agent analysis from Gemini response."
        )

    # Validate expected keys
    for key in (
        "tools",
        "state_variables",
        "key_behaviors",
        "suggested_state_variables",
    ):
        if key not in parsed:
            parsed[key] = [] if key != "state_variables" else {}

    return parsed


def generate_metric_definitions(
    agent_dir: Path,
    agent_name: str,
    agent_analysis: Dict[str, Any],
    selected_managed: Dict[str, Dict],
    user_priorities: str = "",
    existing_metrics: Optional[Dict[str, Any]] = None,
    model: str = "gemini-3.1-pro-preview",
    n_custom_metrics: int = 3,
) -> Tuple[Dict[str, Any], str]:
    """Gemini Call 2: Generate metric_definitions.json content.

    Takes the agent analysis from Call 1, user-selected managed metrics,
    and produces the final metrics dict with both managed entries (as-is)
    and custom LLM-as-judge metrics.

    Returns:
        Tuple of (metrics_dict, rationale_string)
    """
    # Format selected managed metrics as JSON for the prompt
    selected_json = json.dumps(selected_managed, indent=2)

    # User priorities section
    if user_priorities:
        user_priorities_section = (
            "**DEVELOPER PRIORITIES:**\n"
            "The developer considers these aspects important to evaluate:\n"
            f"> {user_priorities}\n\n"
            "Prioritize custom metrics that address these concerns."
        )
    else:
        user_priorities_section = ""

    # Existing metrics section
    existing_metrics_section = ""
    if existing_metrics:
        # Filter to just custom (non-managed) metrics for the prompt
        from agent_eval.core.metric_schema import is_managed_entry

        custom_existing = {
            k: v
            for k, v in existing_metrics.items()
            if isinstance(v, dict) and not is_managed_entry(v)
        }
        if custom_existing:
            existing_metrics_section = (
                "## Existing Custom Metrics (preserve and improve)\n\n"
                "The agent already has these custom metrics. Include them in your output "
                "(improved or as-is). Only remove a metric with a clear reason in the rationale.\n\n"
                f"```json\n{json.dumps(custom_existing, indent=2)}\n```"
            )

    # Format example metrics
    example_trajectory = json.dumps(METRIC_TEMPLATES["trajectory_accuracy"], indent=2)
    example_tool_use = json.dumps(METRIC_TEMPLATES["tool_use_quality"], indent=2)
    example_metrics = (
        f"**trajectory_accuracy:**\n```json\n{example_trajectory}\n```\n\n"
        f"**tool_use_quality:**\n```json\n{example_tool_use}\n```"
    )

    # Get managed metrics reference and ADK knowledge
    managed_ref = format_metrics_for_prompt()
    adk_knowledge = format_adk_knowledge_for_prompt()

    prompt = METRIC_DEFINITIONS_PROMPT.format(
        user_priorities_section=user_priorities_section,
        agent_analysis_json=json.dumps(agent_analysis, indent=2),
        selected_managed_json=selected_json,
        existing_metrics_section=existing_metrics_section,
        example_metrics=example_metrics,
        managed_metrics_reference=managed_ref,
        adk_knowledge_section=adk_knowledge,
        n_custom_metrics=n_custom_metrics,
    )

    raw = _call_gemini(prompt, model)
    metrics, warnings = _parse_and_validate_metrics(raw, agent_name)

    if not metrics:
        raise MetricGenerationError(
            "Gemini generated metrics but none passed validation."
        )

    # Extract rationale
    rationale = ""
    try:
        parsed = _extract_json(raw)
        if parsed:
            rationale = parsed.get("rationale", "")
    except Exception:
        pass

    if warnings:
        rationale += "\n\nWarnings:\n" + "\n".join(f"  - {w}" for w in warnings)

    return metrics, rationale


def generate_eval_data(
    agent_dir: Path,
    agent_name: str,
    agent_analysis: Dict[str, Any],
    metric_definitions: Dict[str, Any],
    existing_scenarios: Optional[List] = None,
    existing_golden: Optional[List] = None,
    user_priorities: str = "",
    model: str = "gemini-3.1-pro-preview",
    metric_rationale: str = "",
    required_reference_fields: Optional[List[Tuple[str, str]]] = None,
    rows_per_kind: int = 5,
) -> Dict[str, Any]:
    """Gemini Call 3: Generate scenarios and golden data.

    Uses the agent analysis, final metric definitions, and the rationale +
    required-reference-field list from Call 2 to generate test data DESIGNED
    to exercise every metric.

    The ``required_reference_fields`` list is critical: each pair is
    ``(metric_name, reference_data_field)`` for a metric that needs a
    specific ``reference_data:<field>`` slot populated. Without telling
    Gemini explicitly, it tends to default to ``expected_behavior`` — and
    the metric silently skips every row at evaluation time.

    Returns:
        Dict with keys: scenarios, golden_data, strategy
    """
    agent_context = discover_agent_context(agent_dir, quiet=True)
    source_parts = (
        _format_source_code(agent_context)
        if agent_context
        else "No source code available."
    )

    # Existing data section
    existing_data_section = ""
    existing_data_instructions = ""
    parts = []
    if existing_scenarios:
        preview = existing_scenarios[:3]
        parts.append(
            f"**Existing scenarios (preview):**\n```json\n{json.dumps(preview, indent=2)}\n```"
        )
    if existing_golden:
        preview = existing_golden[:3]
        parts.append(
            f"**Existing golden data (preview):**\n```json\n{json.dumps(preview, indent=2)}\n```"
        )
    if parts:
        existing_data_section = (
            "## Existing Test Data\n\n"
            "The agent already has test data. Preserve and extend — don't replace.\n\n"
            + "\n\n".join(parts)
        )
        existing_data_instructions = (
            "**For existing data:** Preserve what's there. Add NEW entries that "
            "cover gaps. If an existing entry has issues, include an improved version."
        )

    # User priorities section
    user_priorities_section = ""
    if user_priorities:
        user_priorities_section = (
            "## Developer Priorities for Test Data\n\n"
            "The developer wants test data that focuses on:\n"
            f"> {user_priorities}\n\n"
            "Design scenarios and golden queries that specifically test these priorities."
        )

    # Metric rationale section — the WHY behind each metric, surfaced from
    # Call 2. Tells Gemini what behaviors each metric is designed to catch
    # so it can build test cases that actually exercise those behaviors.
    rationale_section = ""
    if metric_rationale:
        rationale_section = (
            "## Why these metrics exist (rationale from the previous step)\n\n"
            f"{metric_rationale}\n\n"
            "Use this rationale to design test cases that ACTUALLY EXERCISE each metric. "
            "If a metric checks 'did the agent call set_active_dataset before any subagent?', "
            "include test queries where that prerequisite matters. Generic happy-path queries "
            "that don't exercise the criteria above are wasted rows."
        )

    # Required reference fields — the dangerous gap. Each metric with
    # requires_reference: true points at a specific reference_data:<field>
    # column. If golden_data rows don't populate THAT exact field name,
    # the metric silently skips every row at evaluation time. List them
    # explicitly so Gemini doesn't default to "expected_behavior" everywhere.
    required_fields_section = ""
    if required_reference_fields:
        rows = "\n".join(
            f"- `reference_data.{field}` — required by metric `{metric_name}`"
            for metric_name, field in required_reference_fields
        )
        required_fields_section = (
            "## REQUIRED `reference_data` field names (CRITICAL — read carefully)\n\n"
            "Each metric below needs a SPECIFIC field populated under "
            "`golden_data[].reference_data`. If you use a different field name, "
            "the metric will SKIP every row at evaluation time and the user gets "
            "no signal for it.\n\n"
            f"{rows}\n\n"
            "**Rule:** Every entry in `golden_data` whose query exercises one of "
            "these metrics MUST populate the exact field names above under its "
            "`reference_data` dict. Do NOT default to `expected_behavior` — use "
            "the field names listed above. If a metric needs `expected_docs`, "
            "the golden row's `reference_data` MUST contain an `expected_docs` key. "
            "Free to ALSO include `expected_behavior` as a human-readable description, "
            "but the listed fields above are the load-bearing ones."
        )

    prompt = EVAL_DATA_PROMPT.format(
        agent_source_code=source_parts,
        agent_analysis_json=json.dumps(agent_analysis, indent=2),
        metric_definitions_json=json.dumps(metric_definitions, indent=2),
        existing_data_section=existing_data_section,
        existing_data_instructions=existing_data_instructions,
        user_priorities_section=user_priorities_section,
        rationale_section=rationale_section,
        required_fields_section=required_fields_section,
        agent_name=agent_name,
        rows_per_kind=rows_per_kind,
    )

    raw = _call_gemini(prompt, model)
    parsed = _extract_json(raw)
    if not parsed:
        raise MetricGenerationError("Could not parse eval data from Gemini response.")

    # Deduplicate golden data by user_inputs and fill empty expected_behavior
    golden = parsed.get("golden_data", [])
    seen_queries: set[str] = set()
    unique_golden: list[dict] = []
    for entry in golden:
        query_key = str(entry.get("user_inputs", []))
        if query_key not in seen_queries:
            seen_queries.add(query_key)
            # Ensure expected_behavior is not empty
            ref = entry.get("reference_data", {})
            if isinstance(ref, dict) and not ref.get("expected_behavior", "").strip():
                ref["expected_behavior"] = entry.get(
                    "description", "Agent should respond appropriately"
                )
                entry["reference_data"] = ref
            elif (
                not isinstance(ref, dict)
                and not entry.get("expected_behavior", "").strip()
            ):
                entry["expected_behavior"] = entry.get(
                    "description", "Agent should respond appropriately"
                )
            unique_golden.append(entry)

    return {
        "scenarios": parsed.get("scenarios", []),
        "golden_data": unique_golden,
        "strategy": parsed.get("strategy", ""),
    }


def _format_source_code(agent_context: Dict[str, str]) -> str:
    """Format agent source code files for inclusion in prompts."""
    source_parts = []
    for filepath, content in agent_context.items():
        if filepath.endswith(".py"):
            source_parts.append(f"**File: `{filepath}`**\n```python\n{content}\n```")
        elif "GEMINI.md" in filepath:
            source_parts.append(f"**{filepath}**\n```markdown\n{content[:5000]}\n```")
    return "\n\n".join(source_parts) if source_parts else "No source code available."


def _discover_existing_eval_files(agent_dir: Path) -> Dict[str, str]:
    """Read existing eval files (metrics, scenarios, golden data) if present.

    Returns a dict with keys like 'metrics', 'scenarios', 'golden_data'
    mapped to their file contents (truncated for prompt efficiency).
    """
    existing: Dict[str, str] = {}
    eval_dir = agent_dir / "eval"

    if not eval_dir.exists():
        return existing

    # Discover eval files dynamically
    from agent_eval.core.config import find_eval_files

    discovered = find_eval_files(eval_dir)

    # Existing metric definitions (use first found)
    for metrics_file in discovered["metrics"]:
        try:
            existing["metrics"] = metrics_file.read_text()
            break
        except Exception:
            pass

    # Existing scenarios (show first 3 for context, from all discovered files)
    all_scenarios = []
    for scenarios_file in discovered["scenarios"]:
        try:
            content = json.loads(scenarios_file.read_text())
            all_scenarios.extend(content.get("scenarios", []))
        except Exception:
            pass
    if all_scenarios:
        preview = {"scenarios": all_scenarios[:3]}
        if len(all_scenarios) > 3:
            preview["_note"] = f"Showing 3 of {len(all_scenarios)} scenarios"
        existing["scenarios"] = json.dumps(preview, indent=2)

    # Existing golden dataset (show first 3 entries, from all discovered files)
    all_questions = []
    for golden_file in discovered["golden_data"]:
        try:
            content = json.loads(golden_file.read_text())
            all_questions.extend(
                content.get("golden_questions", content.get("questions", []))
            )
        except Exception:
            pass
    if all_questions:
        preview = {"golden_questions": all_questions[:3]}
        if len(all_questions) > 3:
            preview["_note"] = f"Showing 3 of {len(all_questions)} questions"
        existing["golden_data"] = json.dumps(preview, indent=2)

    # Session input (for agent name context)
    session_file = eval_dir / "scenarios" / "session_input.json"
    if session_file.exists():
        try:
            existing["session_input"] = session_file.read_text()
        except Exception:
            pass

    # Previous evaluation results — find the most recent run with a Gemini analysis
    results_dir = eval_dir / "results"
    if results_dir.exists():
        run_folders = sorted(
            [
                d
                for d in results_dir.iterdir()
                if d.is_dir() and (d / "gemini_analysis.md").exists()
            ],
            key=lambda d: d.stat().st_mtime,
            reverse=True,
        )
        if run_folders:
            analysis_file = run_folders[0] / "gemini_analysis.md"
            try:
                analysis_content = analysis_file.read_text()
                # Truncate to ~6000 chars to keep prompt manageable
                if len(analysis_content) > 6000:
                    analysis_content = (
                        analysis_content[:6000] + "\n\n[... truncated for brevity ...]"
                    )
                existing["gemini_analysis"] = analysis_content
            except Exception:
                pass

    return existing


# Backoff schedule for 429 / RESOURCE_EXHAUSTED retries: 2s, 4s, 8s, 16s.
# 4 retries on top of the initial attempt — caps at ~30s total wait before
# the caller's fallback kicks in.
_RETRY_BACKOFF_SECONDS = (2, 4, 8, 16)


def _is_rate_limited(exc: BaseException) -> bool:
    """True when a Gemini API error looks like a retryable quota/rate-limit hit."""
    msg = str(exc).upper()
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg or "RATE LIMIT" in msg


def _call_gemini(prompt: str, model: str) -> str:
    """Call the Gemini API and return the response text.

    Retries with exponential backoff on 429 / RESOURCE_EXHAUSTED so a transient
    quota blip doesn't drop the user into the "continuing with defaults"
    fallback. Non-retryable errors raise immediately.
    """
    try:
        from google import genai
        from google.genai.types import HttpOptions
    except ImportError:
        raise MetricGenerationError(
            "google-genai package not installed. "
            "Install it with: pip install google-genai"
        )

    from agent_eval.core.config import get_project_id, get_location

    project = get_project_id()
    location = get_location(model)

    if not project:
        raise MetricGenerationError(
            "GOOGLE_CLOUD_PROJECT environment variable not set. "
            "Set it with: export GOOGLE_CLOUD_PROJECT=your-project-id"
        )

    client = genai.Client(
        vertexai=True,
        project=project,
        location=location,
        http_options=HttpOptions(api_version="v1"),
    )

    last_exc: Optional[BaseException] = None
    for attempt in range(len(_RETRY_BACKOFF_SECONDS) + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            last_exc = e
            if not _is_rate_limited(e) or attempt == len(_RETRY_BACKOFF_SECONDS):
                break
            time.sleep(_RETRY_BACKOFF_SECONDS[attempt])

    if last_exc is not None and _is_rate_limited(last_exc):
        raise MetricGenerationError(
            f"Gemini API rate-limited after {len(_RETRY_BACKOFF_SECONDS)} retries: {last_exc}"
        )
    raise MetricGenerationError(f"Gemini API call failed: {last_exc}")


def _extract_json(text: str) -> Optional[Dict]:
    """Extract JSON from Gemini's response, handling markdown fences."""
    # Try to find JSON in code fences first
    fence_match = re.search(r"```(?:json)?\s*\n(.*?)\n```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try parsing the whole response as JSON
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try finding a JSON object in the text
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def _parse_and_validate_metrics(
    raw_response: str,
    agent_name: str,
) -> Tuple[Dict[str, Any], List[str]]:
    """Parse Gemini's response and validate each metric definition.

    Returns:
        Tuple of (valid_metrics_dict, warning_messages).
    """
    warnings: List[str] = []

    parsed = _extract_json(raw_response)
    if not parsed:
        return {}, ["Could not parse JSON from Gemini response."]

    raw_metrics = parsed.get("metrics", {})
    if not raw_metrics:
        return {}, ["No 'metrics' key found in response."]

    valid_metrics: Dict[str, Any] = {}

    for name, defn in raw_metrics.items():
        metric_warnings = _validate_single_metric(name, defn)
        if metric_warnings:
            warnings.extend(metric_warnings)
            continue

        # Ensure agents list is set
        if "agents" not in defn:
            defn["agents"] = [agent_name]

        valid_metrics[name] = defn

    return valid_metrics, warnings


ALLOWED_PLACEHOLDER_NAMES = {"prompt", "response", "reference"}


def _validate_single_metric(name: str, defn: Dict) -> List[str]:
    """Validate a single metric definition against the canonical schema.

    Per ``core/metric_schema.py``: every entry MUST declare a ``kind`` from
    ``ALL_KINDS`` and have the per-kind required fields. Returns a list of
    errors (empty = valid).
    """
    from agent_eval.core.metric_schema import (
        ALL_KINDS,
        REQUIRED_FIELDS,
        KIND_CUSTOM_LLM_JUDGE,
        KIND_MANAGED,
        KIND_PARAMETRIZED_MANAGED,
    )

    errors: List[str] = []

    if not isinstance(defn, dict):
        return [f"'{name}': not a dict"]

    kind = defn.get("kind")
    if not kind:
        errors.append(
            f"'{name}': missing 'kind' — every metric must declare one of "
            f"{sorted(ALL_KINDS)}"
        )
        return errors
    if kind not in ALL_KINDS:
        errors.append(
            f"'{name}': unknown kind {kind!r}. Expected one of {sorted(ALL_KINDS)}"
        )
        return errors

    # Per-kind required-field check.
    missing = REQUIRED_FIELDS[kind] - set(defn.keys())
    if missing:
        errors.append(
            f"'{name}' (kind: {kind}): missing required field(s) {sorted(missing)}"
        )

    # custom_llm_judge — extra structural checks.
    if kind == KIND_CUSTOM_LLM_JUDGE:
        criteria = defn.get("criteria")
        if criteria is not None and not isinstance(criteria, dict):
            errors.append(f"'{name}': 'criteria' must be a dict of name → description")
        elif isinstance(criteria, dict) and not criteria:
            errors.append(f"'{name}': 'criteria' dict must be non-empty")

        rs = defn.get("rating_scores")
        if rs is not None and not isinstance(rs, dict):
            errors.append(
                f"'{name}': 'rating_scores' must be a dict of score-as-string → description"
            )
        elif isinstance(rs, dict):
            if not rs:
                errors.append(f"'{name}': 'rating_scores' dict must be non-empty")
            for k, v in rs.items():
                if not isinstance(k, str):
                    errors.append(
                        f"'{name}': rating_scores keys must be strings, got {type(k).__name__} for {k!r}"
                    )
                else:
                    try:
                        int(k)
                    except ValueError:
                        errors.append(
                            f"'{name}': rating_scores key {k!r} must be an integer-as-string "
                            f"(per docs/determine-eval — e.g. '1', '0', '5')"
                        )
                if not isinstance(v, str):
                    errors.append(
                        f"'{name}': rating_scores value for {k!r} must be a string description"
                    )

    # managed / parametrized_managed — base must look like an SDK metric name.
    if kind in (KIND_MANAGED, KIND_PARAMETRIZED_MANAGED):
        base = defn.get("base", "")
        if not isinstance(base, str) or not base:
            errors.append(
                f"'{name}': 'base' must be a non-empty string SDK metric name"
            )

    # dataset_mapping is OPTIONAL — when omitted, the evaluator falls back to
    # SDK_COLUMN_DEFAULTS. When present, check the placeholder names.
    mapping = defn.get("dataset_mapping")
    if mapping is not None:
        if not isinstance(mapping, dict):
            errors.append(f"'{name}': 'dataset_mapping' must be a dict")
        else:
            for placeholder, config in mapping.items():
                if not isinstance(config, dict):
                    errors.append(
                        f"'{name}.{placeholder}': mapping value must be a dict"
                    )
                    continue
                if "source_column" in config:
                    col = config["source_column"]
                    if (
                        col not in VALID_SOURCE_COLUMNS
                        and not col.startswith("extracted_data:")
                        and not col.startswith("reference_data:")
                    ):
                        errors.append(
                            f"'{name}.{placeholder}': invalid source_column '{col}'. "
                            f"Must be one of: {', '.join(sorted(VALID_SOURCE_COLUMNS))}, "
                            "extracted_data:<name>, or reference_data:<name>"
                        )
                elif "source_columns" in config and "template" in config:
                    cols = config["source_columns"]
                    for col in cols:
                        if (
                            col not in VALID_SOURCE_COLUMNS
                            and not col.startswith("extracted_data:")
                            and not col.startswith("reference_data:")
                        ):
                            errors.append(
                                f"'{name}.{placeholder}': invalid source_column '{col}' in source_columns"
                            )
                    if len(cols) != len(set(cols)):
                        errors.append(
                            f"'{name}.{placeholder}': duplicate entries in source_columns"
                        )
                else:
                    errors.append(
                        f"'{name}.{placeholder}': must have 'source_column' OR "
                        f"'source_columns' + 'template'"
                    )

    return errors
