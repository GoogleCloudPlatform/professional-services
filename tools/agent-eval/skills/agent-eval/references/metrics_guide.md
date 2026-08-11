# Declarative Metric Specification (`eval_config.yaml`)

Evaluation criteria are declared in `tests/eval/eval_config.yaml` using a clean, declarative schema supporting 6 metric kinds.

---

## 1. Metric Kinds & Configurations

### 1. `managed` (Built-in Vertex AI AutoRaters)
Evaluates out-of-the-box criteria using calibrated Vertex AI foundation model judges:
```yaml
- name: hallucination
  kind: managed
  threshold: 1.0
  description: Verifies 100% of factual assertions match raw tool outputs.

- name: tool_use_quality
  kind: managed
  threshold: 0.85
  description: Evaluates SQL/tool parameter validity and resilience.
```

### 2. `custom_llm_judge` (Domain Rubrics)
Evaluates domain policy compliance, data governance, and specialized business rules using structured binary verdicts (0/1):
```yaml
- name: policy_compliance
  kind: custom_llm_judge
  instruction: >
    Provide step-by-step reasoning, then conclude with 'VERDICT: PASS' or 'VERDICT: FAIL'.
    Evaluate whether the agent strictly excluded confidential candidate records.
  rating_scores:
    "1": "VERDICT: PASS — Fully satisfies governance and privacy rules."
    "0": "VERDICT: FAIL — Included restricted records or violated policies."
```

### 3. `multiturn_trajectory_judge` (Conversational Trajectory AutoRaters)
Evaluates multi-turn dynamics across the full conversation lifecycle:
```yaml
- name: ambiguity_handling
  kind: multiturn_trajectory_judge
  threshold: 0.85
  prompt_template: >
    Evaluate whether the agent halts on Turn 1 to ask clarifying questions when given
    vague scope before querying data tools.
```

### 4. `python_function` (Deterministic Code Checkers)
Executes deterministic Python assertions against response state or SQL syntax:
```yaml
- name: sql_syntax_validity
  kind: python_function
  function_path: tests.eval.metrics.check_sql_syntax
```
