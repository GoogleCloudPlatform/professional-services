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

"""Utility functions for Git operations, including repository cloning
and file structure generation.
"""

import hashlib
import logging
import os
import shutil
import tempfile
from typing import Optional

from git import Repo

logger = logging.getLogger(__name__)


def clone_repository(
    repo_url: str,
    pat_token: Optional[str] = None,
    subfolder: Optional[str] = None,
    branch: str = "master",
) -> str:
    """Clones the repository to a local temporary directory.
    Handles Branch, Shallow Clones, Caching, and Sparse Checkouts.

    Args:
        repo_url: The HTTPS URL of the git repo.
        pat_token: Optional GitHub Personal Access Token for private repos.
        subfolder: Optional if only a subfolder from the entire git repo needs to be cloned
        bracnh: Default Main; Branch to be cloned
    Returns:
        str: The local file system path where the repo was cloned.
    """
    # 1. Handle Authentication (Inject PAT if present)
    if pat_token:
        if "https://" in repo_url:
            clean_url = repo_url.replace("https://", "")
            auth_url = f"https://oauth2:{pat_token}@{clean_url}"
        else:
            # Handle edge cases or other protocols if necessary
            auth_url = repo_url
    else:
        auth_url = repo_url

    # 2. Define Local Path (Use a temp dir to avoid conflicts)

    # Use a hash of the URL so we get the SAME folder for the same repo.
    # This allows us to reuse the cache on subsequent runs.
    repo_hash = hashlib.md5(f"{repo_url}-{branch}".encode()).hexdigest()[:10]
    repo_name = os.path.basename(repo_url).replace(".git", "")

    if subfolder:
        repo_hash += f"-{hashlib.md5(subfolder.encode()).hexdigest()[:6]}"

    local_path = os.path.join(
        tempfile.gettempdir(), "slo-assistant-repos", f"{repo_name}-{repo_hash}"
    )

    # 3. Clean up previous clone if it exists (fresh start)
    if os.path.exists(local_path):
        try:
            repo = Repo(local_path)
            logger.info(
                "Cache hit for %s (Branch: %s). Pulling latest changes...",
                repo_name,
                branch,
            )
            repo.remotes.origin.pull(depth=1)
            return local_path
        except Exception as e:
            logger.warning("Cache corrupted (%s). Re-cloning...", e)
            try:
                shutil.rmtree(local_path)
            except Exception as del_err:
                logger.error("Failed to clear corrupted cache: %s", del_err)
                raise del_err

    # 4. Clone
    os.makedirs(local_path, exist_ok=True)
    try:
        if subfolder:
            logger.info(
                "Initializing Sparse Checkout for folder: %s on branch '%s'...",
                subfolder,
                branch,
            )
            # SPARSE CHECKOUT FLOW (

            repo = Repo.init(local_path)
            repo.create_remote("origin", auth_url)
            repo.git.config("core.sparseCheckout", "true")
            sparse_info_path = os.path.join(local_path, ".git", "info", "sparse-checkout")
            os.makedirs(os.path.dirname(sparse_info_path), exist_ok=True)
            with open(sparse_info_path, "w", encoding="utf-8") as f:
                f.write(subfolder + "\n")
            logger.info("Pulling shallow copy of %s...", subfolder)
            repo.git.pull("origin", branch, "--depth=1")

        else:
            # STANDARD OPTIMIZED FLOW (Shallow + Blobless)
            logger.info("Cloning %s (Branch: %s)...", repo_url, branch)
            Repo.clone_from(
                auth_url,
                local_path,
                branch=branch,
                depth=1,
                single_branch=True,
                filter="blob:none",
            )

        return local_path

    except Exception as e:
        logger.error("Clone failed: %s", e)
        # Clean up partial failure
        if os.path.exists(local_path):
            shutil.rmtree(local_path)
        raise e


def get_repo_file_structure(repo_path: str, max_depth: int = 3) -> str:
    """
    Generates a visual tree structure of the repo to help the LLM find files.
    Excludes hidden files and generic config folders to save context tokens.
    """
    tree_str = ""
    # Normalize path separator
    repo_path = os.path.normpath(repo_path)
    start_level = repo_path.count(os.sep)

    for root, dirs, files in os.walk(repo_path):
        level = root.count(os.sep) - start_level
        if level > max_depth:
            continue

        indent = " " * 4 * level
        basename = os.path.basename(root)

        # Skip hidden directories and common noise to keep prompt small
        if basename.startswith(".") or basename in [
            "node_modules",
            "venv",
            "__pycache__",
            "dist",
            "target",
            ".git",
        ]:
            dirs[:] = []  # Stop descending
            continue

        tree_str += f"{indent}{basename}/\n"
        sub_indent = " " * 4 * (level + 1)

        # Sort files for deterministic output (fixes the "random answer" bug)
        for f in sorted(files):
            # Skip hidden files and non-code assets
            if f.startswith(".") or f.endswith((".png", ".jpg", ".jpeg", ".pyc", ".exe", ".bin")):
                continue
            tree_str += f"{sub_indent}{f}\n"

    return tree_str
