# Computer Use Evaluation Pipeline

**Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.**

A lightweight framework for benchmarking browser agents. It runs tasks, records the screen, and scores performance using code assertions and Gemini.

## 🎯 Purpose

This pipeline is designed for developers to **evaluate and test** the Gemini Computer Use model with **zero friction**. 

It is **not** an agentic harness for production automation. Instead, it is a **testing and drive-evaluation tool** that allows you to:
- Objective measurement of agent performance on specific UI tasks.
- Rapidly iterate on system prompts and context strategies.
- Verify stability and safety across multiple screen resolutions.
- Conduct **Root-Cause Analysis (RCA)** via multimodal visual and log judging to understand why an agent failed.

The goal is to provide a standardized "exam" environment for browser agents, ensuring they are reliable for enterprise workflows (e.g., **Enterprise Resource Planning (ERP)**) before deployment.

## 💡 Key Concepts

### System Prompting (Inheritance)
The pipeline provides a high-efficiency **Default System Prompt** that handles turn-batching and smart input. When defining your own prompt in YAML, use the `{{DEFAULT}}` placeholder to inherit these core rules:

```yaml
agent:
  system_prompt: |
    {{DEFAULT}}
    
    # Task-specific instructions
    Stay within the ERP workflow...
```
*Note: Omitting `{{DEFAULT}}` will completely replace the agent's operating rules.*

### Zero-Friction Auto-Injection (Self-Healing)
Visual agents often get stuck in repetitive loops when they can't visually locate elements on the screen. To solve this, the pipeline includes an advanced **Auto-Injection Middleware** that bridges the "Vision-DOM Gap" with **zero developer overhead**. 

Instead of forcing the agent to use complex developer tools (which breaks its "standard user" persona), the middleware automatically intercepts failures and injects context directly into the prompt:
1.  **Semantic Location Hints:** Deterministic viewport-relative coordinates calculated by the browser engine (e.g., `[Location: Off-screen below (requires scrolling DOWN)]`).
2.  **Supervisor Advice:** A lightweight LLM (Flash Lite) analyzes the DOM and exact Playwright errors to provide a single sentence of behavioral coaching, helping the agent navigate complex UI paradigms.

### Advanced Perception & Architecture
The framework is built around a modern, modular architecture:
- **`core/`, `browser/`, `actions/` Structure:** Clean separation of concerns replacing legacy monolithic classes (like the deprecated `ActionSpace`).
- **Gemini 3 Integration:** Native support for the Gemini 3 family (e.g., Flash models) for both the main agent and reasoning judges.
- **Aria Hashing & Smart Batching:** High-performance DOM state stagnation detection (Aria Hashing) and optimized action batching to reduce latency.
- **PerceptionService & CoordinateScaler:** Advanced hitbox normalization and visual state processing to ensure the agent's spatial understanding aligns perfectly with the actual viewport.

### Evaluation Judges
Every run is evaluated by:
- **Assertion Judge:** Deterministic URL/DOM/Script checks.
- **Video Judge:** Visual success analysis by Gemini (multimodal).
- **Log Judge:** Reasoning and safety audit.

## ⚡ Quick Start

### 1. Install
Initialize the environment and install dependencies.
```bash
uv sync
uv run playwright install chromium
```

### 2. Configure
Create a `.env` file (see [Setup Guide](docs/SETUP.md)):
```env
GCP_PROJECT_ID="your-project-id"
GCP_REGION="us-central1"
```

### 3. Run a Benchmark

**Step 1: Create a Benchmark**
Generate a new benchmark directory from a template. This creates a folder in `config/benchmarks/` with a starter `benchmark.yaml`.
```bash
uv run computer-eval create "My First Test"
# Output: ✅ Created standard benchmark structure at: config/benchmarks/my_first_test/
```

**Step 2: Run it**
Execute the evaluation. The pipeline will open a browser (if not in headless mode), run the task, and generate a report in `artifacts/`.
```bash
uv run computer-eval --benchmark config/benchmarks/my_first_test/benchmark.yaml
```

**Step 3: View Results**
Open the latest run summary to see success scores and judge reasoning.
```bash
cat artifacts/my-first-test/latest/result.json
```

---

## ⚖️ How it Works

The pipeline evaluates agents using three methods:

| Method | Type | Description |
| :--- | :--- | :--- |
| **Assertion** | Code | Validates the final URL, DOM elements, and JavaScript state. |
| **Video** | Vision | Uses Gemini to watch the screen recording and verify the goal was reached. |
| **Trace** | Logic | Audits the agent's internal logs for reasoning and safety issues. |

---

## 🛡️ Safety & Telemetry

### Safety Modes
Control how the agent handles high-stakes actions:
*   `interactive` (Default): Pauses for human confirmation.
*   `auto_approve`: Automatically allows actions (for CI/CD).
*   `auto_deny`: Automatically blocks actions (for safety testing).

### Metrics
We track:
*   **Success Rate:** Did the agent complete the task?
*   **Autonomy Score:** Percentage of steps completed without human help.
*   **Cost:** Input/output token usage.

---

## 📚 Documentation

- [**🚀 Start Here: Hello World & Experiments**](docs/guides/HELLO_WORLD.md): Zero-to-hero guide.
- [**Setup Guide**](docs/SETUP.md): Installation and Authentication.
- [**🐳 Docker Setup & Usage**](docs/guides/DOCKER_USAGE.md): Running reproducible benchmarks in containers.
- [**Usage Guide**](docs/USAGE.md): CLI commands and Batch Evaluation.
- [**Architecture**](docs/architecture/PIPELINE.md): How the system works.
- [**Creating Benchmarks**](docs/guides/CREATING_BENCHMARKS.md): Defining new tasks.
- [**Configuration**](docs/guides/CONFIGURATION.md): YAML schema reference.
- [**Extending the Pipeline**](docs/guides/EXTENDING.md): Adding custom tools and hooks.
- [**Prompting**](docs/guides/PROMPTING.md): Best practices for agent instructions.
- [**Performance**](docs/guides/PERFORMANCE.md): Latency and optimization.

---

## 🤝 Contributing

See our documentation for guidelines on adding new features or benchmarks.
- [**General Code Principles**](conductor/code_styleguides/general.md)
- [**Python Style Guide**](conductor/code_styleguides/python.md)

---

## 📄 License

Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
