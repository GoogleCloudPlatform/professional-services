# Copyright 2026 Google LLC

import os
import logging
from computer_use_eval.cli.templates import (
    BASIC_YAML,
    STANDARD_YAML,
    STANDARD_PROMPT,
    STANDARD_ASSERTION,
)

logger = logging.getLogger(__name__)


def create_benchmark(
    name: str, template: str = "standard", output_dir: str = "config/benchmarks"
):
    """
    Creates a new benchmark template.
    """
    # Sanitize name for filesystem
    safe_name = name.lower().replace(" ", "_")
    target_dir = os.path.join(output_dir, safe_name)

    if os.path.exists(target_dir) or os.path.exists(f"{target_dir}.yaml"):
        print(f"Error: A benchmark named '{safe_name}' already exists at {target_dir}")
        return

    if template == "basic":
        os.makedirs(output_dir, exist_ok=True)
        file_path = f"{target_dir}.yaml"
        with open(file_path, "w") as f:
            f.write(BASIC_YAML.format(name=name))
        print(f"✅ Created basic benchmark at: {file_path}")

    else:  # standard
        # Create directory structure
        os.makedirs(os.path.join(target_dir, "prompts"), exist_ok=True)
        os.makedirs(os.path.join(target_dir, "assertions"), exist_ok=True)

        # 1. benchmark.yaml
        with open(os.path.join(target_dir, "benchmark.yaml"), "w") as f:
            f.write(STANDARD_YAML.format(name=name))

        # 2. prompts/system.md
        with open(os.path.join(target_dir, "prompts", "system.md"), "w") as f:
            f.write(STANDARD_PROMPT.format(name=name))

        # 3. assertions/success.js
        with open(os.path.join(target_dir, "assertions", "success.js"), "w") as f:
            f.write(STANDARD_ASSERTION.format(name=name))

        print(f"✅ Created standard benchmark structure at: {target_dir}/")
        print(f"   - Edit prompt: {target_dir}/prompts/system.md")
        print(f"   - Edit logic:  {target_dir}/assertions/success.js")
        print(
            f"   - Run it:      uv run computer-eval --benchmark {target_dir}/benchmark.yaml"
        )
