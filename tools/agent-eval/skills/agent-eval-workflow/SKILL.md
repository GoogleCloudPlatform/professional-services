---
name: agent-eval-workflow
description: >
  This skill should be used when the user wants to evaluate an AI agent
  end-to-end: scaffold an evaluation, design metrics that test a real
  hypothesis, make an agent measurable, audit generated eval config, read
  evaluation results, or run an improvement ("hill climbing") loop.
  Covers evaluation methodology, metric design, dataset coverage, reading
  deterministic vs LLM-judged metrics, and the traps that make eval runs
  silently measure nothing.
  Use alongside the tool-specific skills (agents-cli-eval, adk-eval-guide) —
  those cover commands and schemas, this covers the process and judgement.
metadata:
  author: Google Cloud Professional Services
  license: Apache-2.0
  version: 0.1.0
---

# Agent evaluation: the process

Commands change. The process does not. This skill is about **how to evaluate an
agent well** — the reasoning that stays true whether you drive it with
`agent-eval`, `agents-cli eval`, or whatever replaces them.

The loop: **Hypothesize. Test. Validate.**

State a falsifiable claim about the agent, write metrics that could prove you
wrong, run them, and let the results — not your intuition — decide what to fix.

---

## 1. Start from a hypothesis, not from "add some metrics"

A metric exists to settle an argument. Before generating anything, answer:

- What do I believe this agent gets wrong?
- What observable evidence would prove that?
- What would prove me wrong?

Read the agent's own instructions and tool code first. **Stated rules are
testable claims** — "always confirm before deleting", "never approve above 10%",
"always cite a source". Those sentences convert directly into criteria.

When a generator asks what to focus on, give it the hypothesis in plain language
naming real tools and thresholds. Vague guidance produces vague rubrics.

> Good: "The agent must never call `approve_discount` above 10%; it should route
> larger requests to `sync_ask_for_approval` instead of being rejected and
> retrying."
>
> Weak: "Test discount handling."

**Prefer binary rubrics (0/1).** LLM judges have poor inter-rater reliability on
1–5 scales. Several sharp binary metrics beat one fuzzy graded one, and the pass
rate across a dataset gives you a continuous score with better statistics.

---

## 2. Make the agent measurable before measuring harder

A judge reading prose is fuzzy. A **state variable written by the tool itself is
deterministic**. If a tool already makes a decision, record it:

```python
def approve_discount(discount_type: str, value: float, reason: str,
                     tool_context: ToolContext) -> dict:
    if value > MAX_DISCOUNT_RATE:
        tool_context.state["discount_status"] = "rejected"   # hard evidence
        return {"status": "rejected", "message": "discount too large."}
    tool_context.state["discount_status"] = "approved"
    return {"status": "ok"}
```

Now `discount_status == "rejected"` *proves* the agent attempted an over-limit
approval. No judge opinion required. Improving observability is usually cheaper
and more reliable than sharpening a rubric.

---

## 3. Audit generated config — always

Treat AI-generated metrics and datasets as a **draft to review**. The failures
here are silent: nothing errors, the run just measures less than it claims.

**Check coverage.** For each metric, ask *which rows does this actually score?*
Capability flags like `requires_multi_turn` / `requires_reference` silently
exclude rows. A generated config once marked both custom metrics multi-turn-only,
leaving every single-turn row unscored — including the sharpest test case in the
dataset.

**Check that every source column can be populated for this agent.** A metric
bound to a column the agent can never fill will fail with an error that points at
the agent instead of at the metric. See the built-in tools trap below.

**Prefer explicit columns over generic blobs.** Mapping a whole `state_variables`
dict hides the signal; naming `discount_status` surfaces it to both the judge and
any coverage report.

**Beware empty-but-valid columns.** If a metric maps its response to a tool-call
list and the correct behaviour on some row is *call no tools*, that column is
empty and reads as "Response is required but missing". Map it through a template
so it always renders text:

```jsonc
"response": {
  "template": "Tool Calls:\n{extracted_data_tool_interactions}",
  "source_columns": ["extracted_data:tool_interactions"]
}
```

**Run it through the tool's own validator** rather than eyeballing it.

---

<<<<<<< HEAD
## 3.1. Testing Trajectories, Tool Calls, and Sub-Agent Actions

For agents that interact with tools and sub-agents, evaluating just the final text is insufficient. You must evaluate the **system trajectory**:

1. **Mapping Intermediate Tool Events:**
   In your `eval_config.yaml`, bind the judge to `extracted_data:tool_interactions` and `extracted_data:subagent_delegations`:
   ```yaml
   metrics:
     tool_call_quality:
       kind: custom_llm_judge
       requires_multi_turn: true
       instruction: "Evaluate whether the agent called the correct tools with valid, unhallucinated parameters to support its claims."
       criteria:
         tool_selection: Did the agent pick the correct tool or delegate to the appropriate sub-agent?
         parameter_validity: Are the SQL queries or API parameters mathematically and semantically correct?
         data_traceability: Can every factual claim in the final response be traced back to the tool return payload?
         self_correction: If an initial tool call returned an error or 0 rows, did the agent adapt and retry?
       rating_scores:
         '1': 'Pass: Valid tools and parameters used, claims grounded in tool output.'
         '0': 'Fail: Hallucinated parameters, wrong tool, or ungrounded claims.'
   ```

2. **Verifying Trajectory Hops:**
   The canonical `AgentData` model stores each action as an `AgentEvent(event_type="TOOL_CALL" | "DELEGATION", author="subagent_name", payload={...})`. Multi-turn judges inspect the full conversation sequence alongside these events to verify sub-agent handoffs.

---

## 4. Design a dataset that can fail (The 60/20/20 Rule)

A dataset consisting only of happy paths produces false confidence. A production-grade **Golden Set** must follow a disciplined **60 / 20 / 20 Composition**:

1. **Nominal Happy Paths (60%):** Standard in-scope requests verifying core business logic.
2. **Boundary & Edge Cases (20%):** At-limit requests (e.g. 10% vs 10.01%), secondary forgotten constraints, and empty-database responses requiring self-correction retries.
3. **Adversarial & Negative Traps (20%):** Inquiries designed to catch cheating models:
   - **Domain Refusal Traps:** Inquiries asking for unsupported attributes (e.g. uncoded trait meanings) where the agent *must refuse and pivot*.
   - **Ambiguity Traps:** Vague user requests where querying tools without asking for clarification is a critical failure.
   - **Negative Consent / Do Nothing:** Cases where user consent is withheld or the correct action is *do not execute*.
   - **Out-of-Scope Distractors:** Adversarial prompts attempting to bypass guardrails.

> **The Rule:** If an agent scores 100% on Turn 1 of a new dataset without any prompt tuning, the dataset is defective—not the agent. Ensure at least 20–30% of rows contain negative or adversarial traps.
=======
## 4. Design a dataset that can fail

Rows should include boundary and negative cases, not just happy paths:

- **At the limit** and **over the limit** (10% vs 15% vs 25%)
- The **second condition** people forget (percentage limit *and* flat-amount limit)
- Cases where the right answer is **do nothing** / **refuse**
- **Consent given** and **consent withheld**, as separate rows
- One clearly **out-of-scope** request

If every row passes at baseline, the dataset is too easy to teach you anything.
>>>>>>> dani/chore/agent-eval-0.1.1-docs

---

## 5. Read results: deterministic vs judged

Two metric families answer different questions, and **the gap between them is
the diagnosis**:

| | Answers | Example |
|---|---|---|
| Deterministic (from the trace) | *Did it run?* | `tool_success_rate = 1.0` |
| LLM-judged (rubric) | *Was it right?* | `tool_use_quality = 0.25` |

A real result: `tool_success_rate` 1.0 alongside `tool_use_quality` 0.25. Both
correct. Every tool call executed without raising — and the agent kept calling
the *wrong tool at the wrong time*. Deterministic metrics cannot see that;
judged metrics can.

Work top-down: headline scores → the specific failing rows → the judge's
reasoning next to the actual tool calls → the source code.

**A metric that scores perfectly has no headroom.** Say so and move on — a
disproven hypothesis is a real result, not a failed experiment.

---

## 6. Hill climbing

1. Pick the **weakest** metric, not the most interesting one.
2. Find the specific rows that fail it and read what actually happened.
3. Trace the cause into source — prompt, tool docstring, or architecture.
4. Change **one** thing, so the delta is attributable.
5. **Predict the effect out loud before re-running.** That makes it a test.
6. **Restart the agent server before re-running** — see below. Skipping this is
   the single easiest way to waste an entire iteration.
7. Re-run and compare.

### Restart the agent between iterations, and verify you did

A long-running agent server holds the agent module **in memory**. Editing a
prompt, a tool docstring, or a tool signature changes nothing for a server that
is already running — it keeps serving the code it imported at startup. The
evaluation then dutifully measures your *old* agent and reports no improvement,
and you conclude the fix didn't work.

Don't trust that the restart happened — a new server silently exits if the port
is still held by the old one. **Compare timestamps:**

```bash
PID=$(ss -ltnp | grep 8501 | sed -E 's/.*pid=([0-9]+).*/\1/')
ps -o lstart= -p "$PID"                       # when did the server start?
date -r path/to/tools.py '+%H:%M:%S'          # when did you edit the code?
```

If the server start time is **older** than your edit, it is serving stale code —
kill it, start a new one, and check again before spending a run.

This applies to whatever drives the agent over HTTP. In-process paths (importing
`agent.py` directly) pick changes up automatically; anything talking to a server
does not.

### Treat AI root-cause analysis as a hypothesis, not a finding

Automated analysis is good at spotting *that* something is wrong and bad at
being sure *why*. It will produce a specific, well-argued, source-citing
explanation that is confidently wrong — and it reads exactly like a correct one.

A real case: analysis reported the agent was fabricating `customer_id='123'`
from tool docstring examples, quoting the docstrings. Acting on it — adding an
instruction never to invent a customer id — made every metric worse
(`instruction_following` 0.89 → 0.61) and introduced tool-call loops. The
system prompt turned out to inject `Customer.get_customer("123")` as the
signed-in customer. Nothing was fabricated; the agent had been told to distrust
a legitimate value.

**Before acting on a diagnosis, verify its claim against the source.** Grep for
the value. Check whether the prompt already supplies it. Confirm the mechanism
exists. One minute of checking beats a 25-minute run in the wrong direction.

And when a fix makes things worse, that is a result: it usually means the
diagnosis was wrong, not that the fix was too small.

Common causes worth checking, in rough order of how often they turn out to be it:

- **Docstring examples read as facts.** Mock values like `customer_id='123'` in
  examples get fabricated into real calls when the agent hits a gap. Add an
  explicit prohibition; don't rely on the model inferring that examples are fake.
- **Undocumented rules.** A limit enforced in code but absent from the prompt
  forces the agent to discover it by failing — wasted calls and latency.
- **Too many tools on one agent.** Biases toward acting when the right move is
  to stop and answer.
- **Inconsistent return contracts.** A tool annotated `-> dict` that returns a
  bare string on the error path makes the model spend reasoning tokens parsing it.

Keep an iteration log: what changed, which metrics moved, and by how much.

---

## 7. Traps that make a run silently meaningless

**Nothing starts your agent for you.** The eval posts to whatever is listening on
the port. A leftover server for a *different* agent will accept the connection
and fail every request — and the symptoms appear as confusing *metric* errors.
Verify the server's identity, not just that something is listening:

```bash
ss -ltnp | grep 8501
tr '\0' ' ' < /proc/<PID>/cmdline    # which agents dir was it launched with?
```

**Built-in tools are not tool calls.** `google_search`, code execution and
similar produce grounding metadata, not `functionCall` events. Any metric reading
tool interactions is **structurally unsatisfiable** for an agent whose only tool
is built in. Check for real Python function tools before writing tool-trajectory
metrics.

**A phase can report success while every row failed.** "Captured N interactions"
counts rows returned, not rows that succeeded. Check per-row status.

**Comparison baselines are picked automatically.** Analysis usually compares
against the most recent previous run. Stale or broken runs left in the results
folder will silently poison your deltas — move them aside first.

**Judge failures can be environment failures.** An out-of-range SDK in the
scoring environment can make judges return prose instead of JSON, which surfaces
as `400 INVALID_ARGUMENT — Error parsing JSON`. Keep agent runtime and eval
scoring dependencies separate and in their supported ranges.

**Use two virtualenvs: one for the agent, one for evaluation.** They share
dependencies (the ADK, the Vertex SDK) but need *different* versions of them.
Install the eval tooling into the agent's venv and the agent's lockfile wins:
the next `uv sync` / `uv run` in that project re-resolves the environment and
downgrades a shared package underneath the eval tool, which then crashes on an
import that has nothing to do with the real problem. The supported layout is an
eval venv with the agent installed into it (`uv pip install -e .`), while the
agent's own venv serves the agent. If a run fails with a surprising
`ModuleNotFoundError`, check installed versions before debugging anything else.

**Empty results deserve suspicion, not a rerun.** If scores are missing or rows
are blank, find the upstream cause before spending another run.
