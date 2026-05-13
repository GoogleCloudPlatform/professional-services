# Extensibility Demo: Custom Tools & Hooks

This example demonstrates how to extend the `computer-use-eval` framework with custom Python tools and runtime hooks, decoupled from the core library.

## Features Showcase
1.  **Custom Tools:** `custom_tools.py` defines `calculate_shipping_tax`, which is dynamically injected into the Gemini Agent's context.
2.  **Runtime Hooks:** `hooks.py` defines `validate_navigation`, which runs after every step to check if the agent is visiting allowed domains.
3.  **YAML Integration:** `benchmark.yaml` references these external files via standard configuration.

## Running the Benchmark

To run this benchmark from the project root:

```bash
uv run computer-eval \
  --benchmark examples/custom_hooks_demo/benchmark.yaml \
  --resolutions 1024x768 \
  --model gemini-3.0-flash-preview
```

**Note:** This benchmark requires network access to reach `google.com`.
