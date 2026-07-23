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
"""Kubeflow Pipeline (KFP) definition for end-to-end agent-eval."""

import logging
from pathlib import Path
from typing import Any

from kfp import compiler, dsl

logger = logging.getLogger("agent_eval.kfp_pipeline")


# ── KFP Component Definitions ────────────────────────────────────────────────


@dsl.component(
    base_image="{runner_image}",
    packages_to_install=["google-cloud-storage", "pandas", "pydantic"],
)
def simulate_component(
    dataset_gcs_path: str,
    prompts_gcs_output: dsl.OutputPath(str),
) -> None:
    """KFP component to run the User Simulator and generate prompts."""
    import logging
    import tempfile
    from pathlib import Path

    from google.cloud import storage

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("simulate_component")

    # 1. Download dataset from GCS
    storage_client = storage.Client()
    local_dataset = Path(tempfile.mktemp(suffix="_dataset.jsonl"))

    # Parse GCS URI
    bucket_name, blob_name = dataset_gcs_path.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.download_to_filename(local_dataset)

    # 2. Run Simulation
    # The 'agent-eval simulate' CLI command performs validation checks (see
    # agent_eval/cli/commands/simulate.py) and strictly requires 'agent.py'
    # to exist in the agent directory to verify a valid ADK agent context.
    # Since we are running in an isolated container and only using the CLI
    # to project/convert the dataset (not running the actual agent code yet),
    # we create a temporary folder and touch a dummy 'agent.py' to satisfy
    # this CLI validation check.
    temp_agent_dir = Path(tempfile.mkdtemp())
    (temp_agent_dir / "agent.py").touch()

    # We run the simulation in-process to generate prompts
    # Since we are just generating prompts, we don't run the actual agent interactions yet
    # (that happens in the interact step)
    #
    # Let's run the CLI command via subprocess inside the container.
    local_output = Path(tempfile.mktemp(suffix="_prompts.jsonl"))

    import subprocess

    cmd = [
        "agent-eval",
        "simulate",
        "--dataset-path",
        str(local_dataset),
        "--output-path",
        str(local_output),
    ]

    logger.info(f"Running command: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

    # 3. Upload prompts to the KFP-managed output GCS path
    out_bucket_name, out_blob_name = prompts_gcs_output.replace("gs://", "").split(
        "/", 1
    )
    out_bucket = storage_client.bucket(out_bucket_name)
    out_blob = out_bucket.blob(out_blob_name)
    out_blob.upload_from_filename(local_output)

    # Cleanup
    local_dataset.unlink(missing_ok=True)
    local_output.unlink(missing_ok=True)


@dsl.component(
    base_image="{runner_image}",
    packages_to_install=["google-cloud-storage", "requests"],
)
def interact_component(
    prompts_gcs_path: str,
    agent_url: str,
    agent_name: str,
    interactions_gcs_output: dsl.OutputPath(str),
) -> None:
    """KFP component to drive the remote agent and record interactions."""
    import logging
    import subprocess
    import tempfile
    from pathlib import Path

    from google.cloud import storage

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("interact_component")

    storage_client = storage.Client()

    # 1. Download prompts from GCS
    local_prompts = Path(tempfile.mktemp(suffix="_prompts.jsonl"))
    bucket_name, blob_name = prompts_gcs_path.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.download_to_filename(local_prompts)

    # 2. Run Interact CLI
    local_output = Path(tempfile.mktemp(suffix="_interactions.jsonl"))

    cmd = [
        "agent-eval",
        "interact",
        "--prompts-file",
        str(local_prompts),
        "--output-file",
        str(local_output),
        "--agent-url",
        agent_url,
        "--agent-name",
        agent_name,
    ]

    logger.info(f"Running command: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

    # 3. Upload interactions to GCS
    out_bucket_name, out_blob_name = interactions_gcs_output.replace("gs://", "").split(
        "/", 1
    )
    out_bucket = storage_client.bucket(out_bucket_name)
    out_blob = out_bucket.blob(out_blob_name)
    out_blob.upload_from_filename(local_output)

    # Cleanup
    local_prompts.unlink(missing_ok=True)
    local_output.unlink(missing_ok=True)


@dsl.component(
    base_image="{runner_image}",
    packages_to_install=["google-cloud-storage", "google-cloud-aiplatform"],
)
def evaluate_component(
    interactions_gcs_path: str,
    metrics_gcs_path: str,
    explicit_gcs_dest: str,
    results_gcs_output: dsl.OutputPath(str),
    location: str = "us-central1",
) -> None:
    """KFP component to run evaluation metrics on the interactions."""
    import logging
    import os
    import shutil
    import subprocess
    import tempfile
    from pathlib import Path

    from google.cloud import storage

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("evaluate_component")

    storage_client = storage.Client()

    # 1. Download inputs from GCS
    local_interactions = Path(tempfile.mktemp(suffix="_interactions.jsonl"))
    bucket_name, blob_name = interactions_gcs_path.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.download_to_filename(local_interactions)

    local_metrics = Path(tempfile.mktemp(suffix="_metrics.json"))
    m_bucket_name, m_blob_name = metrics_gcs_path.replace("gs://", "").split("/", 1)
    m_bucket = storage_client.bucket(m_bucket_name)
    m_blob = m_bucket.blob(m_blob_name)
    m_blob.download_to_filename(local_metrics)

    # 2. Run Evaluate CLI
    local_results_dir = Path(tempfile.mkdtemp())

    cmd = [
        "agent-eval",
        "evaluate",
        "--interaction-file",
        str(local_interactions),
        "--metrics-files",
        str(local_metrics),
        "--results-dir",
        str(local_results_dir),
        "--gcs-dest",
        explicit_gcs_dest,
        "--location",
        location,
    ]

    logger.info(f"Running command: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

    # 3. Upload summary and details to GCS
    local_summary = local_results_dir / "eval_summary.json"
    if local_summary.exists():
        # A. Upload to KFP managed output path
        out_bucket_name, out_blob_name = results_gcs_output.replace("gs://", "").split(
            "/", 1
        )
        out_bucket = storage_client.bucket(out_bucket_name)
        out_blob = out_bucket.blob(out_blob_name)
        out_blob.upload_from_filename(local_summary)

        # B. Upload directly to explicit_gcs_dest/eval_summary.json (for easy SDK access)
        exp_bucket_name, exp_blob_name = explicit_gcs_dest.replace("gs://", "").split(
            "/", 1
        )
        exp_bucket = storage_client.bucket(exp_bucket_name)
        exp_blob_path = f"{exp_blob_name.rstrip('/')}/eval_summary.json"
        exp_blob = exp_bucket.blob(exp_blob_path)
        exp_blob.upload_from_filename(local_summary)

        # Also upload everything else to the sibling directory for archiving
        parent_blob_dir = Path(out_blob_name).parent
        for root, _, files in os.walk(local_results_dir):
            for file in files:
                local_file_path = Path(root) / file
                rel_path = local_file_path.relative_to(local_results_dir)
                dest_blob_name = f"{parent_blob_dir}/details/{rel_path}"
                sibling_blob = out_bucket.blob(dest_blob_name)
                sibling_blob.upload_from_filename(local_file_path)

    # Cleanup
    local_interactions.unlink(missing_ok=True)
    local_metrics.unlink(missing_ok=True)
    shutil.rmtree(local_results_dir, ignore_errors=True)


# ── Pipeline Definition ──────────────────────────────────────────────────────


def create_evaluation_pipeline(runner_image: str):
    """Dynamically compiles KFP component definitions with the correct runner image."""

    @dsl.pipeline(
        name="agent-eval-end-to-end",
        description="End-to-end serverless agent evaluation pipeline: Simulate, Interact, and Evaluate.",
    )
    def agent_eval_pipeline(
        dataset_gcs_path: str,
        metrics_gcs_path: str,
        agent_url: str,
        agent_name: str,
        gcs_dest: str,
        location: str = "us-central1",
    ):
        # 1. Run Simulation
        sim_task = simulate_component(
            dataset_gcs_path=dataset_gcs_path,
        )

        # 2. Run Interaction (depends on Simulation prompts)
        interact_task = interact_component(
            prompts_gcs_path=sim_task.outputs["prompts_gcs_output"],
            agent_url=agent_url,
            agent_name=agent_name,
        )

        # 3. Run Evaluation (depends on Interaction history)
        eval_task = evaluate_component(
            interactions_gcs_path=interact_task.outputs["interactions_gcs_output"],
            metrics_gcs_path=metrics_gcs_path,
            explicit_gcs_dest=gcs_dest,
            location=location,
        )

        # Disable caching to ensure evals always run fresh when triggered
        sim_task.set_caching_options(False)
        interact_task.set_caching_options(False)
        eval_task.set_caching_options(False)

    return agent_eval_pipeline


# ── Pipeline Compiler Helper ────────────────────────────────────────────────


def compile_pipeline(
    output_path: Path | str,
    runner_image: str,
) -> None:
    """Compile the KFP pipeline to a YAML definition file.

    Args:
        output_path: Local file path to write the compiled pipeline YAML to.
        runner_image: The Docker image containing agent-eval to run the steps.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    simulate_component.component_spec.implementation.container.image = runner_image
    interact_component.component_spec.implementation.container.image = runner_image
    evaluate_component.component_spec.implementation.container.image = runner_image

    pipeline_func = create_evaluation_pipeline(runner_image)

    logger.info(f"Compiling agent-eval pipeline using runner image: {runner_image}...")
    compiler.Compiler().compile(
        pipeline_func=pipeline_func,
        package_path=str(output_path),
    )
    logger.info(f"Pipeline compiled successfully to {output_path}")


# ── Pipeline Job Submission Helper ──────────────────────────────────────────


def submit_pipeline_job(
    project_id: str,
    location: str,
    pipeline_yaml_path: Path | str,
    gcs_dest: str,
    dataset_gcs_path: str,
    metrics_gcs_path: str,
    agent_url: str,
    agent_name: str,
    wait: bool = True,
) -> Any:
    """Submit the compiled KFP pipeline job to Vertex AI Pipelines.

    Args:
        project_id: The Google Cloud project ID.
        location: The Vertex AI region (e.g. us-central1).
        pipeline_yaml_path: Local path to the compiled pipeline.yaml file.
        gcs_dest: GCS destination URI (gs://...) for final evaluation summaries.
        dataset_gcs_path: GCS path to the input dataset.jsonl.
        metrics_gcs_path: GCS path to the input metric_definitions.json.
        agent_url: The remote agent endpoint URL.
        agent_name: The name of the agent application.
        wait: Whether to block and wait for pipeline completion.

    Returns:
        The Vertex AI PipelineJob resource object.
    """
    from google.cloud import aiplatform

    aiplatform.init(project=project_id, location=location)

    # Staging area for KFP intermediate artifacts
    pipeline_root = f"{gcs_dest.rstrip('/')}/pipeline_root"

    parameter_values = {
        "dataset_gcs_path": dataset_gcs_path,
        "metrics_gcs_path": metrics_gcs_path,
        "agent_url": agent_url,
        "agent_name": agent_name,
        "gcs_dest": gcs_dest,
        "location": location,
    }

    job = aiplatform.PipelineJob(
        display_name="agent-eval-end-to-end-run",
        template_path=str(pipeline_yaml_path),
        pipeline_root=pipeline_root,
        parameter_values=parameter_values,
        enable_caching=False,
    )

    logger.info("Submitting PipelineJob to Vertex AI Pipelines...")
    job.submit()
    logger.info(f"PipelineJob submitted successfully! Job ID: {job.resource_name}")
    logger.info(
        f"Monitor the job at: https://console.cloud.google.com/vertex-ai/pipelines/locations/"
        f"{location}/runs/{job.name}?project={project_id}"
    )

    if wait:
        logger.info("Waiting for pipeline job completion...")
        job.wait()
        logger.info("Pipeline job execution complete!")

    return job
