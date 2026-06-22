# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Tests for KFP pipeline compilation."""

import tempfile
from pathlib import Path

from agent_eval.core.kfp_pipeline import compile_pipeline


def test_compile_pipeline_success():
    """Verify that the KFP pipeline compiles successfully to a valid JSON file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        output_file = Path(tmpdir) / "pipeline.yaml"
        runner_image = "gcr.io/my-project/agent-eval:latest"

        # Compile the pipeline
        compile_pipeline(output_path=output_file, runner_image=runner_image)

        # Assert file exists
        assert output_file.exists()

        # Load and verify YAML contents
        import yaml

        with output_file.open("r", encoding="utf-8") as f:
            pipeline_spec = yaml.safe_load(f)

        # Verify KFP pipeline schema version and name
        assert "pipelineInfo" in pipeline_spec
        assert pipeline_spec["pipelineInfo"]["name"] == "agent-eval-end-to-end"

        # Verify components are defined in the schema
        assert "deploymentSpec" in pipeline_spec
        executors = pipeline_spec["deploymentSpec"]["executors"]

        # We expect 3 executors (simulate, interact, evaluate)
        assert len(executors) >= 3

        # Verify that our runner_image was correctly baked into the container specs
        # Executors in KFP v2 have container configurations
        found_images = []
        for exec_name, exec_val in executors.items():
            container = exec_val.get("container", {})
            if container:
                found_images.append(container.get("image"))

        assert len(found_images) == 3
        for image in found_images:
            assert image == runner_image
