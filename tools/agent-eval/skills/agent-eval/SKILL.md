---
name: agent-eval
description: >-
  Executes high-performance agent evaluations, multi-turn UserSim simulations, and declarative metric grading aligned with google/agents-cli and the Quality Flywheel. Publishes benchmark artifacts to the GCS Evaluation Registry, executes automated head-to-head delta comparisons (--compare-to), and optimizes system instructions via ADK GEPA (Genetic Evolutionary Prompt Optimization). Use when running agent benchmarks, evaluating ADK/FastAPI agents, diagnosing loss clusters, comparing prompt iterations, running GEPA prompt optimization, or serving evaluation dashboards. Don't use for raw agent code scaffolding (use google-agents-cli-scaffold) or infrastructure deployment (use google-agents-cli-deploy).
metadata:
  author: Google Cloud Professional Services
  license: Apache-2.0
  version: 1.2.0
  requires:
    bins:
      - agent-eval
---

# Agent Evaluation & Continuous Optimization Framework

This skill defines the end-to-end evaluation, benchmarking, automated optimization, and publication workflow using the **`agent-eval` CLI Pipeline** aligned with **`google/agents-cli`** and the **ADK Quality Flywheel** ([adk.dev/optimize](https://adk.dev/optimize/)).

---

## 1. Reference Architecture & Deep Guides

| Reference Guide | Contents |
| :--- | :--- |
| [`references/dataset_schema.md`](references/dataset_schema.md) | Canonical `dataset.jsonl` schema (single-turn, multi-turn, multi-agent topologies). |
| [`references/metrics_guide.md`](references/metrics_guide.md) | Declarative `eval_config.yaml` specification across 6 metric kinds. |
| [`references/gepa_optimization.md`](references/gepa_optimization.md) | Automated genetic prompt evolution via `GEPARootAgentPromptOptimizer`. |
| [`references/failure_triage.md`](references/failure_triage.md) | 2-Tier loss clustering and Context Engineering remediation strategies. |

---

## 2. The Standard `agent-eval run` Benchmark Command

Always execute benchmark sweeps using the standardized `--feature`, `--tag`, and `--publish` taxonomy against an active API server endpoint (`--base-url`):

```bash
export AGENT_EVAL_NO_PAUSES=1
export GOOGLE_GENAI_USE_VERTEXAI=1
export GOOGLE_CLOUD_PROJECT=<PROJECT_ID>

agent-eval run \
  --agent-dir app \
  --base-url http://localhost:8080 \
  --feature "<feature_or_branch_name>" \
  --tag "<short_iteration_tag>" \
  --description "<one-line summary of changes tested>" \
  --sim-parallelism 6 \
  --publish \
  --compare-to "<baseline_run_id_or_path>"
```

### Key CLI Flags & Defaults
* **`--feature`**: Git feature branch or capability under test (defaults to active git branch).
* **`--tag`**: Concise iteration slug (e.g. `direct-bypass-v1`, `calibrated-prompt-v2`).
* **`--description`**: Human-readable context saved into `eval_summary.json` and rendered in the dashboard.
* **`--sim-parallelism 6`**: Runs 6 scenarios in parallel, cutting multi-turn sweeps down to **~2.5 minutes**.
* **`--publish`**: Automatically syncs the entire output run directory to Google Cloud Storage (`gs://<PROJECT_ID>-eval-artifacts/runs/<run_id>/`).
* **`--compare-to`**: Resolves a baseline run (locally or directly from GCS) and generates delta percentage scorecards.

---

## 3. The 5-Stage Quality Flywheel Loop

```
1. Prepare Data (tests/eval/dataset.jsonl)
       └──► 2. Generate Traces (agent-eval generate --sim-parallelism 6)
              └──► 3. Grade Traces (agent-eval grade via eval_config.yaml)
                     └──► 4. Compare & Analyze (agent-eval compare <candidate> <baseline>)
                            └──► 5. Optimize via GEPA (agent-eval optimize --optimizer gepa)
```

### Stage 1: Prepare Data (`dataset.jsonl`)
* Ensure test scenarios are defined in `tests/eval/dataset.jsonl` (see [`references/dataset_schema.md`](references/dataset_schema.md)).

### Stage 2 & 3: Generate Traces & Grade
* `agent-eval run` executes the end-to-end collect → score → analyze loop.
* Or drive individual phases:
  - **Generate Traces**: `agent-eval generate --agent-dir app --sim-parallelism 6` (alias: `simulate` / `interact`)
  - **Grade Traces**: `agent-eval grade --traces tests/eval/results/<run_id>/raw/processed_interaction_sim.jsonl` (alias: `evaluate`)

### Stage 4: Compare Runs & Analyze Failures
* Compute head-to-head deltas between candidate and baseline runs:
```bash
agent-eval compare tests/eval/results/<candidate_run_id> tests/eval/results/<baseline_run_id>
```
* Or perform in-depth Gemini root-cause analysis:
```bash
agent-eval analyze --results-dir tests/eval/results/<run_id> --compare-to <baseline_run_id>
```

### Stage 5: Automated Prompt Optimization (ADK GEPA)
* When prompts underperform, run ADK's **`GEPARootAgentPromptOptimizer`** rather than manual trial-and-error:
```bash
agent-eval optimize --agent-dir app --optimizer gepa --target-metric business_logic_adherence --generations 5
```

---

## 4. Central GCS Evaluation Registry & Dashboard Access

All runs published with `--publish` are indexed in real time by the Evaluation Registry Viewer:

* **Local / Network Reverse Proxy**: `http://localhost:8550`
* **Cloud Run Endpoint**: `https://<EVAL_VIEWER_SERVICE>.run.app`
* **Direct Deep Link**: `http://localhost:8550/?run_id=<RUN_ID>`
* **Direct Standalone HTML Report**: `http://localhost:8550/report/<RUN_ID>`

---

## 5. Critical Operational Gotchas & Guardrails

* **Suppress Click Aborts (`AGENT_EVAL_NO_PAUSES=1`)**: Always export `AGENT_EVAL_NO_PAUSES=1` in headless scripts, subagents, and tests to prevent Click prompts from hanging on stdin.
* **Always Use `--base-url` Instead of `--in-process`**: OpenTelemetry global tracers cannot be safely forked across multi-process workers in `--in-process` mode. Running against an active `--base-url` enables full 6-worker concurrency.
* **PyOpenSSL Multithreading Locks**: Batch LLM grading can trigger `Context has already been used to create a Connection`. Ensure `urllib3.contrib.pyopenssl.extract_from_urllib3()` is called to delegate to Python's native `ssl` engine.
* **Clear Background Ports Before Starting Servers**: Run `fuser -k 8080/tcp` (or `8502/tcp`) before launching new `uvicorn` or `adk api_server` daemons to avoid `[Errno 98] address already in use`.
* **HTML Report Type Safety**: When sorting iterations in `_build_iterations_data`, ensure `_natural_key` returns homogeneous `(float, str)` tuples to prevent string-vs-int comparison errors.
