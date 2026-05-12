# Future Work

This file is the staging ground for things `agent-eval` could do better, plus the in-flight investigations we paused. **It exists for contributors** — pick something up, send a PR. None of these block day-to-day use of the tool today; the local pipeline (`agent-eval run`) is end-to-end validated and is what we recommend.

---

## 1. Re-validate the streamlined Agent Engine pass (`agent-eval agent-engine`)

### What it's supposed to do

`agent-eval agent-engine` wraps Vertex's `client.evals.create_evaluation_run()` so that — when your agent is already deployed to a Reasoning Engine — Vertex handles inference, scoring, and GCS upload in one managed call. No local agent server needed, no traces to capture yourself. The CLI follows the upstream [evaluation-agents-client docs pattern](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-agents-client) verbatim:

```python
client = genai.Client(http_options=HttpOptions(api_version="v1beta1"))
agent_info = AgentInfo.load_from_agent(root_agent, agent_resource_name=...)
run = client.evals.create_evaluation_run(
    dataset=..., metrics=..., agent_info=agent_info, dest=...
)
```

Implementation lives in `src/agent_eval/cli/commands/agent_engine.py` and `src/agent_eval/core/agent_engine_client.py`. The command is **currently not registered in `--help`** (`src/agent_eval/cli/main.py` — the `cli.add_command(agent_engine, ...)` line is commented out) so first-time users don't try it and hit the issue below. To re-enable for local debugging, uncomment that one line.

### Current status

Inference requests submitted via `create_evaluation_run()` started failing recently. The Vertex run lands in `FAILED` state with the deployed agent's events coming back without `content.parts`, which the SDK reports as **"Failed to parse agent run response []"**. The local pipeline (`agent-eval run` → `simulate` + `interact` + `evaluate`) is unaffected — it imports the agent module directly and never goes through `create_evaluation_run`.

We don't yet know whether this is:
- A regression in the deployed agent's response shape (ADK update or an agent-side change)
- A regression in the SDK's parsing of those responses
- Something we changed in the request payload we send to `create_evaluation_run`
- A server-side change in Vertex's evaluation backend

### What's already AE-ready in the code (don't redo this)

A non-trivial amount of work went into making the request shape correct and the failure modes legible. Before debugging fresh, read these files — most of the obvious traps are already handled:

- **`src/agent_eval/cli/commands/agent_engine.py:_resolve_bucket_location`** — decouples GCS bucket region from Vertex eval `--location`. Gemini 3+ defaults `--location` to `global`; GCS rejects `global` for STANDARD-class buckets, so we map `global → us-central1` (or whatever `--bucket-location` overrides to). This was a real customer-demo failure (April 23, 2026) — don't reintroduce.
- **`src/agent_eval/cli/commands/agent_engine.py:_build_agent_info`** — three-layer fallback for `AgentInfo` construction:
  1. **Full**: `AgentInfo.load_from_agent(agent, agent_resource_name=...)` walks `agent.tools` and emits JSON schemas.
  2. **Manual-from-agent**: `AgentInfo(name=..., instruction=..., tool_declarations=[])` from the imported agent's attributes. Used when `load_from_agent` trips on the ADK ↔ google-genai `tool_context: ToolContext` schema bug (a known SDK ↔ ADK seam issue).
  3. **Minimal-from-resource-name**: `AgentInfo(name="root_agent", agent_resource_name=...)` only. Used when local import itself fails (agent has deps not in agent-eval's venv). Eval still runs; tool-call-quality metrics may be unreliable because Vertex parses events server-side without the agent's tool schemas.
- **NaN-safe multi-turn classification** — earlier code crashed with `cannot convert float NaN to integer` when a row's `history` field was empty (pandas read it as float NaN). Multi-turn rows are now correctly skipped at the front (Agent Engine's `create_evaluation_run` is single-turn only) with a clear pointer to use `agent-eval simulate` for those.
- **Bucket auto-create on first run** — `google.cloud.storage.Client.create_bucket(location=<bucket_location>)` with the resolved location. Don't move that logic elsewhere; it's tested.
- **EvaluationDataset wrapper handling** — the SDK returns wrapped objects from `merge`; helpers in `agent_engine_client.py` unwrap correctly so health-check and merge paths don't crash on the wrapper type.
- **Failure summary** — when every row in a run fails, `agent-eval agent-engine` aborts with a structured error message instead of letting the autorater "score" empty error strings (which generates garbage metrics + wastes a GCS upload + a Vertex eval run).
- **"Re-deploy if you changed agent.py" reminder** — surfaced before submitting, because a stale Reasoning Engine deployment is a common silent cause of mismatched behavior.

### SDK pin (read before bumping)

`pyproject.toml` constrains `google-cloud-aiplatform[evaluation,agent-engines]>=1.132.0,<1.140.0`. Versions ≥1.140 changed the `AgentInfo` schema (drops `agent_resource_name`, requires an `agents`/`root_agent_id` map) AND tightened `AgentData` validation in `run_inference` to reject ADK's rich event fields. Bumping past this needs `_build_agent_info` rewritten for the new schema — that's a real chunk of work, not a one-line bump.

### How to reproduce

1. Deploy any ADK agent via Agent Starter Pack with `-d agent_engine`. The simplest path is the rag-mini reproducer at `agents/rag-mini/` (instructions in its README).
2. Confirm `deployment_metadata.json` shows a valid `remote_agent_engine_id` (not the placeholder string `"None"`).
3. Re-enable the command: in `src/agent_eval/cli/main.py`, uncomment the `cli.add_command(agent_engine, name="agent-engine")` line.
4. Install the agent's deps in agent-eval's venv: `uv pip install -e agents/rag-mini/`.
5. Run: `cd agents/rag-mini && agent-eval agent-engine --debug`. The `--debug` flag exposes the full SDK logs.
6. The run will eventually transition to `FAILED`. Inspect the events Vertex returned (the CLI prints them when `--debug` is on), and inspect what we sent (request payload is logged at INFO under debug).

### Suggested debugging path

- Compare the request payload we build (`_project_to_run_inference_shape` in `agent_engine.py`) against the latest [evaluation-agents-client](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-agents-client) docs. If the docs have evolved, the canonical 2-column shape for `run_inference` may have changed.
- Check what the deployed agent actually returns when invoked outside `create_evaluation_run` (call it directly with the SDK, log the raw response). If `content.parts` is empty there too, the issue is on the deployment side, not in our wiring.
- Try the SDK's own example payload from the docs against the same deployed agent. If their example also fails, the issue is upstream.
- Try a minimal request-shape variant (just `prompt`, no `session_inputs`) to isolate whether session seeding is the trigger.

When fixed, remove this section, re-enable the `cli.add_command()` line, and update `docs/reference.md`'s `### agent-engine` callout to remove the "currently being re-validated" warning.

---

## 2. Make deterministic metrics resilient across model API schemas

### Why this matters

Every token / cache / thinking metric `agent-eval` reports is computed by reading **specific field names** off each LLM call's response payload. Today those names are hardcoded to today's Gemini API surface. When a future model family ships and renames or restructures these fields, the affected metrics will silently report `0` instead of crashing — same failure mode as the per-tool-call latency keys we patched in May 2026. Sanity-check `eval_summary.json` for unexpected zeros after any model bump.

### What's hardcoded today

All in `src/agent_eval/core/deterministic_metrics.py`. The pattern is `usage = response_data.get("usage_metadata", {})` then specific `.get(<field_name>)` calls:

| Field name | Used for | Added to Gemini in |
|---|---|---|
| `prompt_token_count` | `token_usage.prompt_tokens`, `cache_efficiency.total_input_tokens` | always present |
| `candidates_token_count` | `token_usage.completion_tokens`, `thinking_metrics.total_candidate_tokens` | always present |
| `cached_content_token_count` | `token_usage.cached_tokens`, `cache_efficiency.cache_hit_rate` | Gemini 1.5+ |
| `total_token_count` | `token_usage.total_tokens` | always present |
| `thoughts_token_count` | `thinking_metrics.total_thinking_tokens`, `thinking_metrics.reasoning_ratio` | Gemini 2.5+ thinking models |

Verified against **Gemini 3 Flash, Gemini 3.1 Flash, and Gemini 3.1 Pro**. If a future Gemini family renames any of these fields (likely — Google has renamed several between major versions), the affected metric reports `0` and we never know.

### What other providers do

For reference, in case you want to abstract this:

- **OpenAI**: `response.usage.prompt_tokens` / `usage.completion_tokens`. Reasoning models (o1, o3) added `usage.completion_tokens_details.reasoning_tokens`. No native cache field — caching is handled transparently and shows up as `usage.prompt_tokens_details.cached_tokens`.
- **Anthropic**: `response.usage.input_tokens` / `usage.output_tokens`. Caching uses `usage.cache_creation_input_tokens` (writing to cache) and `usage.cache_read_input_tokens` (reading from cache) — these are SEPARATE counters, not a single "cached" total. Extended thinking (Claude 3.7+) doesn't expose a thinking-token count; you'd derive it from response timing or content blocks.
- **Cohere / Mistral / etc.**: each has its own shape.

### Suggested abstraction path

A per-provider extractor registry, dispatched on detected model family:

```python
# src/agent_eval/core/usage_extractors.py
class UsageExtractor(Protocol):
    def supports(self, model_id: str) -> bool: ...
    def extract(self, response_data: dict) -> dict[str, int]: ...
        # returns {prompt_tokens, completion_tokens, cached_tokens,
        #         thinking_tokens, total_tokens}

class GeminiUsageExtractor: ...   # current behavior, isolated
class OpenAIUsageExtractor: ...
class AnthropicUsageExtractor: ...

EXTRACTORS = [GeminiUsageExtractor(), OpenAIUsageExtractor(), AnthropicUsageExtractor()]

def extract_usage(response_data: dict, model_id: str) -> dict[str, int]:
    for ex in EXTRACTORS:
        if ex.supports(model_id):
            return ex.extract(response_data)
    return {}  # unknown provider — emit a warning once
```

Then `deterministic_metrics.py` uses `extract_usage(...)` everywhere it currently calls `usage.get("...")`. Each provider extractor is one file; adding a new provider is one file + one entry in the registry.

The defensive logging matters too: when `extract_usage` returns an empty dict (unknown provider) OR when an expected field is missing (`prompt_token_count` is None in a Gemini response), log a single warning per provider per session — don't spam, but do tell the user something doesn't add up.

---

## 3. Framework portability — currently ADK-only

### Why this matters

`agent-eval` was built on top of and for [ADK](https://adk.dev). Most of its surfaces assume ADK conventions (an `agent.py` file with a `root_agent` symbol, ADK's UserSim driver, ADK's FastAPI endpoint shape, ADK's OTel trace shape). The Vertex SDK eval surface itself is framework-neutral — `client.evals.evaluate()` doesn't care what produced the data — but the trace-collection layer is not.

If you want to evaluate a non-ADK agent today, you'd need to BYO traces in the canonical Vertex schema and bypass `simulate` + `interact` entirely (the BYOD `ingest-traces` path is roadmap-only — see `docs/reference.md` → Experimental & on the roadmap).

### What's hardcoded to ADK today

| Surface | Where | What it assumes |
|---|---|---|
| Agent discovery | `src/agent_eval/core/path_detector.py` | rglobs for `agent.py`. Non-ADK agents (LangGraph, AutoGen, CrewAI, plain google-genai) won't match. |
| Agent import | multiple call sites | imports `<pkg>.agent:root_agent`. The `root_agent` name is ADK convention. |
| Multi-turn driver | `src/agent_eval/cli/commands/simulate.py` | shells out to `adk eval` (the ADK CLI's UserSim). Non-ADK agents have no equivalent. |
| Single-turn driver | `src/agent_eval/cli/commands/interact.py` | hits ADK's REST endpoints (`/run`, `/debug/trace`). Non-ADK frameworks expose different endpoints (e.g. LangGraph's `/invoke` + `/stream`). |
| Trace shape | `src/agent_eval/core/converters.py` | parses ADK's OTel span shape (`gcp.vertex.agent.tool_response`, etc.) and ADK's session events. |
| Tool-context schema | `src/agent_eval/cli/commands/agent_engine.py:_build_agent_info` | works around the ADK ↔ google-genai `ToolContext` schema bug. |

### What's already framework-neutral

These surfaces don't need changes for a non-ADK agent — they already operate on the canonical Vertex SDK schema:

- **Dataset schema** (`prompt`, `response`, `reference`, `history`, `intermediate_events`, `session_inputs`, …) — Vertex's, not ours.
- **Metric definitions** (`metric_definitions.json` — six `kind` values, `core/metric_schema.py` is the single source of truth).
- **Evaluator dispatch** (`metric_factory.build_metric` routes through `client.evals.evaluate()` regardless of what produced the rows).
- **HTML report** (`core/html_report.py`) — reads `eval_summary.json` and the per-question CSV; doesn't know or care about the agent framework.
- **Analyze step** (`core/analyzer.py`) — Gemini diagnoses based on metric movement and trace content, not framework specifics.
- **Deterministic metrics aggregation** (modulo the model-API hardcoding from §2 above) — operates on parsed traces.

### Suggested abstraction path

Two protocols would unlock most of the value:

```python
# src/agent_eval/core/agent_drivers.py
class MultiTurnDriver(Protocol):
    def run_simulation(self, scenarios: Path, agent_dir: Path) -> Path: ...
        # returns path to per-scenario trace JSONL

class SingleTurnDriver(Protocol):
    def call(self, prompt: str, base_url: str | None) -> dict: ...
        # returns {response, trace, latency, tool_interactions}

class ADKMultiTurnDriver: ...     # wraps current simulate.py logic
class ADKSingleTurnDriver: ...    # wraps current interact.py logic
class LangGraphMultiTurnDriver: ...   # contributor adds these
# etc.
```

Plus a trace converter protocol so non-ADK trace shapes can be normalized into the canonical schema before hitting the evaluator:

```python
# src/agent_eval/core/trace_converters.py
class TraceConverter(Protocol):
    def supports(self, raw: bytes) -> bool: ...
    def to_canonical(self, raw: bytes) -> dict: ...
        # canonical shape: prompt, response, intermediate_events,
        # tool_interactions, latency_data, ...
```

Then `convert.py` (the existing utility) becomes a shell that picks the right converter. Most of the work is isolated to `simulate.py`, `interact.py`, and `converters.py`. The `evaluate` / `analyze` / `report` chain wouldn't change.

---

## How to contribute

1. Pick a section above. Open an issue against [the upstream PSO repo](https://github.com/GoogleCloudPlatform/professional-services) referencing this file so others know you're on it.
2. Send a PR. Follow the upstream [`CONTRIBUTING.md`](https://github.com/GoogleCloudPlatform/professional-services/blob/main/CONTRIBUTING.md) (CLA, Apache 2.0 headers, no sub-LICENSE, yapf format pass).
3. When the work lands, remove the corresponding section from this file.

Or: your own idea isn't here. Send a PR and add a section.
