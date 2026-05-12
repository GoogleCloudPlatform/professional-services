# agent-eval — AI Assistant Context

> This file provides context for Claude Code. It is loaded automatically when you run `claude` from a project that uses `agent-eval`.

---

## What is agent-eval?

`agent-eval` is an evaluation CLI for ADK agents. It acts as the glue between OpenTelemetry traces from ADK, Vertex AI Evaluation for LLM-as-judge metrics, and Gemini for analysis.

**The evaluation cycle:**
1. **Interact** — Generate agent traces. Either `agent-eval simulate` (UserSim, multi-turn) or `agent-eval interact` (DIY, single-turn) — both are forms of interacting with the agent, just different drivers.
2. **Evaluate** — Score traces with deterministic metrics (latency, tokens, cost) + LLM-as-judge metrics (quality, accuracy)
3. **Analyze** — Generate AI-powered root cause analysis

**Context Engineering Principles** guide optimizations:
- **Offload**: Move deterministic logic out of the LLM into tools/code
- **Reduce**: Summarize or compact stale context to prevent "context rot"
- **Retrieve**: Replace static knowledge with RAG
- **Isolate**: Split monolithic agents into specialized sub-agents
- **Cache**: Restructure prompts for prefix caching

---

## Typical Project Structure

`agent-eval init` writes ONE unified `tests/eval/` folder at the **agent project root** (the directory with `pyproject.toml`) — NEVER inside the agent module. There is one source of truth — `tests/eval/dataset.jsonl` — that feeds every command:

- `simulate` reads multi-turn rows (rows with `history` or `conversation_plan`)
- `interact` reads single-turn rows
- `agent-engine` reads single-turn rows (skips multi-turn with a clear pointer at `simulate`)
- `evaluate` consumes whichever interaction file the previous step wrote

```
my-agent/
├── my_agent/                                  # ADK agent source code
│   ├── agent.py
│   ├── tools/
│   └── ...
├── tests/eval/                                # Unified — ONE source of truth
│   ├── dataset.jsonl                          # All rows (prompt / response / reference / history / intermediate_events / session_inputs / expected_*)
│   ├── metrics/metric_definitions.json        # LLM-as-judge metric rubrics
│   └── results/                               # Evaluation outputs (eval_summary.json, gemini_analysis.md, ...)
├── pyproject.toml
└── .env
```

ADK's `adk eval` runtime expects `conversation_scenarios.json`, `session_input.json`, and `eval_config.json` next to `agent.py`. `agent-eval simulate` projects those from `dataset.jsonl` at run time and writes them inside `my_agent/` as **ephemeral cache** (gitignore them). Users never edit those files — they edit `dataset.jsonl`.

> **Migrating an old project?** Run `agent-eval migrate` to fold every legacy location into the unified file:
> - `<agent>/eval/scenarios/conversation_scenarios.json` (legacy UserSim)
> - `<agent>/eval/eval_data/golden_dataset.json` (legacy DIY)
> - `<agent>/eval/metrics/metric_definitions.json` (relocated to `<project_root>/tests/eval/metrics/`)
> - `<agent>/tests/eval/dataset.jsonl` (the wrongly-placed F3 location from pre-rescue scaffolds — folded into the canonical project-root location, source removed)
> Originals are copied to `<project_root>/tests/eval/.backup/<timestamp>/` first.

---

## CLI Commands

| Command | Purpose |
|---------|---------|
| `uv run agent-eval setup` | Walk gcloud auth, ADC, project + location, Vertex AI API enablement, autorater IAM (run once per shell) |
| `uv run agent-eval init` | Scaffold eval files (with optional AI metric generation via `--ai-metrics`) |
| `uv run agent-eval migrate` | Fold legacy `eval/scenarios/` + `golden_dataset.json` AND any wrongly-placed `<agent>/tests/eval/dataset.jsonl` (F3) into the canonical `<project_root>/tests/eval/dataset.jsonl`. Idempotent. |
| `uv run agent-eval import --from <evalset>.json` | Flatten an ADK `.evalset.json` file into `tests/eval/dataset.jsonl` |
| `uv run agent-eval run` | Full pipeline: simulate + interact + evaluate + analyze |
| `uv run agent-eval simulate` | Run ADK User Sim + convert traces (multi-turn) |
| `uv run agent-eval interact` | Run queries against a live agent endpoint (single-turn) |
| `uv run agent-eval evaluate` | Run deterministic + LLM-as-judge metrics (supports multiple `--interaction-file`) |
| `uv run agent-eval agent-engine` | Streamlined `create_evaluation_run()` against a deployed Agent Engine (single-turn, additive when deployed) |
| `uv run agent-eval analyze` | Generate AI-powered analysis reports |
| `uv run agent-eval convert` | Convert ADK traces to evaluation format (used by simulate) |
| `uv run agent-eval create-dataset` | Convert ADK test files to golden dataset format |
| `uv run agent-eval dashboard` | Launch interactive Gradio dashboard for comparing runs |

---

## Common Tasks You Should Help With

### Interpreting Evaluation Results

- `eval_summary.json` → Aggregated metrics (start here)
- `gemini_analysis.md` → AI root cause analysis
- `question_answer_log.md` → Per-question detailed breakdown with scores

### Debugging Evaluation Issues

- **Use `--debug`** on any command (`run`, `simulate`, `interact`, `evaluate`, `analyze`) to see detailed logs from ADK, Vertex AI SDK, and other services. By default, third-party logs are suppressed to keep the CLI output clean — `--debug` opens the floodgates.
- **Auth issues?** → Re-run `agent-eval init` — it verifies project ID, ADC, API enablement, and quota project automatically
- Zero token usage → `app_name` in `session_input.json` (the cached file projected from `dataset.jsonl`) doesn't match the agent module folder name. Fix the `session_inputs` field in your `dataset.jsonl` row, not the cache.
- Multi-turn metric `SKIPPED — no rows have required capabilities: multi_turn` → expected when your dataset has no rows with `history` or `conversation_plan`. Add multi-turn rows or just remove the metric.
- `simulate` dies at `ModuleNotFoundError: No module named 'app'` → `_clean_env` is supposed to put `project_root` on `PYTHONPATH`. If this regresses, check `cli/commands/simulate.py:_clean_env`.
- `agent-engine` first run errors `Project may not create storageClass STANDARD buckets with locationConstraint GLOBAL` → `_resolve_bucket_location` should have mapped `global` → `us-central1`. If this regresses, check `cli/commands/agent_engine.py:_resolve_bucket_location` and the `--bucket-location` flag.
- Empty metrics → Using `GOOGLE_API_KEY` instead of Vertex AI; set `GOOGLE_CLOUD_PROJECT` instead
- Permission denied on autorater → Grant `roles/aiplatform.serviceAgent` to the AI Platform service account
- Failed metric in eval table → the `Reasons:` block under the table shows the actual exception class. NEVER tell the user it's an "API rate limit" without checking — that was the F1 demo lie.

### Creating Custom Metrics

Metrics live in `<project_root>/tests/eval/metrics/metric_definitions.json`. The schema is the **canonical Vertex AI Gen AI Eval SDK schema** — six `kind` values that mirror the docs exactly. See `core/metric_schema.py` for the single-source-of-truth spec.

#### The six metric `kind`s (from docs/determine-eval)

| `kind` | SDK call | When to use |
|---|---|---|
| `managed` | `types.RubricMetric.<NAME>` | Vertex's predefined rubrics (GENERAL_QUALITY, SAFETY, FINAL_RESPONSE_MATCH, etc.) — ~17 metrics, see docs/rubric-metric-details |
| `parametrized_managed` | `types.RubricMetric.<NAME>(metric_spec_parameters={"guidelines": "..."})` | Same predefined rubrics with custom guidelines or rubric_groups overlay |
| `custom_llm_judge` | `types.LLMMetric(name=..., prompt_template=types.MetricPromptBuilder(instruction=..., criteria={...}, rating_scores={...}))` | Agent-specific behaviors. **Default to binary `rating_scores={"1":..., "0":...}`** |
| `computation` | `types.Metric(name='bleu' \| 'rouge_l' \| 'exact_match')` | Deterministic algorithms (BLEU/ROUGE/exact_match/tool_*) |
| `python_function` | `types.Metric(custom_function=callable)` | Local Python check returning `{"score": float}` |
| `remote_code` | `types.Metric(remote_custom_function=code_str)` | Sandboxed code snippet executed by Vertex |

`metric_factory.build_metric(name, spec)` is the single dispatch — both `evaluator.py` (local) and `agent_engine.py` (managed) route through it.

#### Custom LLM judge — the canonical pattern

```jsonc
{
  "cites_source_when_required": {
    "kind": "custom_llm_judge",
    "instruction": "Evaluate whether the agent cited a source for any factual claim.",
    "criteria": {
      "factual_claim_present": "Response contains at least one factual claim about a date, person, policy, or number.",
      "citation_present": "Each factual claim is followed by a citation (URL, doc id, or 'per <source>')."
    },
    "rating_scores": {
      "1": "Pass: every factual claim has a citation, OR no factual claims",
      "0": "Fail: at least one factual claim is missing a citation"
    },
    "requires_reference": false        // optional — agent-eval extension for per-row routing
  }
}
```

**Default to binary 0/1 `rating_scores`.** LLM judges have poor inter-rater reliability on multi-point scales. Multi-tier (1-5) is structurally valid (the docs' simplicity_metric example uses it) but only when (a) the criterion truly cannot be decomposed AND (b) you can write a sentence per integer with observable anchors. **Decompose, don't tier** — multiple sharp binary metrics > one fuzzy multi-tier metric. Aggregating binary signals over a dataset (% pass rate) IS your continuous score with better statistical properties.

The `criteria` dict is a list of yes/no observables the judge evaluates. The `rating_scores` dict maps integer-as-string keys to score descriptions. `instruction` is one sentence on what to evaluate overall.

#### agent-eval extras (orthogonal to the SDK schema)

Every entry MAY carry these optional fields:

- `requires_reference: true` — only run on rows whose `reference_data` slot is populated (golden-style rows).
- `requires_multi_turn: true` — only run on rows with multi-turn history.
- `dataset_mapping: {...}` — projects ADK trace columns into the SDK's per-metric column names. Most `custom_llm_judge` metrics don't need this — defaults from `metric_schema.SDK_COLUMN_DEFAULTS` (`prompt` ← `user_inputs[-1]`, `response` ← `final_response`) work. Add only when you need a specific source column (e.g. `extracted_data:tool_interactions`).
- `reference_field: "<name>"` — for managed metrics that consume `reference`, names which slot in `reference_data` to compare against.

> **`requires_multi_turn` and `requires_reference` COMPOSE.** The evaluator routes per-row: a row with `history`/`conversation_plan` AND populated `reference_data` matches a metric flagging both. Use this for "judge the trajectory AND compare the final answer to a reference" (e.g., RAG agents that should both navigate clarification AND land on the right answer). The data generator (Gemini Call 3) emits both shapes; for the both-flags combo it adds a `reference_data` block to multi-turn scenarios. Sim trace conversion preserves `reference_data` by joining the trace's first user message back to the source `dataset.jsonl` row's `prompt` (see `AdkHistoryConverter.prompt_to_reference`).

Per-row routing inspects the row's actual columns via `dataset_io.detect_capabilities` — mixed-capability datasets just work.

#### How to create them

1. **AI generation** (recommended): `agent-eval init` → "Generate with AI". Gemini analyzes agent code, picks managed metrics, generates 2-4 binary `custom_llm_judge` metrics tailored to the agent's tools/state/behaviors. The generator prompt enforces the canonical schema and the binary preference. Re-running `init` preserves existing metrics. Manual edits during the iterative review pause flow forward to dataset generation.

2. **Manual creation**: Write entries directly in `metric_definitions.json` matching the schema above. The validator (`metric_generator._validate_single_metric`) checks `kind`, per-kind required fields, `rating_scores` shape (integer-as-string keys), and `dataset_mapping` source column validity.

> The validator + factory share the same `core/metric_schema.py` constants (`ALL_KINDS`, `REQUIRED_FIELDS`, `SDK_COLUMN_DEFAULTS`, `MANAGED_METRIC_REQUIRED_COLUMNS`). When the schema evolves, change one place.

### Diagnosing Agent Issues from Metrics

| Signal | Metric to Check | Fix |
|--------|-----------------|-----|
| Agent invents capabilities | custom: `capability_honesty` < 3.0 | Add `**KNOWN LIMITATIONS**` to tool docstrings |
| Agent takes wrong paths | custom: `trajectory_accuracy` < 3.0 | Isolate into specialized sub-agents |
| Tools called with bad args | managed: `TOOL_USE_QUALITY` < 3.0 | Add Pydantic schemas, stricter types |
| High latency, bloated context | deterministic: `prompt_tokens` > 10,000 | Compact stale tool outputs, offload to disk |
| Agent fabricates data on failure | custom: `pipeline_integrity` < 3.0 | Add circuit breaker checks |
| Low cache hits | deterministic: `cache_hit_rate` < 50% | Put static instructions in `global_instruction` |

> The `analyze` command includes ADK-specific design patterns in its Gemini prompt, enabling actionable recommendations mapped to the five Context Engineering Principles. The patterns are in `src/agent_eval/core/adk_optimization_patterns.py`.

---

## Creating Optimization Logs (Comparing Results)

The `analyze` command **automatically** creates and maintains `OPTIMIZATION_LOG.md` in the parent results directory. Every time you run `analyze`, it:
- First run: creates a baseline entry (Iteration 1)
- Subsequent runs: auto-detects the previous run, computes deltas, and appends a new iteration with metric changes, git diff info, and Gemini's comparison summary

```bash
# First run — creates baseline entry
uv run agent-eval analyze --results-dir eval/results/baseline --agent-dir ./my_agent

# Second run — auto-compares to baseline, appends Iteration 2
uv run agent-eval analyze --results-dir eval/results/v2 --agent-dir ./my_agent

# Override which run to compare against
uv run agent-eval analyze --results-dir eval/results/v3 --compare-to eval/results/v1

# Highlight specific metrics in the terminal table
uv run agent-eval analyze --results-dir eval/results/v2 --focus "latency, cache"
```

**For manual optimization logs** (e.g., when using an AI assistant to create a more detailed log), use this prompt structure:

```text
Role: You are a Senior Agent Architect and QA Analyst.
Objective: Update the OPTIMIZATION_LOG.md to document whether the applied strategy worked.

Inputs:
1. Strategy Applied: [e.g., "Iteration 1: Tool Hardening"]
2. New Evaluation Data: [metrics from eval_summary.json]
3. Qualitative Analysis: [key insights from gemini_analysis.md]
4. Current Log: [current OPTIMIZATION_LOG.md content]

Instructions:
1. Update Metrics Table: Calculate deltas. Use 🟢 (improvement) / 🔴 (regression) / ⚪ (neutral).
2. Append Iteration History:
   - Optimization Pillar: (Offload, Reduce, Retrieve, Isolate, Cache)
   - Analysis of Variance: Did quality/trust/scale improve? Quote specific metrics.
   - Evidence: Extract 1-2 specific examples from the analysis.
   - Conclusion: One sentence on the strategic pivot for the next step.
```

### Metric Types

**Deterministic** (auto-extracted from traces, same for all agents):
- `token_usage.*` — total tokens, prompt tokens, estimated cost
- `latency_metrics.*` — total seconds, avg turn latency, first response
- `cache_efficiency.*` — hit rate, cached vs fresh tokens
- `tool_success_rate.*` — success rate, failed calls
- `thinking_metrics.*` — reasoning ratio

**LLM-as-Judge** (configured per agent in `metric_definitions.json`):
- Scores defined by the user's metric templates
- Common ones: `trajectory_accuracy`, `tool_use_quality`, `general_quality`, `safety`

### Emoji Legend
- 🟢 = Improvement (lower tokens/latency OR higher quality scores)
- 🔴 = Regression
- ⚪ = Neutral

---

## Critical Reminders

1. **Always use Vertex AI**, not API keys (evaluation won't work otherwise)
2. **Clear eval_history** before each ADK User Sim run — `simulate` does this automatically; if running manually: `rm -rf <agent_module>/.adk/eval_history/*`
3. **Location is auto-configured** — Gemini 3+ models use `global` automatically via `get_location()` in config.py. Override with `--location` if needed
4. **`app_name` must match the folder name** containing `agent.py`, not the agent's display name
5. **Both surfaces (local `evaluator.py` AND `agent_engine.py`) dispatch through `metric_factory.build_metric(name, spec)`** — single source of truth for the canonical schema. Don't reintroduce inline `types.LLMMetric(prompt_template=template_string)` or synthetic `criteria={"evaluation": template}` cargo-cult constructions. If a metric kind isn't routing correctly, fix `build_metric` (and the schema in `core/metric_schema.py`), not the call sites.
6. **`AGENT_EVAL_NO_PAUSES=1` covers both `_continue` pauses and the `simulate` Run ID prompt.** Any new interactive `Prompt.ask` / `questionary.*` call must guard on `_pauses_disabled()` (or accept a non-interactive default) so CI runs don't deadlock.
7. **`agent-engine` auto-creates the destination GCS bucket** in `--location` if it doesn't exist (uses `google.cloud.storage.Client.create_bucket`). Don't duplicate that logic elsewhere — and don't remove it; first runs depend on it.
8. **`agent-engine` follows the docs' `evaluation-agents-client` pattern** — `Client(..., http_options=HttpOptions(api_version="v1beta1"))`, builds an `AgentInfo` from a locally-imported `root_agent` (default `app.agent:root_agent`, override via `--agent-module`), and passes it to `create_evaluation_run`. `_build_agent_info` falls back to manual construction with empty `tool_declarations` when `AgentInfo.load_from_agent` trips on ADK's `tool_context` (a known SDK ↔ ADK schema bug). Don't replace this with the original "submit-only + parse-error" flow — without `agent_info` the run lands in `FAILED` with empty event lists.
9. **SDK pin: `google-cloud-aiplatform[evaluation,agent-engines]>=1.132.0,<1.140.0`.** Versions ≥1.140 changed the `AgentInfo` schema (drops `agent_resource_name`, requires `agents`/`root_agent_id` map) AND tightened `AgentData` validation in `run_inference` to reject ADK's rich event fields. Bumping past this needs the `agent_engine.py` helpers to be re-tested.
10. **Local pipeline is the default; Agent Engine is purely additive.** `init` auto-detects what's available — local `agent.py` enables the local pipeline (`simulate` + `interact` + `evaluate` + `analyze`); a deployed Agent Engine adds the streamlined `agent-engine` pass on top. They compose, they don't compete. UserSim works against any locally-imported `agent.py` regardless of deployment status. Never reintroduce a "Path A vs Path B" chooser — it's a phantom choice.
11. **One source of truth — `<project_root>/tests/eval/dataset.jsonl`.** Every command consumes this single file. `simulate` filters multi-turn rows; `interact` and `agent-engine` filter single-turn rows. ADK's required scenario files inside `app/` are an ephemeral cache projected from `dataset.jsonl` by `simulate`, not a parallel data source. NEVER re-introduce `eval/scenarios/` or `eval/eval_data/` as user-edited locations. NEVER write `tests/eval/` inside the agent module dir — always at the project root via `agent_project_root(agent_dir)` in `core/path_resolver.py`.
12. **FLATTEN schema canonical column names**: `prompt`, `response`, `reference`, `history` (NOT `conversation_history`), `instruction`, `intermediate_events`, `rubric_groups`. Plus arbitrary extras as `EvalCase` pass-through. See `~/.claude/projects/.../memory/vertex-eval-sdk-schema.md`. The old `dataset-mapping-constraint.md` "only 3 columns" claim is superseded.

12b. **`metric_definitions.json` schema is the canonical Vertex SDK schema — six `kind` values mirror the docs.** See `core/metric_schema.py` (single source of truth) and the "Creating Custom Metrics" section above. The six kinds: `managed`, `parametrized_managed`, `custom_llm_judge`, `computation`, `python_function`, `remote_code` — all from docs/determine-eval. Custom LLM judges use `instruction` + `criteria` (dict) + `rating_scores` (dict, integer-as-string keys), built via `types.MetricPromptBuilder`. **Default to binary `rating_scores={"1":..., "0":...}` for new custom metrics** (consistent with the docs' static rubric managed metrics; better inter-rater reliability than multi-tier). The legacy `is_managed` / `managed_metric_name` / `template` / `score_range` fields are gone — `metric_factory.build_metric` rejects entries without `kind`.
13. **Bucket location is decoupled from Vertex eval location.** Gemini 3+ defaults the eval `--location` to `global`, which GCS rejects for STANDARD-class buckets. `_resolve_bucket_location` in `agent_engine.py` maps `global` → `us-central1` (or whatever `--bucket-location` overrides to). NEVER pass `vertex_location` straight to `storage.create_bucket(location=...)` — that was the F5 demo failure.
14. **The end-of-run banner reflects reality.** If any phase failed or any metric is in `failed_metrics`, the banner reads `Pipeline finished with errors` with red border and per-phase ✓/✗ markers. NEVER print "Pipeline complete!" green when phases failed — that was the F4 demo lie. Same for the failure copy in the eval table — show the real exception class, never "API rate limits" without verifying.
15. **"Shipped" = end-to-end smoke against a real ADK agent + pytest. Both, not either.** Pytest didn't catch any of the eight 2026-04-23 demo failures. The smoke test at `tests/test_rescue_smoke.py` guards the request shape, the bucket location, the scaffold layout, and the unified-dataset filtering — anything claimed shipped must have a corresponding contract assertion or an end-to-end run. Hard rule in `~/.claude/projects/.../memory/shipped-means-end-to-end-not-pytest.md`.
16. **`Path A` / `Path B` are forbidden in user-facing strings.** They're internal `chosen_paths` enum keys only. The vocabulary leaked through three iterations of "Phase 7" cleanup before B2 finally swept and added `tools/check_no_path_ab.sh` + a pytest guard at `tests/test_no_path_ab_in_user_facing.py`. CLAUDE.md / GEMINI.md / `docs/tmp/` historical drafts are allow-listed; everything else trips the guard.
