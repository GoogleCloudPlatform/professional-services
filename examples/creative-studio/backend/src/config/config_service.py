# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from typing import Any, Set

import google.auth
from google.auth.exceptions import DefaultCredentialsError
from pydantic import Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ConfigService(BaseSettings):
    """
    Manages application configuration using Pydantic.
    It automatically reads from environment variables, provides type safety,
    and fails fast if critical settings are missing.
    """

    # This tells Pydantic to look for a .env file for local development.
    # In production (e.g., Cloud Run), where this file doesn't exist,
    # Pydantic will automatically and correctly fall back to using
    # system environment variables.
    # The path is relative to this file's location (src/config/).
    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Core Project Settings ---
    PROJECT_ID: str = ""
    LOCATION: str = "global"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:4200"
    LOG_LEVEL: str = "INFO"
    INIT_VERTEX: bool = True

    # --- Google Identity ---
    GOOGLE_TOKEN_AUDIENCE: str = ""
    ALLOWED_ORGS_STR: str = Field(
        default="", alias="IDENTITY_PLATFORM_ALLOWED_ORGS"
    )

    # --- Storage ---
    # The defaults will be set in the validator below to prevent recursion.
    GENMEDIA_BUCKET: str = ""

    # --- Gemini ---
    GEMINI_MODEL_ID: str = "gemini-2.5-pro"
    GEMINI_AUDIO_ANALYSIS_MODEL_ID: str = "gemini-2.5-pro"

    # --- Collections ---
    FIREBASE_DB: str = "cstudio-development"

    # --- Database Configuration ---
    INSTANCE_CONNECTION_NAME: str = ""
    DB_USER: str = "postgres"
    DB_PASS: str = "password"
    DB_NAME: str = "creative_studio"
    USE_CLOUD_SQL_AUTH_PROXY: bool = False
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"

    # --- Veo ---
    VEO_MODEL_ID: str = "veo-2.0-generate-001"

    # --- VTO ---
    VTO_MODEL_ID: str = "virtual-try-on-preview-08-04"

    # --- Lyria ---
    LYRIA_MODEL_VERSION: str = "lyria-002"
    LYRIA_PROJECT_ID: str = ""

    # --- Imagen ---
    MODEL_IMAGEN_PRODUCT_RECONTEXT: str = (
        "imagen-product-recontext-preview-06-30"
    )
    IMAGEN_GENERATED_SUBFOLDER: str = "generated_images"
    IMAGEN_EDITED_SUBFOLDER: str = "edited_images"
    IMAGEN_RECONTEXT_SUBFOLDER: str = "recontext_images"

    # --- Email Service ---
    SENDER_EMAIL: str = (
        ""  # The email address to send from (e.g., no-reply@your-domain.com)
    )
    ADMIN_USER_EMAIL: str = "system"

    @model_validator(mode="before")
    @classmethod
    def get_default_project_id(cls, values: Any) -> Any:
        """Sets the default PROJECT_ID from ADC if not provided in the environment."""
        if not values.get("PROJECT_ID"):
            try:
                _, project_id = google.auth.default()
                if project_id:
                    values["PROJECT_ID"] = project_id
            except DefaultCredentialsError:
                pass  # Fail gracefully, let required fields catch this if needed.
        return values

    # <<< FIX 2: New validator to handle dependent default values >>>
    @model_validator(mode="after")
    def set_dependent_defaults(self) -> "ConfigService":
        """
        Sets default values for fields that depend on other fields (like PROJECT_ID),
        after the initial values have been loaded and validated.
        """
        if not self.PROJECT_ID:
            raise ValueError(
                "PROJECT_ID could not be determined. Please set it via environment variable."
            )

        # If these fields were not set by environment variables, set their default now.
        if not self.GENMEDIA_BUCKET:
            self.GENMEDIA_BUCKET = f"{self.PROJECT_ID}-assets"

        return self

    # This computed field cleanly separates the raw string from the processed set.
    @computed_field
    @property
    def ALLOWED_ORGS(self) -> Set[str]:
        return set(
            org.strip()
            for org in self.ALLOWED_ORGS_STR.split(",")
            if org.strip()
        )

    @computed_field
    @property
    def VIDEO_BUCKET(self) -> str:
        return f"{self.GENMEDIA_BUCKET}/videos"

    @computed_field
    @property
    def IMAGE_BUCKET(self) -> str:
        return f"{self.GENMEDIA_BUCKET}/images"


# Create a single, cached instance of the settings to be used throughout the app.
config_service = ConfigService()
