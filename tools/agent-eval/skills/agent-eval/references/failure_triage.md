# 2-Tier Failure Triage & Context Engineering Remediation

Agent failures are fundamentally context engineering failures. Map observed benchmark regressions to specific Context Engineering Optimization Strategies.

---

## 1. The 4 Context Failure Modes & Remediation

| Failure Mode | Symptom | Strategy | Remediation Action |
| :--- | :--- | :--- | :--- |
| **Poisoning** | Raw tool error dumps or invalid schemas injected into context. | **Compress** | Truncate tool output payload; implement tool-level circuit breakers. |
| **Distraction** | Excessive 100+ row table dumps diluting model attention. | **Select / Compress** | Compact memory history; add `LIMIT` filters to tool parameters. |
| **Confusion** | Ambiguous tool docstrings or missing schema invariants. | **Write** | Add strict parameter typing and validation schemas in Python tool code. |
| **Clash** | System instructions conflicting with safety guidelines. | **Isolate** | Separate orchestrator rules from tool transformation logic; isolate sub-agents. |

---

## 2. 2-Tier Loss Clustering Protocol

When analyzing low scores in `report.html` or `gemini_analysis.md`:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ TIER 1: CONTEXT ENGINE FAILURES      │ TIER 2: EVALUATOR RUBRIC ERRORS      │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ The agent genuinely produced a poor  │ The agent gave a valid answer, but   │
│ response due to tool or prompt bugs. │ the judge rubric failed it.          │
│ • Fix: Adjust system instructions or │ • Fix: Calibrate eval_config.yaml    │
│   tool code; run GEPA optimizer.     │   with explicit exception cases.     │
└──────────────────────────────────────┴──────────────────────────────────────┘
```
