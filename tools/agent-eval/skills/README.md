# Skills

Agent-assistant skills that teach a coding assistant how to evaluate an agent
well — the process and judgement, not just the commands.

| Skill | Use it for |
|-------|-----------|
| [`agent-eval-workflow`](agent-eval-workflow/SKILL.md) | End-to-end evaluation: designing metrics from a hypothesis, making an agent measurable, auditing generated eval config, reading results, and running the improvement loop. |

These are deliberately **tool-agnostic where it matters**. The CLI surface will
change — `agent-eval` and `agents-cli` are converging — but how you scope a
metric, design a dataset that can fail, and read a result keeps its value.

## Install

The skills are plain folders containing a `SKILL.md`. Symlink them into your
assistant's skills directory so they update when you pull.

```bash
REPO="$(pwd)/tools/agent-eval/skills"     # from the repo root

# Agents CLI
mkdir -p ~/.agents/skills
ln -sfn "$REPO/agent-eval-workflow" ~/.agents/skills/agent-eval-workflow

# Antigravity CLI (its skills dir links to ~/.agents/skills)
mkdir -p ~/.gemini/antigravity-cli/skills
ln -sfn ~/.agents/skills/agent-eval-workflow \
        ~/.gemini/antigravity-cli/skills/agent-eval-workflow
```

Verify it resolves:

```bash
head -3 ~/.gemini/antigravity-cli/skills/agent-eval-workflow/SKILL.md
```

Copy the folders instead of symlinking if you would rather pin a version.
