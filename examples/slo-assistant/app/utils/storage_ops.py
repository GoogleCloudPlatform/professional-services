# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Utility functions for file system and Google Cloud Storage (GCS) operations.
"""

import os
import re
import logging
from typing import List
from urllib.parse import urlparse
from google.cloud import storage
from google.cloud.exceptions import Forbidden, NotFound
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BUCKET_NAME = os.getenv("GCP_BUCKET_NAME", "slo-assistant")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "slo-assistant")


def read_specific_files(root_dir: str, file_paths: List[str]) -> str:
    """Reads the content of specific files and concatenates them."""
    content = ""
    for file_path in file_paths:
        full_path = os.path.join(root_dir, file_path)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content += f"""--- FILE: {file_path} ---
{f.read()}

"""
    return content


def get_project_folder(repo_url):
    """
    Parses any Git URL (GitHub, GitLab, etc.) to generate a safe, unique folder name.
    """
    try:
        if repo_url.startswith("git@"):
            repo_url = repo_url.replace(":", "/")
            repo_url = repo_url.replace("git@", "https://")

        parsed = urlparse(repo_url)
        path = parsed.path
        if path.endswith(".git"):
            path = path[:-4]
        path = path.strip("/")
        folder_name = path.replace("/", "-")
        if not folder_name:
            raise ValueError("Parsed path is empty")
        clean_name = re.sub(r"[^a-zA-Z0-9\-]", "", folder_name)
        return clean_name.lower()
    except Exception as e:
        logging.error("Error parsing repo URL '%s': %s. Using 'unknown-project'.", repo_url, e)
        return "unknown-project"


def _ensure_bucket_exists(client, bucket_name):
    """
    Checks if bucket exists. If not, tries to create it.
    Returns the bucket object or raises error.
    """
    try:
        bucket = client.get_bucket(bucket_name)
        return bucket
    except NotFound:
        logging.info("Bucket '%s' not found. Attempting to create...", bucket_name)
        try:
            bucket = client.create_bucket(bucket_name, project=GCP_PROJECT_ID, location="US")
            logging.info("Created bucket: %s", bucket_name)
            return bucket
        except Forbidden:
            logging.error(
                "Error: Permission denied creating bucket '%s'. Please create it manually.",
                bucket_name,
            )
            raise
    except Exception as e:
        logging.error("Error accessing bucket: %s", e)
        raise


def upload_file(repo_url, folder_category, filename, content):
    """
    Uploads content to GCS.
    """
    try:
        client = storage.Client(project=GCP_PROJECT_ID)
        bucket = _ensure_bucket_exists(client, BUCKET_NAME)
        project_folder = get_project_folder(repo_url)
        blob_path = f"{project_folder}/{folder_category}/{filename}"
        blob = bucket.blob(blob_path)
        blob.upload_from_string(str(content))
        logging.info("Uploaded to GCS: gs://%s/%s", BUCKET_NAME, blob_path)
        return blob.public_url
    except Exception as e:
        logging.error("GCS Upload Failed for '%s': %s", filename, e)
        return None
