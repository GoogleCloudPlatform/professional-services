# -*- coding: utf-8 -*-
# Copyright 2024 Google LLC
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
import os
from datetime import datetime
from pathlib import Path
from loguru import logger

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
LOG_DIR = os.path.join(PROJECT_ROOT, 'logs')


def configure_logging():
    """
    Configures Loguru logging with timestamped migration logs and
    automatic log directory creation.
    """

    log_dir = Path(LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)

    # Main log file
    logger.add(
        os.path.join(LOG_DIR, "app.log"),
        level="DEBUG",
        retention="30 days",
        backtrace=True,
        diagnose=True
    )

    # Per-run log file with timestamp
    def get_timestamped_log_filename():
        return f"migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    # Per-run log file with timestamp
    logger.add(os.path.join(LOG_DIR, get_timestamped_log_filename()),
               level="DEBUG"
               )
    logger.level("REQUEST_TIME", no=35, color="<yellow>")  # Custom log level for request timing
