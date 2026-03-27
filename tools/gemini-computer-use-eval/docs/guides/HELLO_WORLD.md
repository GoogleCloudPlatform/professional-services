# Hello World & Experiments

This guide is your **Golden Path**. It will take you from "Zero" to "running complex agent experiments" in 5 minutes using the built-in scaffolding tools.

---

## 1. The "Hello World"

Instead of writing YAML from scratch, use the `create` command to generate a benchmark template.

### Create a Basic Benchmark
```bash
uv run computer-eval create "Hello World" --template basic
```

This generates `config/benchmarks/hello_world.yaml`.

### Run it
```bash
uv run computer-eval --benchmark config/benchmarks/hello_world.yaml
```

**What just happened?**
1.  The agent opened a browser.
2.  It saw the Google homepage.
3.  It typed "Gemini API" and pressed Enter.
4.  The system verified the final URL matched `google.com/search`.

---

## 2. Going Pro: The Standard Template

For real-world tasks, you don't want giant YAML files. You want to keep your prompts in Markdown and your assertions in JavaScript.

### Create a Standard Benchmark
```bash
uv run computer-eval create "My Complex Task"
```

This creates a **Directory Structure**:
```text
config/benchmarks/my_complex_task/
├── benchmark.yaml       # Configuration only
├── prompts/
│   └── system.md        # Your System Prompt (Markdown)
└── assertions/
    └── success.js       # Your Success Logic (JavaScript)
```

### Edit the Prompt
Open `config/benchmarks/my_complex_task/prompts/system.md`. You now have full syntax highlighting for your agent instructions!

### Run it
```bash
uv run computer-eval --benchmark config/benchmarks/my_complex_task/benchmark.yaml
```

---

## 3. Experiments: Toggling Features

Now that you have a running baseline, let's experiment with the pipeline's capabilities.

### Experiment A: Changing the Persona
How does a "Cautious" agent differ from a "Fast" one?

**Modify `prompts/system.md`:**
```markdown
You are a CAUTIOUS tester. 
1. Before clicking anything, hover over it first.
2. Double-check your spelling before searching.
```
**Run it:** Watch the video. Does the agent take more steps? Does it hover?

### Experiment B: Context Optimization
Long tasks can fill the context window. Let's see how the pipeline manages memory.

**Default Behavior:** `preset: "BALANCED"`. The agent only sees the *first* and the *last few* screenshots to save tokens.

**Enable "Accurate" mode (See everything):**
Modify your `benchmark.yaml`:
```yaml
agent:
  context:
    preset: "ACCURATE"
```
**Run it:**
```bash
uv run computer-eval --benchmark config/benchmarks/my_complex_task/benchmark.yaml
```
**Result:** The "Prediction" time will likely increase as the task goes on, because the model is processing every single frame of history.

### Experiment C: Safety Filters
Test how the agent handles restricted actions.

**Modify the Task in `benchmark.yaml`:**
```yaml
task:
  goal: "Go to a news site and click on a sensitive ad."
```

**Run in `auto_deny` mode:**
```bash
uv run computer-eval --benchmark config/benchmarks/my_complex_task/benchmark.yaml --safety-mode auto_deny
```
**Result:** The pipeline will log a `Safety Violation` and block the click if the model identifies it as high-stakes content.

---

## 4. What's Next?

*   **[Assertions Guide](CREATING_BENCHMARKS.md):** Learn how to write complex JavaScript checks.
*   **[Configuration](CONFIGURATION.md):** See every possible YAML option.
