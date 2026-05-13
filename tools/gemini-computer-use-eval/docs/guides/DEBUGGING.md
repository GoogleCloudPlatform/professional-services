# Debugging Agent Failures

When an agent fails a benchmark, it usually falls into one of several categories. This guide helps you identify the root cause and provides strategies for improvement.

## 1. Using Artifacts

Every benchmark run generates artifacts in `artifacts/<benchmark_name>/run_<timestamp>/`.

- **`result.json`**: The final verdict. Look at the `explanation` provided by the judges for specific failure reasons.
- **`history.json`**: A step-by-step trace of every observation, model prediction, and action execution.
- **`video.webm`**: (If enabled) A screen recording of the agent's actions. This is often the most valuable tool for seeing *exactly* where the agent got stuck.

## 2. Common Failure Modes

### A. Context Rot (Latency Spike)
- **Symptom:** The agent becomes increasingly slow, with "Prediction" times spiking to 30s+. It may start repeating actions or "forgetting" the initial goal.
- **Cause:** The conversation history has grown too large, and the model is overwhelmed by tokens.
- **Fix:** Use a more aggressive context strategy in your YAML:
  ```yaml
  agent:
    context:
      preset: "BALANCED" # or "EFFICIENT"
  ```
  Consider simplifying the task if it takes more than 50 steps.

### B. Navigation Blindness (Off-Screen Elements)
- **Symptom:** The agent says "I can't see the field" or misses a click, but the element clearly exists in the app.
- **Cause:** The element is outside the current viewport or hidden behind a modal/sidebar.
- **Fix:**
    - Run the benchmark at a higher resolution (e.g., `--resolutions 1400x900`).
    - Explicitly tell the agent to "scroll down" or "scroll right" in the system prompt.
    - Use `TAB` navigation as a fallback strategy in your prompts.

### C. Coordinate Drift (Missing Clicks)
- **Symptom:** The agent clicks just a few pixels away from the intended button.
- **Cause:** UI animations, slow-loading elements, or complex DOM structures that shift after the screenshot is taken.
- **Pipeline Safeguard:** The `CoordinateScaler` ensures perfect resolution mapping and automatically **clamps** out-of-bounds coordinates (e.g. `1002` becomes `1000`) to prevent API errors.
- **Fix:** 
    - Check network conditions or if a spinner is present. The framework automatically waits for network idle, but highly dynamic SPA sites might need explicit DOM waiting logic in custom tools.
    - Instruct the agent to "click the center of the element".

### E. Batch Cancellation (Perception Guard)
- **Symptom:** Results in `history.json` show `CANCELLED_BY_PERCEPTION_GUARD`.
- **Cause:** The agent sent a batch of actions, but the UI changed significantly (URL change or >20% DOM shift) between steps.
- **Fix:** This is intended behavior to prevent "blind acting." If it happens too often, reduce the number of actions the agent groups together in its prompt.

### F. Stalemates (The Loop)
- **Symptom:** The agent repeats the same action or gets stuck on a screen.
- **Fix:** Enable **Reflective Supervision** in your YAML:
  ```yaml
  agent:
    context:
      reflection_strategy: "INJECT"
  ```
  This will automatically inject hidden DOM context when a stalemate is detected, helping the agent "see" why its actions are failing.

## 3. Iterative Improvement Workflow

1.  **Identify:** Watch the `video.mp4` to find the exact moment of failure.
2.  **Analyze:** Check the `benchmark.log` for that step. Did the agent see the right thing? Did it output the right coordinates?
3.  **Refine:**
    - **UI Problem?** Adjust the resolution or add a wait.
    - **Logic Problem?** Update the `system_prompt` in the YAML.
    - **Environment Problem?** Check if the app is in an unexpected state.
4.  **Rerun:** Run the benchmark again to verify the fix.

## 4. Getting Help
If you encounter a persistent failure that seems like a bug in the pipeline itself, please open an issue and include the `result.json` and `benchmark.log` from the failed run.
