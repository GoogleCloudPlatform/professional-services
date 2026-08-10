# Future Work

This file is the staging ground for things `agent-eval` could do better, plus the in-flight investigations we paused. **It exists for contributors** — pick something up, send a PR. None of these block day-to-day use of the tool today; the local pipeline (`agent-eval run`) is end-to-end validated and is what we recommend.

---

## 1. Upgrade of the SDK Pin & Vertex Evaluation API Platform Limits

### What was accomplished
We successfully resolved the outdated SDK dependency debt by bumping the Vertex AI SDK pin to `>=1.156.0,<2.0.0` in `pyproject.toml`. This upgrade aligned the CLI with the modern GenAI Evaluation API surface. Specifically:
- **`_build_agent_info` Rewrite:** Rewrote the `AgentInfo` builder in `src/agent_eval/cli/commands/agent_engine.py` to match the new `1.140.0+` schema. It now constructs the `AgentInfo` using the required nested `agents` mapping and `root_agent_id`, successfully dropping the deprecated `agent_resource_name` field.
- **mTLS Issue Resolution:** Resolved connection crashes on Python 3.13 by removing the obsolete `pyopenssl` monkey-patching wrapper from our dependencies.
- **Local Suite Validation:** Ran and fully validated the complete CLI local suite (198/198 pytest tests passing under the upgraded environment).

### Upstream Platform Bug & Backend Scorer Mismatch
While local Pydantic validations pass perfectly, E2E testing against the live Vertex backend revealed a structural API mismatch when executing server-side runs:
1. **The Linking Constraint:** In modern SDK versions, passing `agent_info` to `create_evaluation_run` strictly forces you to also pass `agent` (the reasoning engine resource).
2. **The Server-Side Tracer Crash:** Linking the reasoning engine triggers server-side simulation and trace logging. When the backend attempts to parse ADK's complex, rich event logs on the server, the parser throws an exception resulting in a generic `INTERNAL: Internal error occurred` failure.
3. **The Pre-computed Workaround:** We successfully verified that calling `create_evaluation_run` with a pre-computed GCS dataset **succeeds completely** if both the `agent` and `agent_info` parameters are omitted. However, doing so prevents the evaluator from scoring agent-specific metrics like `TOOL_USE_QUALITY` (which require `agent_info` to resolve tool schemas).

### Recommended Workflow Alignment
For standard evaluation loops, users should prefer:
- **The Local Pipeline (`agent-eval run`):** This runs the simulation and captures intermediate traces client-side. The CLI flattens the ADK traces and submits them via client-side `evaluate()`. This is robust, framework-agnostic, supports all custom/managed metrics (including `TOOL_USE_QUALITY`), and bypasses all server-side tracer bugs.
- **The Managed Batch Pipeline:** If you must use `create_evaluation_run` for large batch files on the backend, only use it for non-agent metrics (`GENERAL_QUALITY`, custom LLM judges) and do not pass `agent`/`agent_info`.

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
