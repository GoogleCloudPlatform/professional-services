# Autoresearch Agent Program

This is an experiment to have the LLM do its own research and optimize a target benchmark's system prompt using a **Population-Based Evolutionary Search**.

## Setup

Before starting a new experiment loop, work with the user to:

1. **Load Configuration**: Read the `autoresearch/.env` file to identify the `TARGET_BENCHMARK`, `EVAL_MODEL`, and `STORAGE_BUCKET`. If `.env` does not exist, look at `autoresearch/.env.example`, ask the user to provide these values interactively, and create the `.env` file for them.
2. **Create the branch**: Ensure you are on a fresh `autoresearch/<tag>` branch (e.g., `autoresearch/test-run`).
3. **Read Context**: Read `autoresearch/evaluate_task_prompt.py`, `autoresearch/evaluate_population.py`, and the target benchmark YAML file identified in step 1.
4. **Initialize Ledger**: Create `autoresearch/results.tsv` if it doesn't exist, with the header row: `commit\tscore\tstatus\tdescription`. The score is a composite (e.g., `success_rate%_avg_steps`).
5. **Confirm**: Confirm the setup looks good and kick off the experimentation.
6. **Persistent Session Check**: If running on a remote machine (like Cloudtop) and the loop needs to run continuously (even if the user's computer goes to sleep), remind the user to start the agent within a terminal multiplexer like `tmux` (`tmux new -s autoresearch`) or use `nohup` before kicking off the long-running process.

## Experimentation

Your objective is to optimize the `system_prompt` within the target benchmark YAML file to achieve a 100% success rate on that task with the minimum number of steps and maximum stability.

**What you CAN do:**
- Modify the `system_prompt` and `task` inside the target benchmark YAML file.
- **Overfit** to this specific task and target website. If a specific UI element requires a 5-second wait state or a specific click sequence, you should hardcode that into the prompt.

**What you CANNOT do:**
- Modify `autoresearch/evaluate_task_prompt.py`, `autoresearch/evaluate_population.py`, or any evaluation code.
- Modify the core agent framework.
- **NEVER hardcode absolute pixel coordinates or randomly generated IDs.** You can overfit to the logic and element semantics (e.g., 'Click the button with ARIA label X'), but pixels and random IDs will break across seeds and window sizes.
- **NEVER run Python scripts without `uv run`.** If you must manually execute an evaluation script, always prefix it with `uv run` (e.g., `uv run python autoresearch/evaluate_task_prompt.py`) so the correct environment is loaded.
- **NEVER use the `navigate` tool to bypass the UI after login.** You MUST instruct the agent to click through the actual UI menus (e.g., hamburger menu -> Orders -> Order Entry) to ensure authentic interaction, while keeping the prompt as concise as possible.

**Prompting Best Practices (Gemini 3):**
When formulating your hypothesis and mutating the prompt, you **MUST** evaluate your proposed changes against these Gemini 3 best practices:
1. **Directness over Verbosity:** Prioritize direct, logical instructions. Do not use conversational filler or "chatty" language.
2. **Clear Separation (XML/Markdown):** Use XML or Markdown tags (e.g., `<instructions>`, `<constraints>`) to clearly separate instructions from data or context.
3. **Constraints at the End:** Place critical constraints (e.g., "NEVER do X", "You MUST use tool Y") at the *very end* of the prompt so they are the last thing the model reads.
4. **Split-Step Verification:** For complex multi-step tasks, instruct the agent to use a "planning" phase or to verify intermediate steps before proceeding.

**Reward Function (The Metric):**
The `evaluate_task_prompt.py` script calculates a **Composite Reward** using this logic:
1. **Success (The Anchor):** Reward is 0.0 unless Success Rate is 100%. (Note: IGNORE any 403 Forbidden errors in the logs related to the Video Judge or LLM Judge, such as uploading to the `STORAGE_BUCKET` or calling the `EVAL_MODEL` defined in your `.env`. These do not affect the Assertion Judge and should not stop your loop).
2. **Efficiency:** `(1000 / avg_steps) + (100 / avg_tokens)`
3. **Stability (Variance Penalty):** Subtracts the `step_variance`. We want the prompt to work the same way every time.
4. **Simplicity (Length Penalty):** Subtracts `(prompt_length / 100)`. Shorter prompts win ties.

## The Evolutionary Loop

**Phase 1: Baseline**
Run the evaluation once without changes to establish your "zero" state. Log this to `results.tsv`.

**Phase 2: Population Initialization**
If `autoresearch/population/` is empty or only has the baseline, generate **3 diverse candidates** (Candidate A, B, C) based on different hypotheses. Save them as `autoresearch/population/candidate_<id>.yaml`.

**Phase 3: The Tournament (LOOP FOREVER)**

1. **Review Results & Learn:** Read `autoresearch/results.tsv` and `autoresearch/LEARNINGS.md`. Read the tail of `failures.log` for any previous losers.
2. **Mutate (Create Population):** Based on the current winner (the file at `target_benchmark`), generate **3-5 new candidates**. 
   - Each candidate should test a DIFFERENT hypothesis (e.g., "Candidate A: Try mega-batching", "Candidate B: Try extreme brevity", "Candidate C: Try visual-first heuristics").
   - Save each as `autoresearch/population/candidate_<unique_tag>.yaml`.
3. **Run Tournament:** Execute the tournament script:
   `./autoresearch/run_tournament.sh`
   - This script runs each candidate in `autoresearch/population/` and overwrites the target benchmark with the winner.
4. **Read Tournament Logs:** Read `tournament.log` to see which candidate won and why others failed.
5. **Update Ledger & Learnings:**
   - Record the winner's result in `autoresearch/results.tsv`.
   - Update `autoresearch/LEARNINGS.md` with what worked and what didn't from this generation.
6. **Cull:** Delete all yaml files in `autoresearch/population/` EXCEPT for the top 1-2 winners to keep the next generation's search space clean.
7. **Commit:** Run `git commit -am "generation <N>: winner <description>"` to save the state.

**NEVER STOP:** Once the loop has begun, do NOT pause to ask the human if you should continue. You are autonomous. If you run out of ideas, try more radical prompt structure changes or study the `failures.log` deeper. The loop runs indefinitely until the human interrupts you.
