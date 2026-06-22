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
"""Long-form bite-sized essays shown during long-running phases (sim, interact).

Each story is a 250-400 word mini-essay covering one concept in depth — the
WHAT, the WHY, and concrete advice. Goal: turn 10-minute simulate waits into
genuine learning time. The pool is large enough that users see something
new each run.

Tone:
- Specific, not generic. Real numbers, real file names, real patterns.
- Each story should answer a question the reader didn't know they had.
- Multiple paragraphs OK. Reading time per story: 1-2 minutes.

Add new stories freely — append to STORIES below. Each entry is a
``(title, body)`` tuple. The body is plain prose; Rich markup is allowed.
"""

from __future__ import annotations

import random

# (title, body) — bodies should read in 60-120 seconds (250-400 words).
STORIES: list[tuple[str, str]] = [
    (
        "Why parallel sim hits Amdahl's law",
        "ADK's `adk eval` runs scenarios sequentially within a single eval_set. "
        "If you have three scenarios and each takes four minutes, the total "
        "wall-clock is twelve minutes — full stop. There's no flag that makes "
        "ADK fan them out internally.\n\n"
        "agent-eval works around this by [bold]splitting your scenarios into "
        "N separate eval_sets and firing N subprocesses in parallel[/]. Each "
        "subprocess writes its own trace file (timestamp-suffixed, no "
        "collisions), and we merge the results at the end. With three "
        "scenarios in flight at once, three minutes of CPU time still costs "
        "three minutes of wall-clock — but the [cyan]other[/] two scenarios "
        "ran for free underneath it.\n\n"
        "The catch is Amdahl's law. Wall-clock equals the slowest single "
        "scenario, not the average. If one scenario hits a heavy retrieval "
        "loop (say, 7 minutes) while two others finish in 2 minutes, parallel "
        "saves you 4 minutes — but you still wait 7. The only further lever "
        "is making that one scenario lighter: shorter conversation_plan, "
        "tighter tool-call caps in the agent, or a faster judge model.\n\n"
        "We log the per-scenario timing at the end of the sim phase so you "
        "can see the distribution. If the slowest is 3× the fastest, that's "
        "where to optimize next.",
    ),
    (
        "LLM-as-judge is itself an LLM",
        "Vertex AI's [cyan]GENERAL_QUALITY[/], [cyan]TOOL_USE_QUALITY[/], "
        "[cyan]HALLUCINATION[/] and friends aren't deterministic. Each one "
        "is a prompt template fed to a Gemini model — the [bold]autorater[/] "
        "— which reads your agent's input and output and emits a structured "
        "verdict (pass/fail or 1-5). The score you see in the eval table is "
        "the autorater's interpretation, not ground truth.\n\n"
        "This has two consequences. First, [bold]LLM judges are stochastic[/]. "
        "Run the same evaluation twice on the same data and you'll see ±5% "
        "variance on small datasets, more on multi-tier rubrics. The autorater "
        "model itself has non-zero temperature for diversity. agent-eval's "
        "analyzer knows this — small deltas on small-N rows get explicitly "
        "labeled as noise in the AI report rather than flagged as regressions.\n\n"
        "Second, [bold]judges have prompts that you can audit[/]. Vertex's "
        "managed metrics use opinionated rubrics — [cyan]TOOL_USE_QUALITY[/] "
        "checks for clarification of ambiguous requests, refusal of out-of-domain "
        "queries, and grounded reasoning. If your agent scores low and you "
        "disagree, the per-question-log shows the autorater's exact verdict + "
        "rationale per row. Read it. Sometimes the autorater is right and your "
        "agent really is sloppy. Sometimes the rubric is mis-targeted for your "
        "domain — that's when you write a [cyan]custom_llm_judge[/] metric "
        "with criteria you control.\n\n"
        "Treat managed metrics as a strong default, not gospel.",
    ),
    (
        "Binary rubrics beat multi-tier ones",
        "When you're writing a [cyan]custom_llm_judge[/] metric, you face a "
        "tempting choice: should the rubric output be binary (pass/fail) or "
        "graded (1-5)? The 1-5 feels richer — surely more granularity gives "
        "more signal? In practice, the opposite.\n\n"
        "LLM judges have notoriously poor inter-rater reliability on multi-tier "
        "scales. Ask the same autorater the same question twice and it might "
        "give you a 3 then a 4. Ask it whether a response is unambiguously "
        "good or bad and it'll be much more consistent. The granularity you "
        "lose at the per-row level you regain in batch — averaging 20 binary "
        "scores across a dataset gives you a continuous score with much better "
        "statistical properties than averaging 20 noisy 1-5 scores.\n\n"
        "There's a second reason: [bold]binary forces you to decompose[/]. "
        'Instead of one fuzzy [cyan]"response_quality"[/] metric on a 1-5 '
        "scale, you write [cyan]cites_source_when_required[/] (binary), "
        "[cyan]respects_word_limit[/] (binary), [cyan]refuses_out_of_domain[/] "
        "(binary). Each one names a concrete observable behavior a human "
        "reviewer would answer the same way every time. The dashboard shows "
        "you which specific dimension is weak — actionable per-criterion, not "
        "a single number you can't decompose.\n\n"
        "agent-eval's metric generator (Gemini Call 2) defaults to binary "
        "[cyan]rating_scores[/] for exactly these reasons. You can override "
        "to multi-tier when the criterion truly cannot be decomposed (a real "
        "stylistic spectrum), but treat that as the exception.",
    ),
    (
        "The five Context Engineering pillars",
        "Most agent performance problems map onto one of five patterns. "
        "Naming them helps you skip the diagnosis and go straight to the fix.\n\n"
        "[bold cyan]Offload[/] — move deterministic logic out of the LLM. "
        "Every if/else the model has to reason through is latency + tokens. "
        "Sub-agent routing tables, dispatch maps, validation logic — these "
        "belong in Python tools, not in the prompt. Symptom: high "
        "[cyan]thinking_metrics.reasoning_ratio[/] on simple queries.\n\n"
        "[bold cyan]Reduce[/] — compact stale context. Tool outputs that "
        "balloon the conversation history (full markdown tables, raw documents) "
        "kill cache and saturate the window. Truncate in an [cyan]after_tool_callback[/] "
        "or store the full result in [cyan]tool_context.state[/] and return a "
        "summary. Symptom: [cyan]context_saturation.max_total_tokens[/] climbing "
        "across turns.\n\n"
        "[bold cyan]Retrieve[/] — replace static knowledge in the prompt with "
        "RAG. If your system instruction is 5000 tokens of policy that rarely "
        "changes, that's wasted context — index it and let the agent fetch on "
        "demand. Symptom: low cache hit rate despite stable instructions.\n\n"
        "[bold cyan]Isolate[/] — split monolithic agents into specialized "
        "sub-agents. One agent juggling 12 tools confuses itself. Three agents "
        "with 4 tools each, behind a router, almost always outperforms. "
        "Symptom: [cyan]tool_use_quality[/] low, [cyan]agent_handoffs[/] high.\n\n"
        "[bold cyan]Cache[/] — restructure for prefix caching. Vertex caches "
        "prompts that share stable prefixes. Move static text to "
        "[cyan]global_instruction[/] and dynamic state to [cyan]instruction[/]. "
        "Symptom: [cyan]cache_efficiency.cache_hit_rate[/] under 50%.\n\n"
        "agent-eval's analyzer knows all five and labels its recommendations "
        "with the relevant pillar. Read those labels — they're a learned "
        "vocabulary worth absorbing.",
    ),
    (
        "Why we sweep ADK's eval_config criteria",
        "Agent Starter Pack scaffolds usually ship a [cyan]tests/eval/eval_config.json[/] "
        "with active scoring criteria like [cyan]rubric_based_final_response_quality_v1[/] "
        "or [cyan]hallucinations_v1[/]. ADK reads this file when you run "
        "[cyan]adk eval[/], and for every interaction the simulator produces, "
        "ADK fires its [bold]own[/] LLM autorater against those criteria. "
        "Per turn. Synchronously. Slow.\n\n"
        "Now consider what agent-eval is doing in parallel: it scores the same "
        "traces in batch via Vertex AI's evaluation API — async, parallel "
        "across metrics, with a richer schema. You don't need both. Running "
        "both means every row gets scored twice (once by ADK on the way out, "
        "once by us on the way in), and the ADK pass adds 30-90 seconds per "
        "turn that you can't see — it just looks like a slow simulator.\n\n"
        "So when agent-eval simulate detects non-empty [cyan]criteria[/] in "
        "your eval_config, it [bold]backs the file up[/] to "
        "[cyan]tests/eval/.backup/<timestamp>/[/] and replaces it with empty "
        "criteria. ADK's per-turn scoring goes silent. Wall-clock drops "
        "dramatically. You lose nothing — agent-eval's batch metrics already "
        "cover the same ground (and more, with custom_llm_judge entries you "
        "can tailor).\n\n"
        "The backup is forever. If you want those original criteria as proper "
        "agent-eval custom metrics, the rubrics and thresholds are right there "
        "in the backup file — translate them into [cyan]metric_definitions.json[/] "
        "with [cyan]kind: custom_llm_judge[/]. A future agent-eval feature "
        "(parked as Phase H5) will do this translation with one Gemini call.",
    ),
    (
        "What the autorater sees vs what your agent saw",
        "When [cyan]TOOL_USE_QUALITY[/] scores your agent, the autorater "
        "doesn't see your code. It sees four things: the user's prompt, the "
        "agent's final response, the [cyan]intermediate_events[/] (what tools "
        "got called with what arguments), and Vertex's built-in rubric for "
        "tool-using agents.\n\n"
        "That rubric checks several specific behaviors. Did the agent ask for "
        "clarification when the prompt was ambiguous? Did it refuse politely "
        "when the request was out-of-domain? Did the tool calls match the "
        "user's actual intent, or did the agent fire tools speculatively? Did "
        "it cite which tools produced which facts in its final answer? You "
        "can read the autorater's exact rubric in Vertex's docs under "
        "[cyan]rubric-metric-details[/] — it's worth a 5-minute read.\n\n"
        "What this means in practice: a low [cyan]TOOL_USE_QUALITY[/] score "
        'almost never means "the tool crashed". The deterministic '
        "[cyan]tool_success_rate[/] catches that — it'll be 1.0 when the "
        "Python functions executed cleanly. A low semantic score means the "
        "agent [bold]used the tool stupidly[/]: called it for an out-of-scope "
        "query, fired it 3 times in a row with similar arguments, didn't "
        "explain its reasoning, ignored the tool's output in the final "
        "response.\n\n"
        "The fix is rarely in the tool. It's in the orchestrator's "
        'instructions and constraints — "Do NOT call this tool more than '
        'once per turn", "If the user\'s reference is ambiguous, ASK for '
        'clarification". The autorater rewards explicit guardrails.',
    ),
    (
        "Why we cap max_allowed_invocations",
        "ADK's user simulator has a knob called [cyan]max_allowed_invocations[/] "
        "in [cyan]eval_config.user_simulator_config[/]. It's the maximum "
        "number of turns the simulated user will send before giving up. "
        "Default: 20.\n\n"
        "If your scenario's [cyan]conversation_plan[/] is 3 follow-ups, you "
        "might think the simulator stops at turn 4 (initial prompt + 3 "
        "follow-ups). It doesn't. The simulator reads the plan as goals to "
        "ACCOMPLISH, not steps to execute literally. If the agent's response "
        "doesn't satisfy the plan, the simulator improvises — asking "
        "clarifying questions, rephrasing, pushing back — until it either "
        "achieves the goal or hits the cap.\n\n"
        "On a slow agent (40-second responses), the difference between "
        "stopping at turn 4 and stopping at turn 20 is 10 minutes per "
        "scenario. agent-eval computes the deepest plan in your projected "
        "scenarios and sets [cyan]max_allowed_invocations[/] to that plus 2 "
        "(small safety margin for one clarifying turn). For typical 3-turn "
        "plans, the cap is 5 — sim stops cleanly when the plan is done.\n\n"
        "If you've pinned a custom value in your eval_config (you know what "
        "you're doing), agent-eval respects it. The CLI prints which value "
        "got applied so you can verify. If a scenario needs the simulator to "
        "improvise more (genuine open-ended testing), bump the cap — but "
        "expect the wall-clock to climb proportionally.",
    ),
    (
        "Reference data isn't single-turn-only",
        "For a long time agent-eval's data generator emitted two row buckets: "
        "multi-turn scenarios in [cyan]scenarios[]\\[][/], single-turn examples "
        "in [cyan]golden_data[]\\[][/]. Multi-turn rows had [cyan]conversation_plan[/]; "
        "single-turn rows had [cyan]reference_data[/]. The buckets were "
        "disjoint, and no row ever had both.\n\n"
        "This was an artifact, not a constraint. The evaluator's per-row "
        "capability check was already designed to handle [bold]any[/] "
        "combination — a row with both [cyan]conversation_plan[/] AND "
        "[cyan]reference_data[/] populated would happily route to a metric "
        "flagging both [cyan]requires_multi_turn[/] AND [cyan]requires_reference[/]. "
        "We just never produced such a row.\n\n"
        "The use case is real and powerful: \"judge the agent's trajectory "
        'AND compare its final answer to a known-good answer". Imagine a '
        "RAG agent that should both navigate clarification correctly AND land "
        "on the right document. That's two signals from one test, captured "
        "by one metric. Without multi-turn-with-reference rows, you'd have "
        "to score those separately and reason about whether good navigation "
        "with a wrong final answer counts as success.\n\n"
        "Now multi-turn rows can carry [cyan]reference_data[/]. The data "
        "generator emits them when a metric needs both flags. The simulate→"
        "convert pipeline propagates the reference through to the saved "
        "interaction row by joining the trace's first user message back to "
        "the source dataset.jsonl row's prompt. The result: one metric, one "
        "row, two signals.",
    ),
    (
        "Cache hit rate is a structural metric",
        "Vertex AI's prefix caching is one of the few free wins in LLM cost. "
        "If two requests share a long stable prefix (system instructions, "
        "tool definitions, few-shot examples), the second one only pays for "
        "the suffix. On token-heavy agents this can drop costs by 50-80%.\n\n"
        "But caching is finicky. The prefix has to be byte-identical, and "
        "ANY dynamic content (timestamps, session IDs, retrieved chunks) "
        "near the start of the prompt poisons the cache for everything that "
        "follows. A common mistake: putting per-turn state into the agent's "
        "[cyan]instruction[/] field, which Vertex treats as part of the "
        "prefix. Each turn has different state → no two turns share a prefix "
        "→ cache hit rate near zero.\n\n"
        "The fix is mechanical. Move all static content (rules, tool "
        "descriptions, persona, output format) to ADK's "
        "[cyan]global_instruction[/] field. Keep [cyan]instruction[/] for "
        "the few dynamic bits that genuinely must vary per turn. The "
        "[cyan]global_instruction[/] gets pinned to the prefix; "
        "[cyan]instruction[/] sits after it. Vertex caches the prefix "
        "across turns and across users.\n\n"
        "If [cyan]cache_efficiency.cache_hit_rate[/] is below 50%, you almost "
        "certainly have static content in [cyan]instruction[/] that should "
        "live in [cyan]global_instruction[/]. The fix takes 5 minutes and "
        "often cuts cost in half. agent-eval's analyzer surfaces this as a "
        "[bold]Cache[/] pillar recommendation when the rate is low.",
    ),
    (
        "What the converter does to ADK traces",
        "ADK emits OpenTelemetry-style traces during eval — nested span "
        "trees with timing, tool calls, model requests, agent transitions. "
        "Beautiful for debugging, but not directly consumable by Vertex's "
        "FLATTEN evaluation schema, which wants one flat row per interaction "
        "with [cyan]prompt[/], [cyan]response[/], [cyan]history[/], "
        "[cyan]intermediate_events[/], [cyan]reference[/].\n\n"
        "[cyan]AdkHistoryConverter[/] does the bridge. It walks each "
        "[cyan].adk/eval_history/*.json[/] file, finds the user turns and "
        "agent responses in the span tree, builds a [cyan]contents: \\[][/] "
        "array in Vertex's Gemini-batch format, computes deterministic "
        "metrics from the span timings (latency, token usage, tool success "
        "rate, cache stats, thinking ratio), and emits a single JSONL row "
        "per scenario.\n\n"
        "It also performs one critical join: [bold]reference data isn't in "
        "the trace[/]. ADK doesn't know about your dataset.jsonl — it just "
        "ran the scenario you handed it. The converter joins the trace back "
        "to the source row by matching the [cyan]starting_prompt[/] (which "
        "IS preserved verbatim as the first user message in the trace) "
        "against a prompt→reference_data map that agent-eval builds from "
        "dataset.jsonl just before invoking the converter.\n\n"
        "Without this join, every multi-turn metric requiring "
        "[cyan]reference_data[/] would silently skip every row at evaluation "
        "time — the data was right there in your dataset, but the trace had "
        "lost track of which dataset row produced it. The fix lives in "
        "[cyan]converters.py:_resolve_reference_data[/] and is one of the "
        "most impactful fixes in agent-eval's history.",
    ),
    (
        "Why init's Gemini chain has three calls",
        "[cyan]agent-eval init[/] makes three Gemini calls when you opt into "
        "AI metric generation, and the order matters. Each call has a "
        "narrow, fact-extracting job; chaining them works better than one "
        "monolithic call.\n\n"
        "[bold]Call 1: analyze the agent.[/] Reads your [cyan]agent.py[/] "
        "and any sub-agent files, extracts the tools you defined (with "
        "their docstrings), the [cyan]state_variables[/] the agent uses, "
        "the sub-agent topology, and the agent's stated key behaviors. "
        "This is pure factual extraction — low hallucination risk because "
        "the source code is concrete.\n\n"
        "[bold]Call 2: generate metric_definitions.json.[/] Takes Call 1's "
        "analysis plus your selected managed metrics and drafts 2-4 "
        "[cyan]custom_llm_judge[/] metrics tailored to this specific "
        "agent's tools and behaviors. The prompt enforces binary "
        "[cyan]rating_scores[/] by default and requires every criterion to "
        "name a concrete observable behavior. Output is canonical-schema, "
        "ready to score.\n\n"
        "Between Call 2 and Call 3, agent-eval [bold]materializes the file "
        "to disk and pauses for review[/]. If you edit the metrics, those "
        "edits propagate forward. The validator catches schema mistakes "
        "before the next call fires — no wasted Gemini tokens on data that "
        "won't match.\n\n"
        "[bold]Call 3: generate dataset.jsonl rows.[/] Takes the (possibly "
        "edited) metric definitions and produces test rows specifically "
        "designed to exercise each metric. The prompt knows which fields "
        "each metric expects in [cyan]reference_data[/] and ensures rows "
        "populate them. After the file lands, a coverage validator warns "
        "if any metric still has zero matching rows — silent skip protection.",
    ),
    (
        "OPTIMIZATION_LOG.md is your iteration history",
        "Every time you run [cyan]agent-eval analyze[/], it appends to "
        "[cyan]OPTIMIZATION_LOG.md[/] in the parent results directory. The "
        "first run creates the baseline entry. Subsequent runs auto-detect "
        "the previous run, compute deltas across every metric, run "
        "[cyan]git diff[/] between the two run timestamps, and call Gemini "
        "for a comparative narrative.\n\n"
        "The file builds up a [bold]readable history of your optimization "
        "iterations[/]. For each iteration you get: which Context "
        "Engineering pillar was applied, which metrics moved (with "
        "color-coded delta indicators 🟢/🔴/⚪), what the git diff says you "
        "changed, and Gemini's analysis of whether the change actually "
        "produced the expected improvement.\n\n"
        "This is the artifact you show stakeholders — a versioned record "
        "of \"we tried these N optimizations, here's what worked, here's "
        "what regressed, here's where we are now\". It's also the artifact "
        "future-you reads when you come back to a project after a month "
        "and need to remember why the agent is structured the way it is.\n\n"
        "Two practical notes. First, [bold]name your runs[/] — when the "
        "Run ID prompt fires, type [cyan]baseline[/], [cyan]v2-tool-hardening[/], "
        "[cyan]cache-optimization[/]. The log scans 10× better than a "
        "wall of timestamps. Second, [bold]use --focus to highlight specific "
        'metrics[/]: [cyan]agent-eval run --focus "latency, cache"[/] '
        "tells the analyzer those are your priority this iteration, and "
        "the highlighted rows in the comparison table make screenshotting "
        "for design reviews trivial.",
    ),
    (
        "Sub-agent fan-out: a hidden cost",
        "ADK's [cyan]AgentTool[/] lets you call one agent from another. "
        "It's a clean abstraction — the parent treats the child as a tool, "
        "the child runs with its own model + instructions + state. But each "
        "[cyan]AgentTool[/] invocation [bold]starts a fresh LLM session[/], "
        "and that session pays the full prompt cost: system instruction, "
        "tool definitions, conversation context.\n\n"
        "If your orchestrator has 4 sub-agents and a single user query "
        "fans out to 3 of them, you're not making 1 LLM call — you're "
        "making 4+ (orchestrator + each sub-agent + likely a final "
        "synthesis call from the orchestrator). Each sub-agent's full "
        "system instruction runs through the model. Tokens add up "
        "fast.\n\n"
        "agent-eval's [cyan]token_usage[/] metric tracks this honestly. "
        "[cyan]llm_calls[/] counts every model call, not just the "
        "orchestrator-level ones. [cyan]prompt_tokens[/] sums across all "
        "of them. If your orchestrator has 5 sub-agents and your "
        "[cyan]llm_calls[/] is 2 per query, your sub-agents aren't running "
        "in parallel — they're running serially and you can probably parallelize. "
        "If it's 8 per query and your prompt tokens are 50k, your sub-agents "
        "have heavy system instructions and you should look at whether "
        "they all need to load every tool definition.\n\n"
        "The reduce path: split sub-agents that share rare paths into "
        "narrower specialists with smaller instructions. The cache path: "
        "make sure each sub-agent's instructions are pinned to "
        "[cyan]global_instruction[/] so prefix caching kicks in. The "
        "isolate path: route to ONE sub-agent per query when possible, "
        "rather than fanning out.",
    ),
    (
        "Why agent-engine and simulate produce different rows",
        "Three commands write [cyan]processed_interaction_*.jsonl[/]: "
        "[cyan]simulate[/], [cyan]interact[/], and [cyan]agent-engine[/]. "
        "They look interchangeable from the outside but capture different "
        "things, and understanding the differences saves debugging time.\n\n"
        "[cyan]simulate[/] runs against your local [cyan]agent.py[/] via "
        "ADK's user simulator. It's the only command that produces "
        "multi-turn rows, and the trace it captures is rich — every span, "
        "every tool call, every state mutation, full conversation history. "
        "Output goes to [cyan]processed_interaction_sim.jsonl[/]. Slow but "
        "comprehensive.\n\n"
        "[cyan]interact[/] fires HTTP queries at a live agent (your local "
        "ADK web server, or any FastAPI URL). One row per query, no "
        "multi-turn driving, but it talks to the deployed shape of your "
        "agent — including any middleware, auth, or networking quirks. "
        "Output: [cyan]processed_interaction_<app_name>.jsonl[/]. Fast.\n\n"
        "[cyan]agent-engine[/] talks to a deployed Vertex Agent Engine via "
        "Vertex's [cyan]create_evaluation_run[/] API. Single-turn only "
        "(Vertex's batch eval doesn't drive conversations), and the trace "
        "is what Vertex's managed runtime emits — slightly different shape "
        "than ADK local traces. Output: written to GCS first, then pulled "
        "back. Slow but tests the actual production runtime.\n\n"
        "All three converge at [cyan]agent-eval evaluate[/]. The evaluator "
        "doesn't care which command produced a row — per-row capability "
        "detection routes each row to the metrics it can satisfy. A "
        "multi-turn metric reads sim rows; a single-turn metric reads "
        "interact + agent-engine rows; reference-required metrics read "
        "whatever rows have populated [cyan]reference_data[/]. One eval "
        "run, multiple data sources, coherent results.",
    ),
    (
        "Tool docstrings are the LLM's only spec",
        "When you add a function to an ADK agent's [cyan]tools=[/] list, "
        "the LLM never sees your code. It sees the function signature and "
        "the docstring. That's it. The docstring IS the contract.\n\n"
        "ADK introspects each tool, generates a JSON schema from the type "
        "hints, and sends that schema (plus the docstring as the "
        "description) to the model on every turn. If your docstring says "
        '"Searches the database", the LLM picks the tool when it thinks '
        'a search is needed. If it says "Searches the legal-discovery '
        "Vertex Search index for documents matching `query`. Returns up to "
        '10 documents with text + score. Returns [] when query is empty", '
        "the LLM picks it MUCH more accurately and avoids calling it with "
        "an empty query.\n\n"
        "This is the cheapest agent fix in the toolkit. Tighten three "
        "docstrings, watch [cyan]tool_use_quality[/] climb. Concrete moves:\n\n"
        '[bold]1. Lead with the verb[/] — "Searches", "Computes", '
        '"Fetches". Models pattern-match on the first phrase.\n'
        '[bold]2. Document the failure modes[/] — "Returns [] if X", '
        '"Raises ValueError when Y". The model learns when NOT to call.\n'
        "[bold]3. Add `**KNOWN LIMITATIONS:**`[/] for hard constraints — "
        '"Do NOT call more than once per user turn", "Only works for '
        'the active dataset, set via set_active_dataset first". The '
        "managed [cyan]TOOL_USE_QUALITY[/] rubric explicitly rewards "
        "constraint-respecting agents.",
    ),
    (
        "State prefixes are namespaces with lifetimes",
        "ADK's [cyan]tool_context.state[/] is a dict that survives the "
        "agent's life — across tool calls, across LLM turns, even across "
        "process restarts when paired with a persistent SessionService. "
        "But not all keys live the same long. The PREFIX dictates scope:\n\n"
        '[bold cyan]No prefix[/] — session-scoped. [cyan]state["step"] = 2[/]. '
        "Lives for the conversation. Most tool outputs go here.\n"
        "[bold cyan]user:[/] — survives across sessions for the same user. "
        '[cyan]state["user:preferred_language"] = "en"[/]. Use for user '
        "preferences, learned facts about that specific user.\n"
        "[bold cyan]app:[/] — global to the entire app. "
        '[cyan]state["app:active_dataset"] = "crwd"[/]. Use for '
        "operator-set config, feature flags, anything ALL users see.\n"
        "[bold cyan]temp:[/] — single invocation only. "
        '[cyan]state["temp:scratch"] = data[/]. Cleared after the agent '
        "finishes its current call. Use for intermediate scratch space "
        "you don't want to persist.\n\n"
        "Two practical implications. First, [bold]agent-eval's data "
        "generator can pre-seed `app:` and `user:` keys[/] in test rows "
        "(via [cyan]session_inputs.state[/]) — set once, the agent reads "
        "throughout. Useful for testing focused behavior without the "
        "agent having to set up the world first.\n\n"
        "Second, [bold]Agent Engine deployments serialize state to GCS[/] "
        "between turns, which means anything you put in [cyan]state[/] "
        "becomes part of the production cost model. Heavy state = "
        "slower turns. If you put a 10MB document in state, every "
        "subsequent turn pays the read + parse cost.",
    ),
    (
        "AgentTool vs sub_agents — pick deliberately",
        "ADK gives you two ways to compose agents, and they have very "
        "different control patterns. Picking the wrong one is one of the "
        "most common architecture mistakes.\n\n"
        "[bold cyan]sub_agents[/] is for [bold]LLM transfer[/]. The parent "
        'looks at the user\'s request, decides "this is a sales question", '
        "and TRANSFERS control to [cyan]sales_agent[/]. The parent is no "
        "longer in the loop — sales_agent owns the conversation until it "
        "returns. Use when each sub-agent is a self-contained specialist "
        "and the parent's job is purely routing.\n\n"
        "[bold cyan]AgentTool[/] is for [bold]tool invocation[/]. The parent "
        "calls [cyan]AgentTool(specialist_agent)[/] like any other tool, "
        "gets a result back, and CONTINUES to drive the conversation. "
        "Use when the parent needs to weave specialist outputs together "
        '("call the discovery agent for docs, then the summary agent for '
        'a tldr, then write a final response combining both").\n\n'
        "Both have costs. Each AgentTool invocation spins a fresh LLM "
        "session for the child — full system instruction, full tool "
        "definitions, full reasoning loop. If your parent calls 3 "
        "AgentTools per query, you're paying 4× the prompt cost (parent + "
        "3 children). sub_agents is cheaper per call but less composable.\n\n"
        "Heuristic: if your top-level metric is [cyan]final_response_match[/] "
        '("the agent answered correctly"), AgentTool gives the parent the '
        "raw materials to synthesize. If it's [cyan]agent_handoffs[/] "
        '("routed to the right specialist"), sub_agents tests routing '
        "directly. Both are valid; agent-eval scores them the same way.",
    ),
    (
        "Callbacks are the agent's middleware",
        "ADK exposes four lifecycle hooks per agent: "
        "[cyan]before_tool_callback[/], [cyan]after_tool_callback[/], "
        "[cyan]before_model_callback[/], [cyan]after_model_callback[/] "
        "(plus before/after_agent for whole-invocation hooks). Each is "
        "an async function that runs at the named moment.\n\n"
        "These are NOT just for logging. They're the cleanest place to "
        "add real behavior the LLM can't be trusted to enforce on its own.\n\n"
        "[bold]before_tool[/] — validate args before the tool runs. The "
        'LLM occasionally calls [cyan]retrieve_docs("")[/] — your '
        'callback can short-circuit that and return [cyan]{"error": '
        '"Empty query"}[/] without burning a Vertex Search call.\n\n'
        "[bold]after_tool[/] — truncate massive outputs before they bloat "
        "context. A retrieval that returns 50KB of markdown will poison "
        "the cache for every subsequent turn. Truncate to the first 1KB + "
        "stash the full result in [cyan]tool_context.state[/] for later "
        "lookup. This is the [bold]Reduce[/] Context Engineering pillar "
        "in code form.\n\n"
        "[bold]before_model[/] — last chance to inspect what's going to "
        "the LLM. Strip PII, inject a cached system prompt, redact "
        "credentials. Returning a [cyan]LlmResponse[/] from this callback "
        "skips the model call entirely (useful for canned responses to "
        "out-of-domain queries).\n\n"
        "[bold]after_model[/] — gate the model's output. Add safety "
        "filters, force structured output, or detect specific error "
        'phrases ("I cannot...") and route to a fallback agent.\n\n'
        "Callbacks return [cyan]None[/] to continue or a typed override "
        "to short-circuit. Plugins are the same idea but global across "
        "all agents — use callbacks for per-agent logic, plugins for "
        "cross-cutting concerns like logging.",
    ),
    (
        "The five-iteration loop",
        "Agent development isn't write-once. The realistic shape is: "
        "build a stub → eval it → diagnose → tweak → re-eval. The first "
        "iteration's metrics are almost always bad; that's the point.\n\n"
        "What experienced ADK developers report:\n\n"
        "[bold cyan]Iteration 1 — baseline[/]. Stub agent, basic "
        "instruction, one or two tools. Metrics will be ugly: low "
        "[cyan]final_response_match[/], high latency, low cache hit "
        "rate. Don't fix anything yet. Just save the run as [cyan]baseline[/].\n\n"
        "[bold cyan]Iteration 2 — tool hardening[/]. Tighten docstrings, "
        "add [cyan]**KNOWN LIMITATIONS:**[/], cap retry counts. "
        "[cyan]tool_use_quality[/] should jump 20-40 percentage points. "
        "Save as [cyan]v2-tool-hardening[/]. The OPTIMIZATION_LOG.md "
        "captures the diff.\n\n"
        "[bold cyan]Iteration 3 — context optimization[/]. Move static "
        "instructions to [cyan]global_instruction[/]. Add an "
        "[cyan]after_tool_callback[/] that truncates massive outputs. "
        "[cyan]cache_efficiency.cache_hit_rate[/] should climb above 50%, "
        "[cyan]token_usage.estimated_cost_usd[/] often halves.\n\n"
        "[bold cyan]Iteration 4 — sub-agent isolation[/]. Split the "
        "monolithic agent into 2-3 specialists behind a router. "
        "[cyan]agent_handoffs[/] climbs but [cyan]llm_calls[/] often "
        "DROPS because each specialist is more focused.\n\n"
        "[bold cyan]Iteration 5 — sharpen the rubric[/]. Look at the "
        "questions where [cyan]general_quality[/] is still low. Often "
        "the rubric IS too vague — write a sharper [cyan]custom_llm_judge[/] "
        "metric for the specific behavior you care about. Re-run.\n\n"
        "After 5 iterations the agent is usually production-ready. After "
        "10, you're polishing. The OPTIMIZATION_LOG.md tells the whole "
        "story for whoever inherits the project.",
    ),
    (
        '"I\'ll search" without searching',
        "The most disorienting agent failure mode is the [bold]phantom "
        'tool call[/]. The agent says "Let me look that up for you" or '
        "\"I'll check the database\" — and then doesn't call any tools. "
        "It just hallucinates an answer.\n\n"
        "[cyan]tool_success_rate[/] reports 100% (no failures because no "
        "calls). [cyan]tool_utilization.total_tool_calls[/] is 0 for that "
        "row. The agent's text claims it did the work; the trace says "
        "otherwise. Easy to miss if you only read the response.\n\n"
        "Two common causes:\n\n"
        "[bold]1. Long-context attention failure.[/] The tool definitions "
        "are buried in a 4000-token system prompt. The model's attention "
        "decays toward the end; the tool description is in the dim "
        "middle. Fix: move tool-relevant instructions to the END of the "
        "system prompt (LLMs attend most to recency), or shrink the "
        "system prompt with [cyan]global_instruction[/] + RAG.\n\n"
        "[bold]2. Trained-in shortcut.[/] The model learned during "
        "post-training that confident answers score better than tool "
        'calls + uncertainty. Fix: explicit instruction "You MUST call '
        "[cyan]search_docs[/] before stating any factual claim. If you "
        "haven't called it, say 'I need to search' — don't make up an "
        'answer." Combine with [cyan]hallucination[/] metric to verify.\n\n'
        "agent-eval surfaces this in two metrics. [cyan]tool_use_quality[/] "
        "(LLM-judged) penalizes claimed-but-not-executed tool calls "
        "directly. [cyan]hallucination[/] often spikes on the same rows "
        "because the made-up answer can't be grounded. When both crater "
        "together, you've found a phantom-call failure mode.",
    ),
    (
        "SequentialAgent, ParallelAgent, LoopAgent",
        "Beyond [cyan]LlmAgent[/] (the standard reasoning agent), ADK "
        "ships three [bold]workflow agents[/] that orchestrate without "
        "any LLM reasoning of their own. They're cheap, deterministic, "
        "and underused.\n\n"
        "[bold cyan]SequentialAgent[/] runs sub-agents in order, passing "
        "session state between them. Use for fixed pipelines: "
        "[cyan]extract_intent → fetch_data → format_response[/]. Each "
        "step writes its result to a known [cyan]output_key[/]; the next "
        "step reads it. Zero LLM cost in the orchestrator (it's pure "
        "Python flow).\n\n"
        "[bold cyan]ParallelAgent[/] fans out to N sub-agents at once and "
        "collects their results. Use when you have independent queries "
        'to multiple sources: "check email, check Slack, check GitHub '
        "for mentions of @user\". Wall-clock = slowest sub-agent (Amdahl's "
        "law again). The orchestrator merges their outputs into one "
        "final response.\n\n"
        "[bold cyan]LoopAgent[/] re-runs a sub-agent until a condition "
        "is met (with a [cyan]max_iterations[/] cap to avoid infinite "
        'loops). Use for iterative refinement: "draft → critique → '
        "refine → critique → refine, stop when critique says 'good enough'.\"\n\n"
        "All three compose cleanly with each other and with regular "
        "LlmAgents. A common pattern is [cyan]SequentialAgent(intent_extractor, "
        "ParallelAgent(retriever_a, retriever_b, retriever_c), synthesizer)[/] "
        "— deterministic intent extraction, parallel retrieval, then an "
        "LLM that combines.\n\n"
        "agent-eval scores all four agent types the same way — the eval "
        "framework only sees the final output + the trace. Workflow "
        "agents tend to have lower [cyan]llm_calls[/] and higher "
        "[cyan]cache_efficiency[/] than monolithic LlmAgents — the "
        "non-LLM steps don't count.",
    ),
    (
        "Why model choice matters more than instruction tuning",
        "Switching the model is often a bigger lever than rewriting the "
        "prompt. ADK lets you swap with one line: [cyan]model=Gemini("
        'model="gemini-3-flash-preview")[/]. The choice has cascading '
        "effects on latency, cost, tool-use quality, and how much "
        "instruction you need to write.\n\n"
        "[bold cyan]gemini-3-flash-preview[/] (default for most ADK "
        "scaffolds) is a thinking model — it generates hidden reasoning "
        "tokens before each visible response. Cheap per token, but "
        "[cyan]thinking_metrics.reasoning_ratio[/] often hits 60-80% on "
        "tool-heavy agents. You pay for thinking tokens. Latency comes "
        "with the deal.\n\n"
        "[bold cyan]gemini-3-pro-preview[/] is more deliberate — better "
        "at following multi-step instructions, better at refusing "
        "out-of-domain queries cleanly. 3-5× the per-token cost but "
        "often FEWER total tokens because it gets things right the first "
        "time. Worth it for orchestrators making routing decisions.\n\n"
        "[bold cyan]gemini-2.5-flash[/] (or [cyan]gemini-flash-latest[/]) "
        "has no thinking phase — predictable latency, lower per-call "
        "cost. Good for simple sub-agents whose job is one-shot text "
        "transformation. Bad for agents that need to plan multi-step "
        "tool sequences — they tend to skip steps without the thinking "
        "phase.\n\n"
        "Practical rule: orchestrators get [cyan]gemini-3-pro[/] (worth "
        "the cost for routing accuracy), specialist sub-agents get "
        "[cyan]gemini-2.5-flash[/] (predictable + cheap), only use "
        "[cyan]gemini-3-flash-preview[/] when you specifically want "
        "thinking but can't afford pro. Re-eval after swapping; the "
        "deltas are usually larger than any prompt tweak you'd make.",
    ),
    (
        "Cloud Trace shows you what really happened",
        "ADK auto-instruments with OpenTelemetry. Every agent invocation, "
        "every LLM call, every tool execution, every state mutation is a "
        "span in a distributed trace. When something goes wrong in "
        "production, Cloud Trace is where the answer lives.\n\n"
        "Open Cloud Console → Observability → Trace. Filter by your "
        'agent\'s service name ("crwd-legal-discovery" or whatever you '
        "deployed). You'll see one trace per user invocation. Click in: "
        "the timeline shows the agent's reasoning + every tool call + "
        "every sub-agent transfer + the response shape, all with timing.\n\n"
        "Three things this surfaces that no metric can:\n\n"
        '[bold]1. Where time actually went.[/] The eval might say "Wall-'
        'clock 40s" but the trace shows 32s of that was a single Vertex '
        "Search call. Now you know where to optimize — not the agent, "
        "the index.\n\n"
        "[bold]2. Silent tool failures.[/] If a tool returns an error "
        "the agent ignores, [cyan]tool_success_rate[/] is still 100% (no "
        "Python exception) but the trace shows the error payload. Adding "
        "an [cyan]after_tool_callback[/] that surfaces these is a "
        "30-line fix that uncovers chronic issues.\n\n"
        "[bold]3. Concurrency anomalies.[/] Sub-agents that you THINK "
        "run in parallel might be running serially because of a "
        "dependency. The trace shows the actual fan-out shape — gaps "
        "between sibling spans = unintended serialization.\n\n"
        "agent-eval's traces are local; Cloud Trace's are production. "
        "Use agent-eval to test changes before deploying, use Cloud "
        "Trace to understand what real users actually trigger. They "
        "complement each other — agent-eval is the lab, Cloud Trace is "
        "the field.",
    ),
    (
        "Three deployment targets, three traffic patterns",
        "ADK agents deploy to one of three Google Cloud surfaces. The "
        "right choice depends on YOUR TRAFFIC SHAPE, not on agent "
        "complexity. Each surface has a sweet spot.\n\n"
        "[bold cyan]Local ([/][cyan]adk web[/][bold cyan])[/] — runs the "
        "agent in your shell with a FastAPI server. Use for development "
        "and the [cyan]agent-eval interact[/] phase. Zero deployment "
        "cost, no GCP resources spun up. Restarts on file change with "
        "[cyan]--reload_agents[/]. Doesn't scale, doesn't persist state "
        "between process restarts.\n\n"
        "[bold cyan]Cloud Run[/] — stateless HTTP endpoint, pay-per-"
        "request, scales to zero, scales out under load. Use when your "
        "agent is request/response and you don't need session "
        "persistence beyond what your tools manage themselves. Cheap "
        "for spiky traffic. Cold-start latency on the first request after "
        "idle (typically 2-5 seconds).\n\n"
        "[bold cyan]Agent Engine[/] — Google's managed agent runtime. "
        "Persistent sessions (state is GCS-backed and survives restarts), "
        "auto-scaling, built-in tracing, and the [cyan]create_evaluation_run[/] "
        "API that [cyan]agent-eval agent-engine[/] uses. More expensive "
        "than Cloud Run per call, but the session continuity is "
        "irreplaceable for multi-turn agents that need to remember "
        "context across requests.\n\n"
        "Practical decision tree: stateless one-shot Q&A → Cloud Run. "
        "Multi-turn conversational agents → Agent Engine. Just iterating "
        "→ stay local. You can deploy to Cloud Run AND Agent Engine "
        "simultaneously; agent-eval picks up whichever it finds via "
        "[cyan]deployment_metadata.json[/].",
    ),
]


def random_story() -> tuple[str, str] | None:
    """Return a random ``(title, body)`` story. None if the pool is empty
    (defensive — shouldn't happen)."""
    if not STORIES:
        return None
    return random.choice(STORIES)


def random_stories(n: int) -> list[tuple[str, str]]:
    """Return up to ``n`` UNIQUE random stories (no repeats in one wait).

    If n exceeds the pool size, returns the entire shuffled pool. Used by
    the long-running phases to print a couple of stories before kicking
    off the spinner — readable at user's own pace, persists in terminal
    scrollback, no rotation magic needed.
    """
    if not STORIES:
        return []
    sample_size = min(n, len(STORIES))
    return random.sample(STORIES, sample_size)


def render_story_panel(
    title: str, body: str, *, index: int | None = None, total: int | None = None
):
    """Render one story as a Rich Panel for display. Index/total optional
    for the browser context (e.g. \"Story 7 of 15\"); omitted in the
    while-you-wait context where users see one or two at a time.

    Used by the `agent-eval stories` browser command (where the user opted
    in and wants the formal layout). The wait-time path uses
    ``StoryStreamer`` instead — Panels feel like UI; prose feels like
    reading.
    """
    from rich.padding import Padding
    from rich.panel import Panel

    title_str = f"[bold]{title}[/]"
    if index is not None and total is not None:
        title_str = f"[dim]{index}/{total}[/]  {title_str}"
    return Panel(
        Padding(body, (0, 1)),
        title=title_str,
        title_align="left",
        border_style="blue",
        padding=(1, 2),
    )


class StoryStreamer:
    """Background reader that prints essays one paragraph at a time, ON
    DEMAND via the Down arrow, while a blocking phase runs.

    Design choices that matter:

    - **User-driven pacing.** No timers. The user presses ↓ to advance to
      the next paragraph at their own reading speed. Turns dead wait time
      into a real reading session instead of a "wait for the next chunk
      to slowly stream in" annoyance.
    - **Infinite scroll.** The deck reshuffles when exhausted so users
      can keep pressing ↓ forever during long waits.
    - **Prose, not Panels.** Rich-rendered paragraphs (markup intact),
      indented for readability. No box chrome.
    - **No char streaming.** Each paragraph appears as a single Rich
      print — markup like ``[cyan]…[/]`` renders correctly, prose looks
      like prose.
    - **Stoppable instantly.** ``stop()`` sets an Event; the input loop
      polls it every ~100ms. Restores terminal mode on exit (always —
      the ``finally`` runs even on Ctrl+C / exception).
    - **Ctrl+C → SIGINT to main thread.** In cbreak mode the kernel
      doesn't auto-deliver SIGINT for us; we forward via ``os.kill``.
      Otherwise Ctrl+C would only stop the storyteller, leaving the run
      hung.
    - **Falls back gracefully.** Windows / non-TTY / no termios →
      storyteller becomes a no-op so we don't crash CI runs.

    Usage::

        streamer = StoryStreamer(console)
        streamer.start()
        try:
            do_long_blocking_work()
        finally:
            streamer.stop()
    """

    def __init__(self, console):
        import threading

        self._console = console
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        import threading

        if self._thread is not None:
            return
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self, *, timeout: float = 1.0) -> None:
        if self._thread is None:
            return
        self._stop_event.set()
        self._thread.join(timeout=timeout)
        self._thread = None

    def _print_paragraph(self, state: dict) -> None:
        """Print the next paragraph. Pulls from state['paragraphs'] —
        when exhausted, advances to the next story (and reshuffles the
        deck if it ran dry). state is a dict so the closure can mutate
        across calls without `nonlocal` plumbing."""
        from rich.padding import Padding

        if state["paragraph_idx"] >= len(state["paragraphs"]):
            # Need a new story.
            if not state["deck"]:
                state["deck"] = list(STORIES)
                random.shuffle(state["deck"])
                # Don't show the last story first in the new deck.
                if state["last_title"] and state["deck"]:
                    if (
                        state["deck"][-1][0] == state["last_title"]
                        and len(state["deck"]) > 1
                    ):
                        state["deck"][-1], state["deck"][0] = (
                            state["deck"][0],
                            state["deck"][-1],
                        )
            title, body = state["deck"].pop()
            state["last_title"] = title
            state["paragraphs"] = [p.strip() for p in body.split("\n\n") if p.strip()]
            state["paragraph_idx"] = 0
            self._console.print()
            self._console.print(f"  [bold cyan]§[/]  [bold]{title}[/]")
            self._console.print()

        para = state["paragraphs"][state["paragraph_idx"]]
        # Rich handles markup-aware wrapping when given a width — no
        # textwrap.fill (which broke inline [cyan]…[/] tags).
        # Trailing blank line gives paragraphs visual breathing room
        # (without it they butt up against each other and read as one
        # giant wall of text).
        self._console.print(Padding(para, (0, 0, 0, 4)), width=90)
        self._console.print()
        state["paragraph_idx"] += 1

    def _run(self) -> None:
        import sys

        # Non-TTY (CI, piped output) → no point. Just exit.
        if not sys.stdin.isatty():
            return

        # Windows / no termios → fall back to a one-shot welcome and exit
        # rather than crashing.
        try:
            import select
            import termios
            import tty
        except ImportError:
            self._console.print()
            self._console.print(
                "  [dim italic]☕ Stories not available on this platform "
                "(no termios). Browse via [cyan]agent-eval stories[/] in another shell.[/]"
            )
            return

        # Welcome — sets expectations clearly. ONE line, then content.
        # Lead with Space because it works in every terminal (some web
        # terminals + tmux configs swallow the ↓ escape sequence). Mention
        # ↓ as an alternative for users who prefer arrow keys.
        self._console.print()
        self._console.print(
            "  [dim italic]☕ Press [bold]Space[/] (or [bold]↓[/]) to read "
            "short field notes while you wait. They loop forever; scroll "
            "your terminal up to re-read. [bold]Ctrl+C[/] cancels the run.[/]"
        )
        self._console.print()

        # State that the closure mutates across keypresses.
        deck = list(STORIES)
        random.shuffle(deck)
        state = {
            "deck": deck,
            "paragraphs": [],
            "paragraph_idx": 0,
            "last_title": None,
        }

        # Print the first paragraph immediately so the user sees content
        # right away (and learns what "more" looks like).
        self._print_paragraph(state)

        # Switch terminal to cbreak mode so we get individual keystrokes
        # without waiting for Enter. ALWAYS restore in finally.
        fd = sys.stdin.fileno()
        try:
            old_settings = termios.tcgetattr(fd)
        except (termios.error, OSError):
            return  # No real terminal (e.g. inside `script`-wrapped session)

        try:
            tty.setcbreak(fd)
            while not self._stop_event.is_set():
                # Poll stdin with a 100ms timeout so we react to stop()
                # within 100ms while still being responsive to keys.
                ready, _, _ = select.select([sys.stdin], [], [], 0.1)
                if not ready:
                    continue
                try:
                    ch = sys.stdin.read(1)
                except (OSError, ValueError):
                    return

                if ch == "\x1b":  # ESC — start of an arrow-key sequence
                    # Read 2 more bytes if available (with tiny timeout
                    # so a bare ESC doesn't hang forever).
                    rest = ""
                    if select.select([sys.stdin], [], [], 0.05)[0]:
                        rest = sys.stdin.read(1)
                        if select.select([sys.stdin], [], [], 0.01)[0]:
                            rest += sys.stdin.read(1)
                    if rest == "[B":  # Down arrow
                        self._print_paragraph(state)
                    # Other arrows / ESC alone — silently ignore so
                    # accidental key mashing doesn't burn through stories.
                elif (
                    ch == "\x03"
                ):  # Ctrl+C — kernel doesn't deliver in cbreak; forward.
                    import os
                    import signal

                    self._stop_event.set()
                    os.kill(os.getpid(), signal.SIGINT)
                    return
                elif ch in (" ", "j", "n"):
                    # Bonus convenience keys — Space / j / n also advance.
                    # Common reader conventions; cheap to support.
                    self._print_paragraph(state)
                # All other keys silently ignored.
        finally:
            try:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
            except Exception:
                pass
