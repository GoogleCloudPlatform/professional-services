# Evaluation Dataset Schema (`dataset.jsonl`)

The evaluation dataset `tests/eval/dataset.jsonl` is an immutable, single-line JSON Lines format compliant with ADK `AgentData` and Google Agent Platform specifications.

---

## 1. Canonical Record Fields

| Field | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `id` | `str` | Unique scenario identifier (e.g. `Q1`, `TC-001`). | **Yes** |
| `prompt` | `str` | Initial user goal / prompt for Turn 1. | **Yes** |
| `conversation_plan` | `list[str]` | Sequence of multi-turn user follow-up responses for dynamic UserSim execution. | No (Single-turn if omitted) |
| `reference_data` | `dict` | Ground truth expectations (expected response, reference SQL, golden entity values). | No |
| `session_inputs` | `dict` | Initial state variables injected into the agent session before Turn 1. | No |
| `agents` | `dict` | Multi-agent topology mapping (`type`, `description`, `sub_agents`). | No |

---

## 2. JSON Examples

### Single-Turn Scenario
```json
{"id": "TC-01", "prompt": "What were our top 5 revenue products in Q3 2025?", "reference_data": {"expected_entities": ["ProductA", "ProductB"]}}
```

### Multi-Turn Conversational Scenario
```json
{"id": "TC-02", "prompt": "Recommend seed hybrids for farm region 10.", "conversation_plan": ["I want high-yield maturity 105 corn with drought tolerance.", "Compare the top candidate against the commercial check."], "reference_data": {"expected_response": "..."}}
```
