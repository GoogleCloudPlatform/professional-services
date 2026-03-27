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

import argparse
import logging
import sys

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def destroy_infra(project_id: str, location: str, engine_name: str) -> None:
    """
    Deletes all sandboxes and the Agent Engine itself.
    """
    try:
        import vertexai
    except ImportError:
        logger.error("Missing 'google-cloud-aiplatform' SDK.")
        sys.exit(1)

    try:
        # Initialize Vertex AI
        vertexai.init(project=project_id, location=location)
        client = vertexai.Client(project=project_id, location=location)

        # 1. List and Delete all Sandboxes
        logger.info(f"Checking for sandboxes under engine: {engine_name}")
        try:
            sandboxes = list(
                client.agent_engines.sandboxes.list(name=engine_name))
            if not sandboxes:
                logger.info("No sandboxes found.")
            for sb in sandboxes:
                logger.info(f"Deleting Sandbox: {sb.name}...")
                client.agent_engines.sandboxes.delete(name=sb.name)
        except Exception as e:
            logger.warning(f"Error while listing/deleting sandboxes: {e}")

        # 2. Delete Agent Engine
        logger.info(f"Deleting Agent Engine: {engine_name}...")
        # SDK should handle child deletion if we set force=True, but we try manual first
        try:
            client.agent_engines.delete(name=engine_name)
        except Exception as delete_err:
            logger.warning(f"Deletion failed, trying with force: {delete_err}")
            # The SDK might not expose force directly in the high-level method,
            # so we let the user know if manual cleanup is needed.
            logger.error(
                "Please delete the sandboxes manually in the console if this persists."
            )
            raise delete_err

        logger.info("✅ Infrastructure destruction complete.")

    except Exception as e:
        logger.error(f"Failed to destroy infrastructure: {e}")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Destruction Utility for Agent Engine Sandbox Infrastructure"
    )
    parser.add_argument("--project", help="GCP Project ID", required=True)
    parser.add_argument("--location",
                        help="GCP Location (Region)",
                        default="us-central1")
    parser.add_argument("--engine",
                        help="Full Agent Engine Resource Name to delete",
                        required=True)

    args = parser.parse_args()

    logger.info(
        f"--- Starting Infrastructure Destruction for Engine: {args.engine} ---"
    )
    destroy_infra(args.project, args.location, args.engine)


if __name__ == "__main__":
    main()
