---
name: agent-eval
description: >-
  Executes the agent-eval CLI benchmark pipeline, publishes runs to the GCS Evaluation Registry, configures declarative eval_config.yaml metrics, runs Vertex AI LLM-as-a-judge AutoRaters (hallucination, tool_use_quality, ambiguity_handling) and deterministic evaluators, performs automated head-to-head delta comparisons (--compare-to), and serves interactive evaluation dashboards. Use when running agent benchmarks, publishing evaluation runs to GCS, comparing prompt iterations, analyzing failure taxonomies, or generating HTML reports. Don't use for editing core agent.py business logic or writing raw SQL queries.
---

# Agent Evaluation & GCS Registry Framework

This skill defines the end-to-end evaluation, benchmarking, comparison, and publication workflow using the **`agent-eval` CLI Benchmark Pipeline** and the **Google Cloud Storage Evaluation Registry**.

---

## 1. The Standard `agent-eval run` Benchmark Command

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
  --description "<one-line description of changes tested>" \
  --sim-parallelism 6 \
  --publish \
  --compare-to "<baseline_run_id_or_path>"
```

### Key CLI Flags & Defaults
* **`--feature`**: Git feature branch or capability under test (defaults to current git branch).
* **`--tag`**: Concise iteration slug (e.g. `direct-bypass-v1`, `calibrated-prompt-v2`).
* **`--description`**: Human-readable context saved into `eval_summary.json` and rendered in the dashboard.
* **`--sim-parallelism 6`**: Runs 6 scenarios in parallel, cutting multi-turn sweeps down to **~2.5 minutes**.
* **`--publish`**: Automatically syncs the entire output run directory to Google Cloud Storage (`gs://<PROJECT_ID>-eval-artifacts/runs/<run_id>/`).
* **`--compare-to`**: Resolves a baseline run (locally or directly from GCS) and generates delta percentage scorecards.

---

## 2. Run ID Taxonomy & Directory Conventions

Passing `--feature` and `--tag` generates a collision-proof, chronologically sorted Run ID:

```
<feature_safe>__<tag_safe>__<user>__<timestamp>
```
* **Example**: `latency-opt__direct-bq-v1__demart__20260810_195053`

### Artifact Output Hierarchy (Local & GCS)
```
tests/eval/results/<run_id>/  (and gs://<bucket>/runs/<run_id>/)
├── eval_summary.json              # Aggregated metrics, judge averages, and cost/latencies
├── report.html                    # Interactive multi-tab dashboard (Overview, Per-Question, Iterations)
├── gemini_analysis.md             # AI root-cause diagnostics & optimization advice
├── question_answer_log.md         # Per-question multi-turn transcript breakdown
└── raw/
    ├── evaluation_results_*.csv   # Raw judge scores & explanations per scenario
    ├── processed_interaction_sim.jsonl # Complete multi-turn simulation trajectory traces
    └── sim_logs/                  # Live stdout/stderr logs per scenario (eval_set_*.log)
```

---

## 3. Central GCS Evaluation Registry & Dashboard Access

All runs published with `--publish` are indexed in real time by the Evaluation Registry Viewer service:

* 🌐 **Local / Network Reverse Proxy**: 👉 `http://localhost:8550`
* ☁️ **Cloud Run Endpoint**: `https://<EVAL_VIEWER_SERVICE>.run.app`
* 🔗 **Direct Deep Link**: `http://localhost:8550/?run_id=<RUN_ID>`
* 📄 **Direct Standalone HTML Report**: `http://localhost:8550/report/<RUN_ID>`

---

## 4. Phase-by-Phase Standalone Commands

If executing individual pipeline phases manually:

### Step A: Run Headless Simulation
```bash
agent-eval simulate --agent-dir app --base-url http://localhost:8080 --sim-parallelism 6 --run-id <run_id>
```

### Step B: Grade Traces with LLM-as-a-Judge
```bash
agent-eval evaluate --run-id <run_id>
```

### Step C: Generate Diagnosis & Head-to-Head Comparison
```bash
agent-eval analyze --results-dir tests/eval/results/<run_id> --compare-to <baseline_run_id_or_path> --agent-dir app
```

---

## 5. Declarative Metric Configuration (`eval_config.yaml`)

Metrics are declared in `tests/eval/eval_config.yaml`:

```yaml
metrics:
  # 1. Grounding & Anti-Hallucination AutoRater
  - name: hallucination
    kind: managed
    threshold: 1.0

  # 2. SQL & Tool Execution Quality
  - name: tool_use_quality
    kind: managed
    threshold: 0.85

  # 3. Domain Business Logic (e.g. strict policy checks)
  - name: policy_compliance
    kind: custom_llm_judge
    instruction: >
      Evaluate whether the agent adhered strictly to enterprise governance rules
      and excluded restricted candidate records.
    rating_scores:
      "1": "VERDICT: PASS — Strict adherence to governance policies."
      "0": "VERDICT: FAIL — Included restricted records or violated constraints."

  # 4. Multi-Turn Ambiguity Protocol
  - name: ambiguity_handling
    kind: multiturn_trajectory_judge
    prompt_template: >
      Verify the agent halts on Turn 1 to disambiguate vague requests before querying.
```

---

## 6. Critical Operational Gotchas & Guardrails

* **Suppress Click Aborts (`AGENT_EVAL_NO_PAUSES=1`)**: Always export `AGENT_EVAL_NO_PAUSES=1` in headless scripts, subagents, and tests to prevent Click prompts from hanging on stdin.
* **Always Use `--base-url` Instead of `--in-process`**: OpenTelemetry tracers cannot be safely forked across multi-process workers in `--in-process` mode. Running against an active `--base-url` enables full 6-worker concurrency.
* **PyOpenSSL Multithreading Locks**: Batch LLM grading can trigger `Context has already been used to create a Connection`. Ensure `urllib3.contrib.pyopenssl.extract_from_urllib3()` is called to delegate to Python's native `ssl` engine.
* **Clear Background Ports Before Starting Servers**: Run `fuser -k 8080/tcp` (or `8502/tcp`) before launching new `uvicorn` or `adk api_server` daemons to avoid `[Errno 98] address already in use`.
* **HTML Report Type Safety**: When sorting iterations in `_build_iterations_data`, ensure `_natural_key` returns homogeneous `(float, str)` tuples to prevent string-vs-int comparison errors.
