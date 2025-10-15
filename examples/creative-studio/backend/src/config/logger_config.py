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

import logging
from os import getenv
import sys
from google.cloud.logging import Client as LoggerClient
from google.cloud.logging.handlers import CloudLoggingHandler


def setup_logging():
    """
    Configures the root logger for the entire application.
    This should be called once at application startup.
    """
    # Get the logger instance that Uvicorn is using
    # Check the environment to provide readable logs locally
    # and structured JSON logs in production.
    # Attach the Google Cloud Logging handler.
    # This handler automatically formats logs as JSON and sends them to Cloud Logging.
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)  # Set the minimum level for all handlers

    # Clear any existing handlers to prevent duplicate logs
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)

    if getenv("ENVIRONMENT") == "production":
        # In PRODUCTION, attach the Google Cloud Logging handler.
        # This sends logs as structured JSON to Google Cloud.
        client = LoggerClient()
        handler = CloudLoggingHandler(client, name="creative-studio-main")
        root_logger.addHandler(handler)
    else:
        # In DEVELOPMENT, use a simple stream handler for readable console output.
        handler = logging.StreamHandler(sys.stderr)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)
