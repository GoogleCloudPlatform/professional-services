# Using Offline Data with `agent-eval grade`

The `agent-eval` CLI is highly modular. While it includes tools to generate conversations dynamically against live agents (`agent-eval generate --base-url`), you can completely bypass this and evaluate pre-recorded historical traces (e.g., from BigQuery, Cloud Logging, or your custom DB). 

This is known as **Bring Your Own Data (BYOD)**. To do this, you just pass a JSON Lines (`.jsonl`) file to the CLI:

```bash
agent-eval grade --interaction-file your_dataset.jsonl
```

For the tool to ingest your data properly, your `.jsonl` file must conform to specific data contracts. This guide breaks them down from minimum viable up to the maximum potential.

---

## 1. The Minimal Required Schema 
If you only want to run **reference-free conversational metrics** (like `answer_relevance`, `safety`, or `general_quality`), your data must contain these four fields.

```json
{
  "question_id": "trace_a1b2c3d4",
  "source_type": "interaction",
  "user_inputs": [{ "content": "What is the weather?" }],
  "final_response": "The weather today is sunny."
}
```

*   **`question_id`**: A unique identifier for the trace (e.g., UUID or Trace ID). Useful for debugging failures.
*   **`source_type`**: Must be `"interaction"` for real offline user traffic (or `"simulation"` for synthetically generated traffic).
*   **`user_inputs`**: A list of user messages. Each item is an object containing a `content` string.
*   **`final_response`**: The agent's final answer, presented as a raw string or JSON structure.

---

## 2. Advanced Fields: "God-Mode" Schema

To unlock the absolute maximum power of `agent-eval`—lighting up every graph, every reference-backed Vertex evaluator, every deterministic metric, and every specialized diagnostic panel—your data should look like this "God-Mode" JSON row.

```json
{
  "question_id": "trace_a1b2c3d4e5f6",
  "session_id": "uuid-9999-8888-7777",
  "kind": "single_turn",
  "source_type": "interaction",
  
  "user_inputs": [
    {
      "content": "Using the delta dataset, find emails about the Q3 pricing strategy and calculate the variance."
    }
  ],
  
  "final_response": "The Q3 pricing strategy emails have been located. The calculated variance from Q2 is 14%.",

  "reference_data": {
    "expected_behavior": "The agent must query the delta dataset, locate the pricing email, calculate the variance, and report exactly 14%.",
    "expected_docs": ["doc_pricing_v2.pdf", "q2_q3_variance_sheet.csv"],
    "expected_routing": ["data_retrieval_agent", "calculator_agent"],
    "expected_tool_calls": ["query_bigquery", "run_calculation"]
  },

  "extracted_data": {
    "user_clearance_level": "Tier_1",
    "total_documents_retrieved": 4,
    "calculator_used": true
  },

  "trace_summary": "1. Routed to retrieval agent -> 2. Query BigQuery -> 3. Handoff to Calculator -> 4. Generated Response",

  "session_trace": [
    {
      "name": "tool_call",
      "start_time": 1723577312000000000,
      "end_time": 1723577314500000000,
      "attributes": {
        "Tool Name": "query_bigquery",
        "Tool Status": "SUCCESS"
      }
    },
    {
      "name": "call_llm",
      "start_time": 1723577314600000000,
      "end_time": 1723577318000000000,
      "attributes": {
        "gen_ai.request.model": "gemini-2.5-pro",
        "gcp.vertex.agent.llm_response": "{\"usage_metadata\": {\"prompt_token_count\": 12050, \"candidates_token_count\": 450, \"total_token_count\": 12500, \"cached_content_token_count\": 8000, \"thoughts_token_count\": 120}}"
      }
    }
  ]
}
```

### What Every Block Unlocks in the Dashboard

**1. Identity & Routing (`question_id`, `session_id`, `kind`, `source_type`)**
*   **Unlocks:** Makes the specific trace searchable in the HTML report. Grouping by `source_type` enables the **Simulation vs Interaction comparison** charts side-by-side.

**2. Core Conversational Data (`user_inputs`, `final_response`)**
*   **Unlocks:** The foundation of the whole framework. Sent to Vertex AI to power all reference-free metrics like `answer_relevance`, `safety`, `general_quality`, `coherence`, and `verbosity`.

**3. Ground Truth Verification (`reference_data`)**
*   **Unlocks:** Deep accuracy checks. Providing this unlocks strict rubric metrics like `FINAL_RESPONSE_MATCH` and `TOOL_USE_QUALITY`. Notice the custom keys like `expected_docs` or `expected_routing`? `agent-eval` allows you to write custom metrics that specifically grade the model against these nested keys to see if it hallucinated sources.

**4. External State Tracking (`extracted_data`)**
*   **Unlocks:** State-driven evaluation. This allows you to evaluate your agent based on backend conditions that the LLM might not even be aware of in the chat box (e.g., verifying that the agent successfully respected the `"Tier_1"` user clearance loop).

**5. Operational Tracing (`session_trace`, `trace_summary`)**
*   **Unlocks:** The final 11 deterministic metric tables.
    *   **Tokens & Costs:** Lights up the projected USD API costs, KV-Cache hit rate efficiency, and token density.
    *   **Latency:** Computes Time to First Token (TTFT) and average turn latency (requires `name`, `start_time` and `end_time` in nanoseconds).
    *   **Context:** Measures total tokens against the model's max limit using `gen_ai.request.model`, visualizing context "Saturation".
    *   **Tools:** Calculates the overall tool failure rate across the dataset using `Tool Status` inside a `tool_call` span.

---

## 💡 BigQuery Export Tip
If you are generating this dataset directly via SQL in BigQuery, **do not** use `TO_JSON_STRING()` on your final `SELECT` payload. 

Instead, construct the schema natively using BigQuery `STRUCT`s and `ARRAY`s, outputting them as standard columns. Then, use the BigQuery UI button **"Save Results -> JSON (Newline Delimited)"**. This ensures there are no accidental string escaping issues, placing your data perfectly into the required format.
