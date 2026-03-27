# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from typing import Optional
from dotenv import load_dotenv
from enum import Enum
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel, Field

# Load environment variables before Settings instantiation
load_dotenv()


class ReflectionStrategy(str, Enum):
    NONE = "NONE"
    NUDGE = "NUDGE"
    INJECT = "INJECT"


class ImageRetentionStrategy(str, Enum):
    AGGRESSIVE = "aggressive"  # Legacy: Truncate after 3-5 images
    VARIABLE_FIDELITY = "variable_fidelity"  # 1-5 full, 6-20 downscaled
    FULL_FIDELITY = "full_fidelity"  # Keep all 20 images at full resolution


class ImageQuality(str, Enum):
    LOW = "low"  # 50% scale + Grayscale
    MEDIUM = "medium"  # 75% scale + Color
    HIGH = "high"  # Full resolution (scaled to max screen width)


class ThinkingLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ContextConfig(BaseModel):
    """
    Configuration for the Context Pipeline strategies.
    Designed to be loaded from benchmark YAML.
    """

    preset: str = Field(
        "BALANCED",
        description="Context strategy preset: 'ACCURATE', 'BALANCED', 'EFFICIENT', or 'AGGRESSIVE'.",
    )
    max_images_in_history: Optional[int] = Field(
        None,
        description="Override: Maximum number of intermediate screenshots to retain (Window).",
    )
    image_retention_strategy: Optional[ImageRetentionStrategy] = Field(
        None,
        description="Override: Image retention strategy (aggressive, variable_fidelity, full_fidelity)",
    )
    image_quality: Optional[str] = Field(
        None,
        description="Override: Image capture quality: 'low', 'medium', or 'high'.",
    )
    thinking_level: Optional[ThinkingLevel] = Field(
        None, description="Override: Thinking level (LOW, MEDIUM, HIGH)"
    )
    enable_context_caching: Optional[bool] = Field(
        None, description="Override: Enable/Disable context caching"
    )
    summarization_model: Optional[str] = Field(
        None, description="Override: Model used for semantic summarization"
    )
    summarization_token_threshold: Optional[int] = Field(
        None,
        description="Override: Token count threshold to trigger semantic summarization",
    )
    reflection_strategy: Optional[ReflectionStrategy] = Field(
        default=ReflectionStrategy.NUDGE,
        description="Strategy for handling agent failures and stalemates: NONE, NUDGE, or INJECT",
    )
    stalemate_strict_threshold: Optional[int] = Field(
        None, description="Override: Strict threshold for stalemate detection."
    )
    stalemate_loose_threshold: Optional[int] = Field(
        None, description="Override: Loose threshold for stalemate detection."
    )
    stalemate_history_window: Optional[int] = Field(
        None, description="Override: History window length for stalemate detection."
    )
    model_api_retries: Optional[int] = Field(
        None, description="Override: Max API retries for model calls."
    )
    enable_compaction: Optional[bool] = Field(
        None, description="Override: Enable/Disable lossless loop folding."
    )
    enable_summarization: Optional[bool] = Field(
        None, description="Override: Enable/Disable LLM history summarization."
    )
    step_delay: float = Field(
        0.0, description="Override: Delay in seconds between agent steps."
    )
    disable_fast_typing_bundles: bool = Field(
        False,
        description="Override: Disable high-speed typing bundling for highly concurrent models.",
    )


class Settings(BaseSettings):
    """
    Central configuration for the Computer Use Pipeline.
    Reads from environment variables (prefix 'GCP_') or .env file.
    """

    model_config = SettingsConfigDict(
        env_prefix="GCP_", env_file=".env", populate_by_name=True, extra="ignore"
    )

    # Logging
    LOG_LEVEL: str = Field(
        "INFO",
        description="Global log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )
    LOG_FORMAT: str = Field(
        "%(asctime)s - [%(run_id)s] - %(name)s - %(levelname)s - %(message)s",
        description="Standard logging format",
    )

    # Infrastructure
    PROJECT_ID: str = Field(
        "local-dev",
        description="GCP Project ID (Required for Vertex, ignored for Simulator)",
    )
    REGION: str = Field("us-central1", description="GCP Region")

    # Model
    MODEL_NAME: str = Field(
        "gemini-2.5-computer-use-preview-10-2025", description="Gemini Model Version"
    )
    JUDGE_MODEL: str = Field(
        "gemini-3.1-pro-preview", description="Model used for LLM Judge"
    )

    # Execution
    HEADLESS_MODE: bool = Field(True, description="Run browser in headless mode")
    SAFETY_MODE: str = Field(
        "auto",
        description="Safety policy mode: 'interactive', 'auto_approve', 'auto_deny', or 'auto' (interactive if not headless, else auto_approve)",
    )
    USE_VERTEX_EVAL: bool = Field(
        False,
        description="Use Vertex AI GenAI Evaluation Service instead of custom LLM calls",
    )

    # Debugging
    SCREEN_WIDTH: int = 1440
    SCREEN_HEIGHT: int = 900
    MAX_STEPS: int = Field(50, description="Maximum number of steps for the agent")
    MAX_HISTORY_TURNS: int = Field(
        30, description="Maximum number of turns to keep in conversation history"
    )
    MAX_IMAGES_IN_HISTORY: int = Field(
        3,
        description="Maximum number of intermediate screenshots to retain (Rolling Window). -1=Keep All, 0=None (Initial+Current only).",
    )
    IMAGE_QUALITY: ImageQuality = Field(
        ImageQuality.HIGH,
        description="Default image capture quality: 'low', 'medium', or 'high'.",
    )
    IMAGE_FORMAT: str = Field(
        "png",
        description="Image format for screenshots. Note: The computer_use tool backend currently requires 'png'.",
    )
    IMAGE_GRAYSCALE: bool = Field(
        False,
        description="Convert screenshots to grayscale before sending to model to save bandwidth and tokens.",
    )
    THINKING_LEVEL: ThinkingLevel = Field(
        ThinkingLevel.LOW,
        description="Default thinking level for supported models.",
    )
    IMAGE_RETENTION_STRATEGY: ImageRetentionStrategy = Field(
        ImageRetentionStrategy.AGGRESSIVE,
        description="Image retention strategy: 'aggressive', 'variable_fidelity', or 'full_fidelity'.",
    )
    CONTEXT_PRESET: str = Field(
        "BALANCED",
        description="Context strategy preset: 'ACCURATE', 'BALANCED', or 'EFFICIENT'.",
    )
    ENABLE_TRACING: bool = Field(
        False,
        description="Enable Playwright execution tracing (screenshots + snapshots).",
    )
    BLOCK_HEAVY_RESOURCES: bool = Field(
        False,
        description="Enable Playwright network interception to block images, fonts, and media. WARNING: May degrade vision model performance on icon-heavy UIs.",
    )
    ENABLE_MUTATION_OBSERVER: bool = Field(
        False,
        description="Inject a JS mutation observer to detect UI changes instantly, avoiding slow ARIA snapshot checks.",
    )

    ENABLE_CONTEXT_CACHING: bool = Field(
        False,
        description="Enable Context Caching to dramatically reduce Time-to-First-Token (TTFT) for static system prompts and tools. Disabled by default as some preview models lack support.",
    )
    CACHE_TTL_MINUTES: int = Field(
        30,
        description="Time to live (in minutes) for the context cache.",
    )

    # Context Optimization (Built-in)
    SUMMARIZATION_MODEL: str = Field(
        "gemini-2.5-flash-lite", description="Model used for semantic summarization"
    )
    SUMMARIZATION_TOKEN_THRESHOLD: int = Field(
        100000,
        description="Token count threshold to trigger semantic summarization. Set higher to minimize summarization overhead unless latency evidence suggests otherwise.",
    )
    PROTECTED_HEAD_TURNS: int = Field(
        3,
        description="Number of turns at the start (Goal/Plan) to NEVER summarize or trim.",
    )

    # Self Healing
    ENABLE_STALEMATE_DETECTION: bool = Field(
        True,
        description="Enable/Disable stalemate detection middleware (Reflect & Retry loops).",
    )
    STALEMATE_STRICT_THRESHOLD: int = Field(
        5,
        description="Strict threshold for stalemate detection.",
    )
    STALEMATE_LOOSE_THRESHOLD: int = Field(
        15,
        description="Loose threshold for stalemate detection.",
    )
    STALEMATE_HISTORY_WINDOW: int = Field(
        20,
        description="History window length for stalemate detection.",
    )
    MODEL_API_RETRIES: int = Field(
        5,
        description="Max API retries for model calls.",
    )
    REFLECTION_MODEL: str = Field(
        "gemini-2.5-flash-lite",
        description="Fast model used for AUTO_INJECT_LLM DOM semantic search",
    )
    REFLECTION_LLM_TIMEOUT: int = Field(
        5, description="Timeout in seconds for the reflection LLM call"
    )

    # Auth
    API_KEY: str | None = Field(None, description="Google AI Studio API Key (Optional)")

    # Paths
    OUTPUT_DIR: str = Field("./artifacts", description="Directory for logs/video")
    GCS_BUCKET: str | None = Field(
        None, description="GCS Bucket for staging videos (Required for Vertex AI Judge)"
    )

    # BigQuery Reporting
    ENABLE_BIGQUERY: bool = Field(False, description="Enable BigQuery result export")
    BIGQUERY_DATASET: str = Field("computer_use_evals", description="BQ Dataset ID")
    BIGQUERY_TABLE: str = Field("runs", description="BQ Table ID")

    # Sandbox
    USE_SANDBOX: bool = Field(False, description="Use Vertex AI Agent Engine Sandbox")
    SANDBOX_PROJECT_ID: str | None = Field(None, description="GCP Project for Sandbox")
    SANDBOX_LOCATION: str = Field("us-central1", description="GCP Region for Sandbox")
    SANDBOX_AGENT_ENGINE_NAME: str | None = Field(
        None, description="Optional: Use an existing long-lived Agent Engine name"
    )
    SANDBOX_SERVICE_ACCOUNT: str | None = Field(
        None, description="Service Account for Token Generation"
    )
    VERTEX_API_BASE_URL: str | None = Field(
        None, description="Override Vertex AI Base URL (e.g. for Autopush)"
    )


settings = Settings()
