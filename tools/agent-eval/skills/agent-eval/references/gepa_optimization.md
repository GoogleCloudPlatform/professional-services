# Automated Prompt Optimization with ADK GEPA

Rather than manually guessing prompt phrasing adjustments, `agent-eval` and `google-agents-cli` leverage ADK's **`GEPARootAgentPromptOptimizer`** ([adk.dev/optimize](https://adk.dev/optimize/#geparootagentpromptoptimizer)) to automatically evolve optimal prompts.

---

## 1. How Genetic Evolutionary Prompt Optimization (GEPA) Works

```
                                  ┌────────────────────────┐
                                  │ Seed Prompt (agent.py) │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │ Genetic Mutations      │
                                  │ (Generate N variants)  │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │ Parallel Evaluation    │
                                  │ (Score on dataset.json)│
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │ Pareto Frontier Filter │
                                  │ (Keep winners / kill   │
                                  │  regressions)          │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │ Optimal Calibrated     │
                                  │ System Instruction     │
                                  └────────────────────────┘
```

---

## 2. Running GEPA via CLI & Python

### CLI Invocation
```bash
agent-eval optimize \
  --agent-dir app \
  --optimizer gepa \
  --target-metric business_logic_adherence \
  --generations 5 \
  --population-size 8
```

### Programmatic ADK Python Invocation
```python
from google.adk.optimization import GEPARootAgentPromptOptimizer
from google.adk.evaluation import LocalEvalService

optimizer = GEPARootAgentPromptOptimizer(
    agent_dir="app",
    dataset_path="tests/eval/dataset.jsonl",
    config_path="tests/eval/eval_config.yaml",
    target_metric="business_logic_adherence",
    num_generations=5,
    population_size=8,
)

best_prompt, score = optimizer.optimize()
print(f"Optimal Prompt Discovered (Score: {score:.4f}):\n{best_prompt}")
```
