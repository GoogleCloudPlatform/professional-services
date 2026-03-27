# Prompt Autoresearch Engine

This directory contains the autonomous metaprogramming loop for optimizing `system_prompt` configurations in Conductor benchmarks. 

It implements the "Agent-Native Loop" paradigm (inspired by Andrej Karpathy's `llm.c` autoresearch), where the human provides an instruction manual (`program.md`) and the agent executes the loop autonomously.

## Components
*   `evaluate_task_prompt.py`: The locked evaluation harness. Runs a benchmark $N$ times and computes the composite reward (Success -> Steps -> Tokens). This acts as the unmodifiable "judge".
*   `program.md`: The system prompt and instruction manual for the metaprogramming agent.
*   `visualize.py`: Generates a clean visual graph from the `results.tsv` tracking Reliability %, Average Tokens, and Average Steps over time.

## Quick Start / Testing the Loop

To run the autoresearch loop, you do *not* use a bash script. You instruct an AI agent (e.g., Gemini CLI) to execute `program.md` directly.

**Step 1: Create a Test Branch**
The agent expects to run on an isolated branch so it can freely commit and reset code.
```bash
git checkout -b autoresearch/test-run
```

**Step 2: Start the Agent Loop**
First, copy the example environment file and fill in your specific configuration:
```bash
cp autoresearch/.env.example autoresearch/.env
# Edit autoresearch/.env with your target benchmark and model
```

Then, launch your agent in this directory and give it the kickoff prompt:
```text
Please follow autoresearch/program.md to set up and start the experiment loop. 
```

**Step 3: Monitor the Agent's Progress**
The agent will now read the program, edit the target benchmark, evaluate it, log the results, and automatically use `git commit` and `git reset` to traverse the search space. You can monitor it in a separate terminal:
```bash
# Watch the evaluation logs in real-time
tail -f run.log

# View the agent's successful iterations
git log --oneline

# View the experiment ledger
cat autoresearch/results.tsv
```

## License / Disclaimer

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
