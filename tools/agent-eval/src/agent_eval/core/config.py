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
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class EvalConfig(BaseSettings):
    """
    Centralized configuration for the evaluation pipeline using Pydantic.
    Reads from environment variables and provides type safety.
    """

    model_config = SettingsConfigDict(
        env_prefix="EVAL_", env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Managed Metric Names
    METRIC_TOOL_USE_QUALITY: str = "TOOL_USE_QUALITY"
    METRIC_GENERAL_QUALITY: str = "GENERAL_QUALITY"

    # Standard Dataset Column Names
    COL_PROMPT: str = "prompt"
    COL_RESPONSE: str = "response"
    COL_INTERMEDIATE_EVENTS: str = "intermediate_events"
    COL_TOOL_USAGE: str = "tool_usage"

    # Execution Settings
    GOOGLE_CLOUD_PROJECT: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "EVAL_GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT", "PROJECT_ID"
        ),
        description="GCP Project ID",
    )
    GOOGLE_CLOUD_LOCATION: str = Field(
        default="us-central1",
        validation_alias=AliasChoices(
            "EVAL_GOOGLE_CLOUD_LOCATION", "GOOGLE_CLOUD_LOCATION", "LOCATION"
        ),
        description="GCP Region",
    )
    MAX_RETRIES: int = Field(default=3, description="Max retries for LLM calls")
    RETRY_DELAY_SECONDS: int = Field(default=5, description="Base delay for retries")
    MAX_WORKERS: int = Field(default=4, description="Threads for parallel evaluation")

    # Data Mappings
    EXTRACTED_DATA_PREFIX: str = "extracted_data"
    REFERENCE_DATA_PREFIX: str = "reference_data"


# Initialize Shared Config
CONFIG = EvalConfig()


def get_project_id() -> str | None:
    """Get the GCP project ID from any supported source.

    Checks (in order): GOOGLE_CLOUD_PROJECT env var, PROJECT_ID env var.
    """
    return EvalConfig().GOOGLE_CLOUD_PROJECT


def get_location(model: str | None = None) -> str:
    """Get the GCP location, with smart defaults for Gemini 3+ models.

    Args:
        model: Optional model name. Gemini 3+ models require 'global'.

    Returns:
        Location string (e.g. 'us-central1', 'global').
    """
    if model and model.startswith("gemini-3"):
        return "global"
    return EvalConfig().GOOGLE_CLOUD_LOCATION


def find_eval_files(eval_dir: Path) -> dict[str, list[Path]]:
    """Discover all eval files in the eval directory.

    Scans each subdirectory for .json files instead of relying on
    hardcoded filenames. Maintains convention (standard names) as
    defaults but discovers all files.

    Args:
        eval_dir: Path to the eval/ directory.

    Returns:
        Dict with keys: 'metrics', 'scenarios', 'golden_data', 'session_input'
        Each value is a list of matching files (sorted by name).
    """
    result: dict[str, list[Path]] = {
        "metrics": [],
        "scenarios": [],
        "golden_data": [],
        "session_input": [],
    }

    metrics_dir = eval_dir / "metrics"
    if metrics_dir.is_dir():
        result["metrics"] = sorted(metrics_dir.glob("*.json"))

    scenarios_dir = eval_dir / "scenarios"
    if scenarios_dir.is_dir():
        result["scenarios"] = sorted(
            f
            for f in scenarios_dir.glob("*.json")
            if f.name not in ("session_input.json", "eval_config.json")
        )
        session = scenarios_dir / "session_input.json"
        if session.exists():
            result["session_input"] = [session]

    eval_data_dir = eval_dir / "eval_data"
    if eval_data_dir.is_dir():
        result["golden_data"] = sorted(eval_data_dir.glob("*.json"))

    dataset_jsonl = eval_dir / "dataset.jsonl"
    if dataset_jsonl.exists():
        result["golden_data"].append(dataset_jsonl)
    else:
        dataset_json = eval_dir / "dataset.json"
        if dataset_json.exists():
            result["golden_data"].append(dataset_json)

    return result
