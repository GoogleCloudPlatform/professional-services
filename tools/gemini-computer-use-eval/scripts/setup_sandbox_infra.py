# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import argparse
import logging
import subprocess
import sys
from typing import Optional

try:
    from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
except ImportError:
    print("Missing 'tenacity' library. Please run 'uv sync' first.")
    sys.exit(1)

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class InfraSetupError(Exception):
    """Custom exception for infrastructure setup failures."""

    pass


def run_gcloud_command(cmd: list[str], check: bool = True) -> Optional[str]:
    """
    Executes a gcloud command safely without shell=True.

    Args:
        cmd: List of command arguments.
        check: Whether to raise an exception on non-zero exit code.

    Returns:
        The stripped stdout string if successful, or None if check is False and command failed.

    Raises:
        InfraSetupError: If the command fails and check is True.
    """
    try:
        # Always run non-interactively
        full_cmd = ["gcloud"] + cmd + ["--quiet"]
        logger.debug(f"Executing: {' '.join(full_cmd)}")

        result = subprocess.run(
            full_cmd,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        if check:
            error_msg = e.stderr.strip() if e.stderr else "Unknown error"
            logger.error(
                f"Command failed: {' '.join(full_cmd)}\nError: {error_msg}")
            raise InfraSetupError(f"gcloud command failed: {error_msg}")
        return None
    except FileNotFoundError:
        logger.error("gcloud CLI not found. Please install Google Cloud SDK.")
        raise InfraSetupError("gcloud CLI not found.")


def check_gcloud_auth() -> None:
    """Verifies that the user has an active gcloud session."""
    logger.info("Checking gcloud authentication...")
    try:
        run_gcloud_command(["auth", "print-access-token"])
    except InfraSetupError:
        logger.error(
            "You are not authenticated with gcloud. "
            "Please run 'gcloud auth login' and 'gcloud auth application-default login' first."
        )
        raise InfraSetupError("Missing gcloud authentication.")


def enable_apis(project_id: str) -> None:
    """Idempotently enables required GCP APIs."""
    logger.info("Verifying required APIs...")
    required_apis = [
        "aiplatform.googleapis.com", "iamcredentials.googleapis.com"
    ]

    # Check currently enabled APIs
    enabled_apis_output = run_gcloud_command([
        "services", "list", f"--project={project_id}",
        "--format=value(config.name)"
    ])
    enabled_apis = enabled_apis_output.split() if enabled_apis_output else []

    apis_to_enable = [api for api in required_apis if api not in enabled_apis]

    if apis_to_enable:
        logger.info(f"Enabling APIs: {', '.join(apis_to_enable)}...")
        run_gcloud_command(
            ["services", "enable", *apis_to_enable, f"--project={project_id}"])
    else:
        logger.info("All required APIs are already enabled.")


def ensure_service_account(project_id: str, sa_name: str,
                           sa_email: str) -> None:
    """Idempotently creates the service account."""
    logger.info(f"Checking Service Account: {sa_email}")

    # Check if exists
    exists = run_gcloud_command(
        [
            "iam", "service-accounts", "describe", sa_email,
            f"--project={project_id}"
        ],
        check=False,
    )

    if not exists:
        logger.info(f"Creating new Service Account: {sa_name}")
        run_gcloud_command([
            "iam",
            "service-accounts",
            "create",
            sa_name,
            "--display-name",
            "Gemini Sandbox Runner",
            f"--project={project_id}",
        ])
    else:
        logger.info("Service Account already exists.")


@retry(
    stop=stop_after_attempt(5),
    wait=wait_fixed(5),
    retry=retry_if_exception_type(InfraSetupError),
    reraise=True,
)
def grant_iam_roles(project_id: str, sa_email: str) -> None:
    """Idempotently grants required IAM roles."""
    role = "roles/iam.serviceAccountTokenCreator"

    # 1. Project-level grant
    logger.info(f"Ensuring project-level IAM role binding: {role}")
    run_gcloud_command([
        "projects",
        "add-iam-policy-binding",
        project_id,
        f"--member=serviceAccount:{sa_email}",
        f"--role={role}",
        "--condition=None",
    ])

    # 2. Resource-level grant (Self-impersonation)
    logger.info(f"Ensuring resource-level self-impersonation for: {sa_email}")
    run_gcloud_command([
        "iam",
        "service-accounts",
        "add-iam-policy-binding",
        sa_email,
        f"--member=serviceAccount:{sa_email}",
        f"--role={role}",
        f"--project={project_id}",
    ])

    # 3. Grant to current user (to allow token generation from CLI)
    current_user = run_gcloud_command(["config", "get-value", "account"])
    if current_user:
        logger.info(f"Granting {role} to current gcloud user: {current_user}")
        run_gcloud_command([
            "iam",
            "service-accounts",
            "add-iam-policy-binding",
            sa_email,
            f"--member=user:{current_user}",
            f"--role={role}",
            f"--project={project_id}",
        ])
    else:
        logger.warning(
            "Could not determine current gcloud user to grant Token Creator role."
        )


@retry(
    stop=stop_after_attempt(5),
    wait=wait_fixed(5),
    retry=retry_if_exception_type(InfraSetupError),
    reraise=True,
)
def provision_infra(
    project_id: str,
    location: str,
    engine_name: Optional[str] = None,
    engine_display_name: str = "eval-runner-agent-engine",
    sandbox_display_name: str = "eval-runner-warm-sandbox",
) -> tuple[str, str]:
    """
    Provisions or reuses an Agent Engine and a Sandbox environment.
    """
    try:
        import vertexai
        from vertexai import types
        import importlib.metadata
        from packaging import version

        sdk_version = importlib.metadata.version("google-cloud-aiplatform")
        if version.parse(sdk_version) < version.parse("1.134.0"):
            logger.error(
                f"Your google-cloud-aiplatform SDK is outdated (v{sdk_version}). "
                "Version >=1.134.0 is required for Agent Engine sandboxes. "
                "Please upgrade using: uv pip install 'google-cloud-aiplatform[agent_engines]>=1.134.0'"
            )
            raise InfraSetupError("Outdated dependencies.")
    except ImportError:
        logger.error(
            "Missing 'google-cloud-aiplatform' or 'packaging' SDK. "
            "Please run this script inside the project's virtual environment using `uv run python scripts/setup_sandbox_infra.py`."
        )
        raise InfraSetupError("Missing dependencies.")

    try:
        # Initialize Vertex AI
        vertexai.init(project=project_id, location=location)
        client = vertexai.Client(project=project_id, location=location)

        # 1. Resolve Engine
        if engine_name:
            logger.info(f"Reusing existing Agent Engine: {engine_name}")
        else:
            logger.info(
                f"Provisioning new long-lived Agent Engine: {engine_display_name}..."
            )
            engine = client.agent_engines.create(config=types.AgentEngineConfig(
                display_name=engine_display_name))
            engine_name = engine.api_resource.name
            logger.info(f"Successfully provisioned Agent Engine: {engine_name}")

        # 2. Resolve Sandbox Environment
        sandbox_name = None
        try:
            existing_sandboxes = list(
                client.agent_engines.sandboxes.list(name=engine_name))
            for sb in existing_sandboxes:
                if "RUNNING" in str(sb.state):
                    logger.info(f"Reusing existing running Sandbox: {sb.name}")
                    sandbox_name = sb.name
                    break
        except Exception as list_err:
            logger.warning(f"Failed to list existing sandboxes: {list_err}")

        if not sandbox_name:
            logger.info(
                f"Provisioning persistent Sandbox environment: {sandbox_display_name}..."
            )
            operation = client.agent_engines.sandboxes.create(
                spec={"computer_use_environment": {}},
                name=engine_name,
                config=types.CreateAgentEngineSandboxConfig(
                    display_name=sandbox_display_name),
            )
            sandbox_name = operation.response.name
            logger.info(f"Successfully provisioned Sandbox: {sandbox_name}")

        return engine_name, sandbox_name
    except Exception as e:
        logger.error(
            f"Failed to provision infrastructure via Vertex AI SDK: {e}")
        raise InfraSetupError(str(e))


def sync_dependencies() -> None:
    """Attempts to run 'uv sync' to ensure the environment is up-to-date."""
    logger.info("Synchronizing dependencies via 'uv sync'...")
    try:
        # Check if 'uv' is available
        subprocess.run(["uv", "--version"], check=True, capture_output=True)
        # Execute sync
        subprocess.run(["uv", "sync", "--quiet"], check=True)
        logger.info("Dependency synchronization successful.")
    except subprocess.CalledProcessError as e:
        logger.warning(f"Failed to synchronize dependencies via 'uv': {e}")
    except FileNotFoundError:
        logger.debug("'uv' command not found, skipping automatic sync.")


def main() -> None:
    # Ensure dependencies are synchronized
    sync_dependencies()

    parser = argparse.ArgumentParser(
        description=
        "Idempotent Setup Utility for Agent Engine Sandbox Infrastructure")
    parser.add_argument("--project", help="GCP Project ID", required=True)
    parser.add_argument("--location",
                        help="GCP Location (Region)",
                        default="us-central1")
    parser.add_argument(
        "--service-account",
        help="Service Account Name (without domain)",
        default="gemini-sandbox-runner",
    )
    parser.add_argument(
        "--engine",
        help="Optional: Use an existing Agent Engine resource name",
        default=None,
    )
    parser.add_argument(
        "--engine-display-name",
        help="Display name for the newly created Agent Engine",
        default="eval-runner-agent-engine",
    )
    parser.add_argument(
        "--sandbox-display-name",
        help="Display name for the newly created Sandbox",
        default="eval-runner-warm-sandbox",
    )

    args = parser.parse_args()

    project_id = args.project
    location = args.location
    sa_name = args.service_account
    sa_email = f"{sa_name}@{project_id}.iam.gserviceaccount.com"

    logger.info(
        f"--- Starting Infrastructure Provisioning for Project: {project_id} ---"
    )

    try:
        check_gcloud_auth()
        enable_apis(project_id)
        ensure_service_account(project_id, sa_name, sa_email)
        grant_iam_roles(project_id, sa_email)
        engine_name, sandbox_name = provision_infra(
            project_id,
            location,
            args.engine,
            args.engine_display_name,
            args.sandbox_display_name,
        )

        logger.info(
            "\n========================================================")
        logger.info("✅ INFRASTRUCTURE SETUP COMPLETE")
        logger.info("========================================================")
        logger.info(
            "Please add the following configuration to your project's '.env' file:\n"
        )

        print("GCP_USE_SANDBOX=true")
        print(f"GCP_SANDBOX_PROJECT_ID={project_id}")
        print(f"GCP_SANDBOX_LOCATION={location}")
        print(f"GCP_SANDBOX_SERVICE_ACCOUNT={sa_email}")
        print(f"GCP_SANDBOX_AGENT_ENGINE_NAME={engine_name}")

        logger.info(f"\nA warm sandbox has been created: {sandbox_name}")
        logger.info(
            "The evaluation runner will automatically detect and reuse this sandbox."
        )
        logger.info("========================================================")

    except InfraSetupError as e:
        logger.error(f"Setup aborted due to error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"Unexpected system error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
