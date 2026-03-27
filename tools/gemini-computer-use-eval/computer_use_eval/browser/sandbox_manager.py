# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import time
from typing import Tuple, Dict
from google.cloud import aiplatform

from computer_use_eval.config import settings


class SandboxManager:
    """
    Manages the lifecycle of a Computer Use Sandbox (Agent Engine).
    Uses the official Vertex AI SDK for JWT generation and CDP connection.
    """

    def __init__(self, project_id: str, location: str):
        self.project_id = project_id
        self.location = location
        self.logger = logging.getLogger(__name__)

        # Initialize Vertex AI
        aiplatform.init(project=project_id, location=location)

        # Client reference for teardown
        self.client = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, _exc_type, _exc_val, _exc_tb):
        await self.teardown()

    async def teardown(self):
        """
        Deletes the sandbox and agent engine if they were created ephemeral.
        """
        import asyncio

        if (hasattr(self, "sandbox_name") and self.client and
                getattr(self, "_created_sandbox", False)):
            try:
                self.logger.info(
                    f"Deleting ephemeral Sandbox {self.sandbox_name}...")
                start_time = time.time()
                await asyncio.to_thread(
                    self.client.agent_engines.sandboxes.delete,
                    name=self.sandbox_name)
                self.logger.info(
                    f"Sandbox deleted in {time.time() - start_time:.3f}s")
            except Exception as e:
                self.logger.warning(f"Failed to delete sandbox: {e}")

        if (hasattr(self, "agent_engine_name") and self.client and
                getattr(self, "_created_engine", False)):
            try:
                self.logger.info(
                    f"Deleting ephemeral Agent Engine {self.agent_engine_name}..."
                )
                start_time = time.time()
                await asyncio.to_thread(self.client.agent_engines.delete,
                                        name=self.agent_engine_name)
                self.logger.info(
                    f"Agent Engine deleted in {time.time() - start_time:.3f}s")
            except Exception as e:
                self.logger.warning(f"Failed to delete agent engine: {e}")

    def setup_session(self, session_id: str) -> Tuple[str, Dict[str, str]]:
        """
        Ensures a sandbox exists and returns the WebSocket URL and Headers.
        """
        try:
            import vertexai
            import time

            total_start = time.time()

            client = vertexai.Client(project=self.project_id,
                                     location=self.location)

            # 1. Resolve Agent Engine
            self.agent_engine_name = settings.SANDBOX_AGENT_ENGINE_NAME
            self._created_engine = False

            if not self.agent_engine_name:
                self.logger.info(
                    f"Creating ephemeral Agent Engine for session {session_id}..."
                )
                engine_start = time.time()
                agent_engine = client.agent_engines.create()
                self.agent_engine_name = agent_engine.api_resource.name
                self._created_engine = True
                self.logger.info(
                    f"Agent Engine created in {time.time() - engine_start:.3f}s"
                )
            else:
                self.logger.info(
                    f"Using existing Agent Engine: {self.agent_engine_name}")

            # 2. Resolve Sandbox (Reuse or Create)
            self._created_sandbox = False
            self.sandbox_name = None

            try:
                existing_sandboxes = list(
                    client.agent_engines.sandboxes.list(
                        name=self.agent_engine_name))
                for sb in existing_sandboxes:
                    if str(sb.state) == "STATE_RUNNING" or "RUNNING" in str(
                            sb.state):
                        self.logger.info(
                            f"Reusing existing running Sandbox: {sb.name}")
                        self.sandbox_name = sb.name
                        break
            except Exception as list_err:
                self.logger.warning(
                    f"Failed to list existing sandboxes: {list_err}")

            if not self.sandbox_name:
                self.logger.info("Creating fresh Sandbox...")
                sandbox_start = time.time()
                operation = client.agent_engines.sandboxes.create(
                    spec={"computer_use_environment": {}},
                    name=self.agent_engine_name,
                    config=None,
                )
                self.sandbox_name = operation.response.name
                self._created_sandbox = True
                self.logger.info(
                    f"Sandbox created in {time.time() - sandbox_start:.3f}s")

            # 3. Get Credentials via Official SDK
            self.logger.info("Generating CDP Auth Headers via SDK...")
            auth_start = time.time()

            # Fetch fresh resource info
            sandbox_resource = client.agent_engines.sandboxes.get(
                name=self.sandbox_name)

            service_account = settings.SANDBOX_SERVICE_ACCOUNT
            if not service_account:
                raise ValueError(
                    "SANDBOX_SERVICE_ACCOUNT must be set for sandbox mode.")

            if not hasattr(client.agent_engines.sandboxes,
                           "generate_browser_ws_headers"):
                import importlib.metadata

                try:
                    sdk_version = importlib.metadata.version(
                        "google-cloud-aiplatform")
                except Exception:
                    sdk_version = "unknown"
                raise RuntimeError(
                    f"Your google-cloud-aiplatform SDK is outdated (v{sdk_version}). "
                    "The agent_engines.sandboxes module requires version >=1.134.0. "
                    "Please upgrade using: uv pip install 'google-cloud-aiplatform[agent_engines]>=1.134.0'"
                )

            # Official SDK method: Handles JWT claims and internal port mapping automatically
            ws_url, headers = (
                client.agent_engines.sandboxes.generate_browser_ws_headers(
                    sandbox_environment=sandbox_resource,
                    service_account_email=service_account,
                ))

            # 4. Generate VNC Debug Token (Optional but very helpful for UI debugging)
            try:
                vnc_token = client.agent_engines.sandboxes.generate_access_token(
                    service_account_email=service_account,
                    sandbox_id=self.sandbox_name,
                    port="5091",
                    timeout=3600,
                )
                lb_ip = (
                    sandbox_resource.connection_info.load_balancer_ip or
                    sandbox_resource.connection_info.load_balancer_hostname)
                self.logger.info("--- SANDBOX LIVE VIEW ---")
                self.logger.info(
                    f"VNC URL: http://{lb_ip}:5091/?token={vnc_token}")
                self.logger.info("-------------------------")
            except Exception as vnc_err:
                self.logger.warning(
                    f"Failed to generate VNC debug token: {vnc_err}")

            self.logger.info(
                f"Auth headers generated in {time.time() - auth_start:.3f}s")

            self.client = client  # Keep reference for teardown
            self.logger.info(
                f"Total Sandbox setup completed in {time.time() - total_start:.3f}s"
            )
            return ws_url, headers

        except Exception as e:
            self.logger.error(f"Failed to setup sandbox session: {e}",
                              exc_info=True)
            raise e
