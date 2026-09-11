"""
Deploy an ADK2 graph agent to GCP Agent Engine.

This is the enhanced version with error handling, validation, and proper
configuration management.

Usage
─────
    python main.py [<graph_yaml> [<display_name>]]

    graph_yaml    path to the YAML graph definition (default: agent/sample_graph.yaml)
    display_name  Agent Engine display name          (default: from YAML metadata.name)

Environment variables (or .env file)
─────────────────────────────────────
    GOOGLE_CLOUD_PROJECT       GCP project ID (REQUIRED)
    GOOGLE_CLOUD_LOCATION      Vertex AI region (default: us-central1)
    STAGING_BUCKET             GCS bucket for staging (REQUIRED)
    GOOGLE_APPLICATION_CREDENTIALS  path to service-account key (optional)

Examples
────────
    python main.py agent/sample_graph.yaml
    python main.py my_agent.yaml MyAgentName
    
    # With environment variables
    export GOOGLE_CLOUD_PROJECT=my-project-id
    export STAGING_BUCKET=gs://my-project-adk2-staging
    python main.py agent/sample_graph.yaml
"""

import logging
import os
import sys
from pathlib import Path
from dataclasses import dataclass

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import after logging setup
from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).resolve().parent
for env_path in [project_root / ".env", project_root / "agent" / ".env"]:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)

# Import GCP/ADK modules after env setup
try:
    from vertexai import agent_engines
    import yaml
except ImportError as e:
    logger.error(
        "Required package not found: %s\n"
        "Install dependencies with:\n"
        "  pip install -r agent/requirements.txt",
        e
    )
    sys.exit(1)

from agent.graph_builder import load_yaml
from agent.adk_agent import YamlAdkAgent


# ──────────────────────────────────────────────────────────────────────────────
# Configuration Management
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class DeploymentConfig:
    """Validated deployment configuration."""
    
    project_id: str
    location: str
    staging_bucket: str
    credentials_path: str | None = None
    
    @staticmethod
    def from_env() -> "DeploymentConfig":
        """Load and validate configuration from environment variables."""
        
        # Required: Project ID
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
        if not project_id:
            raise ValueError(
                "\n❌ GOOGLE_CLOUD_PROJECT environment variable is required\n\n"
                "Set it in one of these ways:\n"
                "  1. .env file: echo 'GOOGLE_CLOUD_PROJECT=my-project-id' >> agent/.env\n"
                "  2. Shell environment: export GOOGLE_CLOUD_PROJECT=my-project-id\n"
                "  3. Find your project ID at: https://console.cloud.google.com\n"
            )
        
        # Required: Staging bucket
        staging_bucket = os.getenv("STAGING_BUCKET", "").strip()
        if not staging_bucket:
            raise ValueError(
                "\n❌ STAGING_BUCKET environment variable is required\n\n"
                "Set it in one of these ways:\n"
                "  1. .env file: echo 'STAGING_BUCKET=gs://my-project-adk2-staging' >> agent/.env\n"
                "  2. Shell environment: export STAGING_BUCKET=gs://my-project-adk2-staging\n"
                "  3. Create a bucket first:\n"
                "     gsutil mb -p {project_id} -l us-central1 gs://{project_id}-adk2-staging\n"
            )
        
        # Optional: Location
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1").strip()
        
        # Optional: Service account credentials
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
        if credentials_path:
            credentials_path = str(Path(credentials_path).resolve())
            if not Path(credentials_path).exists():
                raise FileNotFoundError(
                    f"\n❌ Service account key not found: {credentials_path}\n\n"
                    "Either:\n"
                    "  1. Place your service-account-key.json in the project root\n"
                    "  2. Or use Application Default Credentials:\n"
                    "     gcloud auth application-default login\n"
                )
        
        return DeploymentConfig(
            project_id=project_id,
            location=location,
            staging_bucket=staging_bucket,
            credentials_path=credentials_path or None,
        )
    
    def validate_and_init_vertex_ai(self) -> dict:
        """
        Validate GCP setup and initialize Vertex AI.
        
        Returns
        -------
        dict
            Configuration dict with project, location, credentials_path
            
        Raises
        ------
        ValueError
            If GCP setup is invalid
        """
        from agent.gcp_config import init_vertex_ai
        
        try:
            # Initialize Vertex AI
            gcp_config = init_vertex_ai(staging_bucket=self.staging_bucket)
            
            # Verify initialization
            if gcp_config["project"] != self.project_id:
                logger.warning(
                    "Authenticated project (%s) differs from GOOGLE_CLOUD_PROJECT (%s)",
                    gcp_config["project"],
                    self.project_id,
                )
            
            return gcp_config
            
        except Exception as e:
            raise ValueError(
                f"\n❌ Vertex AI initialization failed: {e}\n\n"
                "Troubleshooting:\n"
                "  1. Verify GOOGLE_CLOUD_PROJECT is correct\n"
                "  2. Check authentication: gcloud auth list\n"
                "  3. Enable Vertex AI API: gcloud services enable aiplatform.googleapis.com\n"
            )


# ──────────────────────────────────────────────────────────────────────────────
# Deployment
# ──────────────────────────────────────────────────────────────────────────────

def validate_yaml_file(yaml_path: str) -> dict:
    """
    Validate that YAML file exists and has correct schema.
    
    Parameters
    ----------
    yaml_path : str
        Path to YAML file
        
    Returns
    -------
    dict
        Parsed YAML content
        
    Raises
    ------
    FileNotFoundError
        If file doesn't exist
    ValueError
        If YAML schema is invalid
    """
    yaml_abs = str(Path(yaml_path).resolve())
    
    # Check file exists
    if not Path(yaml_abs).exists():
        raise FileNotFoundError(
            f"\n❌ YAML file not found: {yaml_abs}\n\n"
            "Troubleshooting:\n"
            "  1. Check file path is correct\n"
            "  2. Use absolute or relative path from project root\n"
            "  3. Example: python main.py agent/sample_graph.yaml\n"
        )
    
    # Parse YAML
    try:
        with open(yaml_abs, 'r', encoding='utf-8') as f:
            graph_dict = yaml.safe_load(f)
    except yaml.YAMLError as e:
        raise ValueError(
            f"\n❌ Invalid YAML syntax: {e}\n\n"
            f"File: {yaml_abs}\n"
            f"Check YAML formatting (indentation, quotes, etc)\n"
        )
    
    # Validate schema
    required_keys = ["version", "kind", "metadata", "spec", "workflow"]
    missing_keys = [k for k in required_keys if k not in graph_dict]
    
    if missing_keys:
        raise ValueError(
            f"\n❌ Invalid YAML schema. Missing keys: {missing_keys}\n\n"
            "Required top-level keys:\n"
            "  - version: '1.0'\n"
            "  - kind: Agent\n"
            "  - metadata: {...}\n"
            "  - spec: {...}\n"
            "  - workflow: {...}\n\n"
            "See agent/sample_graph.yaml for template\n"
        )
    
    # Validate nested required keys
    metadata = graph_dict.get("metadata", {})
    if not metadata.get("name"):
        raise ValueError(
            "\n❌ YAML validation error: metadata.name is required\n"
        )
    
    workflow = graph_dict.get("workflow", {})
    if not workflow.get("nodes"):
        raise ValueError(
            "\n❌ YAML validation error: workflow.nodes is required\n"
        )
    
    return graph_dict


def deploy(
    yaml_path: str = "agent/sample_graph.yaml",
    staging_bucket: str | None = None,
    display_name: str = "",
) -> str:
    """
    Build an ADK2 graph agent from YAML and deploy to GCP Agent Engine.
    
    Parameters
    ----------
    yaml_path : str
        Path to YAML graph definition
    staging_bucket : str, optional
        GCS bucket for staging (overrides environment variable)
    display_name : str, optional
        Display name in Agent Engine (overrides YAML metadata.name)
    
    Returns
    -------
    str
        Fully-qualified resource name of deployed agent
        
    Raises
    ------
    ValueError
        If configuration or validation fails
    FileNotFoundError
        If YAML file not found
    """
    
    # ── Step 1: Validate Configuration ───────────────────────────────────────
    print("\n" + "="*70)
    print("ADK2 Graph Agent Deployment")
    print("="*70)
    
    print("\n[1/6] Validating configuration...")
    try:
        config = DeploymentConfig.from_env()
        print(f"      ✓ Configuration valid")
        print(f"        Project: {config.project_id}")
        print(f"        Location: {config.location}")
        print(f"        Staging bucket: {config.staging_bucket}")
    except (ValueError, FileNotFoundError) as e:
        print(f"      ✗ Configuration error:")
        print(f"        {e}")
        sys.exit(1)
    
    # ── Step 2: Initialize Vertex AI ─────────────────────────────────────────
    print("\n[2/6] Initializing Vertex AI...")
    try:
        bucket = staging_bucket or config.staging_bucket
        gcp_config = config.validate_and_init_vertex_ai()
        print(f"      ✓ Vertex AI initialized")
        print(f"        Project: {gcp_config['project']}")
        print(f"        Location: {gcp_config['location']}")
    except ValueError as e:
        print(f"      ✗ Initialization error:")
        print(f"        {e}")
        sys.exit(1)
    
    # ── Step 3: Load and Validate YAML ───────────────────────────────────────
    print(f"\n[3/6] Loading YAML configuration...")
    try:
        graph_dict = validate_yaml_file(yaml_path)
        print(f"      ✓ YAML validated")
    except (FileNotFoundError, ValueError) as e:
        print(f"      ✗ YAML error:")
        print(f"        {e}")
        sys.exit(1)
    
    # ── Step 4: Determine Agent Display Name ─────────────────────────────────
    print(f"\n[4/6] Preparing deployment metadata...")
    final_display_name = (
        display_name
        or graph_dict.get("metadata", {}).get("name", "adk2-graph-agent")
    )
    print(f"      ✓ Agent name: {final_display_name}")
    print(f"        Description: {graph_dict.get('metadata', {}).get('description', '(none)')}")
    
    # ── Step 5: Read and Validate Requirements ───────────────────────────────
    print(f"\n[5/6] Building deployment package...")
    try:
        req_path = Path(__file__).parent / "agent" / "requirements.txt"
        with open(req_path, 'r') as fh:
            requirements = [
                line.strip()
                for line in fh
                if line.strip() and not line.startswith("#")
            ]
        print(f"      ✓ Dependencies loaded ({len(requirements)} packages)")
    except FileNotFoundError:
        print(f"      ✗ requirements.txt not found")
        sys.exit(1)
    
    # ── Step 6: Deploy to Agent Engine ───────────────────────────────────────
    print(f"\n[6/6] Deploying to GCP Agent Engine...")
    
    project_root = Path(__file__).parent
    os.chdir(project_root)
    
    try:
        yaml_relpath = os.path.relpath(
            Path(yaml_path).resolve(),
            project_root
        )
        
        remote_agent = agent_engines.create(
            YamlAdkAgent(yaml_path=yaml_relpath),
            requirements=requirements,
            extra_packages=["."],
            display_name=final_display_name,
        )
        
    except Exception as e:
        print(f"      ✗ Deployment failed:")
        print(f"        {e}")
        sys.exit(1)
    
    # ── Success ──────────────────────────────────────────────────────────────
    print("      ✓ Agent deployed successfully!")
    print("\n" + "="*70)
    print("✓ DEPLOYMENT COMPLETE")
    print("="*70)
    print(f"\nResource Name: {remote_agent.resource_name}")
    
    print("\nNext Steps:")
    print("-" * 70)
    print("\n1. Enable persistent sessions (recommended):")
    print(f"   export AGENT_ENGINE_RESOURCE_NAME={remote_agent.resource_name}")
    
    print("\n2. View deployment logs:")
    print("   gcloud logging read 'resource.type=cloud_run_revision' --limit 50")
    
    print("\n3. Query the deployed agent:")
    print("   python -c \"from agent.adk_agent import YamlAdkAgent")
    print("               agent = YamlAdkAgent(); agent.set_up()\"")
    
    print("\n4. Documentation:")
    print("   - Troubleshooting: See TROUBLESHOOTING.md")
    print("   - API Reference: See agent/adk_agent.py")
    
    print("\n" + "="*70 + "\n")
    
    return remote_agent.resource_name


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    
    # Parse command-line arguments
    yaml_file = "agent/sample_graph.yaml"
    agent_name = ""
    
    if len(sys.argv) > 1:
        yaml_file = sys.argv[1]
    
    if len(sys.argv) > 2:
        agent_name = sys.argv[2]
    
    # Show help if requested
    if yaml_file in ["-h", "--help"]:
        print(__doc__)
        sys.exit(0)
    
    # Deploy
    try:
        resource_name = deploy(yaml_file, display_name=agent_name)
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n\nDeployment cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error("Unexpected error: %s", e, exc_info=True)
        sys.exit(1)
