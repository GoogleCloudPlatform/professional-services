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
import os
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Automatically load environment variables from .env file
load_dotenv(override=True)


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
    GOOGLE_CLOUD_PROJECT: Optional[str] = Field(
        default=None, description="GCP Project ID"
    )
    GOOGLE_CLOUD_LOCATION: str = Field(default="us-central1", description="GCP Region")
    MAX_RETRIES: int = Field(default=3, description="Max retries for LLM calls")
    RETRY_DELAY_SECONDS: int = Field(default=5, description="Base delay for retries")
    MAX_WORKERS: int = Field(default=4, description="Threads for parallel evaluation")

    # Data Mappings
    EXTRACTED_DATA_PREFIX: str = "extracted_data"
    REFERENCE_DATA_PREFIX: str = "reference_data"


# Initialize Shared Config
CONFIG = EvalConfig()


def get_project_id() -> Optional[str]:
    """Get the GCP project ID from any supported source.

    Checks (in order): GOOGLE_CLOUD_PROJECT env var, PROJECT_ID env var.
    Calls load_dotenv() first to ensure .env is loaded even when config.py
    wasn't imported earlier in the call chain.
    """
    load_dotenv(override=True)
    return os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("PROJECT_ID")


def get_location(model: Optional[str] = None) -> str:
    """Get the GCP location, with smart defaults for Gemini 3+ models.

    Args:
        model: Optional model name. Gemini 3+ models require 'global'.

    Returns:
        Location string (e.g. 'us-central1', 'global').
    """
    load_dotenv(override=True)
    if model and model.startswith("gemini-3"):
        return "global"
    return os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")


def find_eval_files(eval_dir: Path) -> Dict[str, List[Path]]:
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
    result: Dict[str, List[Path]] = {
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

    return result
