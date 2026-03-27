# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import json
import os
import contextvars
from datetime import datetime, timezone

# Context variables to hold contextual IDs
run_id_var = contextvars.ContextVar("run_id", default="no-run")
batch_id_var = contextvars.ContextVar("batch_id", default="")


class ContextFilter(logging.Filter):
    def filter(self, record):
        record.run_id = run_id_var.get()
        record.batch_id = batch_id_var.get()
        return True


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "name": record.name,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        if hasattr(record, "run_id") and record.run_id and record.run_id != "no-run":
            log_obj["run_id"] = record.run_id
        if hasattr(record, "batch_id") and record.batch_id:
            log_obj["batch_id"] = record.batch_id

        if record.exc_info:
            log_obj["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def set_run_id(run_id: str):
    run_id_var.set(run_id)


def set_batch_id(batch_id: str):
    batch_id_var.set(batch_id)


def setup_logging(run_id: str = None, batch_id: str = None):
    if run_id:
        set_run_id(run_id)
    if batch_id:
        set_batch_id(batch_id)

    # Avoid adding multiple handlers if setup_logging is called multiple times
    root_logger = logging.getLogger()
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Determine log level
    from computer_use_eval.config import settings

    log_level_str = os.getenv(
        "LOG_LEVEL", getattr(settings, "LOG_LEVEL", "INFO")
    ).upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    handler = logging.StreamHandler()

    if os.getenv("CI") == "true" or os.getenv("JSON_LOGS") == "true":
        formatter = JSONFormatter()
    else:
        # Standard formatter but with context
        log_format = getattr(
            settings,
            "LOG_FORMAT",
            "%(asctime)s - [%(run_id)s] - %(name)s - %(levelname)s - %(message)s",
        )
        # Ensure run_id is in the format if it's default
        if "%(run_id)s" not in log_format:
            log_format = f"%(asctime)s - [%(run_id)s] - {log_format.replace('%(asctime)s - ', '')}"
        formatter = logging.Formatter(log_format)

    handler.setFormatter(formatter)
    handler.addFilter(ContextFilter())
    root_logger.addHandler(handler)

    # Add FileHandler if RUN_DIR is set
    run_dir = os.environ.get("RUN_DIR")
    if run_dir:
        file_handler = logging.FileHandler(os.path.join(run_dir, "run.log"))
        file_handler.setFormatter(formatter)
        file_handler.addFilter(ContextFilter())
        root_logger.addHandler(file_handler)

    root_logger.setLevel(log_level)

    # Silence noisy third-party loggers
    noisy_loggers = [
        "httpx",
        "httpcore",
        "urllib3",
        "playwright",
        "google",
        "googleapiclient",
        "google.auth",
        "asyncio",
        "PIL",
    ]
    for logger_name in noisy_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
