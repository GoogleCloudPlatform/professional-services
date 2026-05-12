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

"""
Deploy an ADK2 graph agent to GCP Agent Engine.
 
Usage
─────
    python main.py [<graph_yaml> [<display_name>]]
 
    graph_yaml    path to the YAML graph definition (default: sample_graph.yaml)
    display_name  Agent Engine display name          (default: from YAML metadata.name)
 
Environment variables (or .env file)
─────────────────────────────────────
    GOOGLE_CLOUD_PROJECT       GCP project ID          (default: otl-eng-avstudio)
    GOOGLE_CLOUD_LOCATION      Vertex AI region        (default: us-central1)
    GOOGLE_APPLICATION_CREDENTIALS  path to service-account key
    STAGING_BUCKET             GCS bucket for staging  (default: gs://adk2-graph-poc-staging)
    GRAPH_YAML_PATH            override YAML path from env
    AGENT_DISPLAY_NAME         override display name from env
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from vertexai import agent_engines

from agent.adk_agent import YamlAdkAgent
from agent.gcp_config import init_vertex_ai
from agent.graph_builder import load_yaml

load_dotenv()

_DEFAULT_YAML = os.getenv("GRAPH_YAML_PATH", "sample_graph.yaml")
_DEFAULT_BUCKET = os.getenv("STAGING_BUCKET", "gs://adk2-graph-bucket")
_DEFAULT_DISPLAY_NAME = os.getenv("AGENT_DISPLAY_NAME", "")


def deploy(
    yaml_path: str = _DEFAULT_YAML,
    staging_bucket: str = _DEFAULT_BUCKET,
    display_name: str = _DEFAULT_DISPLAY_NAME,
) -> str:
    """
    Build an ADK2 graph agent from *yaml_path* and deploy it to GCP Agent Engine.

    Returns the fully-qualified resource name of the deployed agent.
    """
    # ── Initialise Vertex AI ─────────────────────────────────────────────────
    gcp_config = init_vertex_ai(staging_bucket=staging_bucket)
    print(
        f"Vertex AI initialised – project={gcp_config['project']}  "
        f"location={gcp_config['location']}"
    )

    # ── Resolve YAML and read display name ───────────────────────────────────
    yaml_abs = str(Path(yaml_path).resolve())
    graph_dict = load_yaml(yaml_abs)
    # CLI / env display_name takes priority over the YAML metadata name
    display_name = display_name or graph_dict.get("metadata", {}).get(
        "name", "adk2-graph-agent"
    )

    print(f"Building ADK2 graph agent from: {yaml_abs}")

    # ── Read requirements ────────────────────────────────────────────────────
    req_path = Path(__file__).parent / "agent" / "requirements.txt"
    with open(req_path) as fh:
        requirements = [
            line.strip() for line in fh if line.strip() and not line.startswith("#")
        ]

    # ── Deploy to Agent Engine ───────────────────────────────────────────────
    # Must chdir to the project root so that extra_packages=["."] uploads the
    # whole directory (including agent/ and sample_graph.yaml) with relative
    # paths that the Linux container can import as  `import agent`.
    project_root = Path(__file__).parent
    os.chdir(project_root)

    print(f"Deploying '{display_name}' to GCP Agent Engine …")
    remote_agent = agent_engines.create(
        YamlAdkAgent(yaml_path=os.path.relpath(yaml_abs, project_root)),  # type: ignore[arg-type]
        requirements=requirements,
        extra_packages=["."],
        display_name=display_name,
    )

    print("Deployment successful!")
    print(f"Resource Name: {remote_agent.resource_name}")
    print(
        "\nTip: set AGENT_ENGINE_RESOURCE_NAME in the deployed environment "
        "to enable VertexAiSessionService (persistent sessions):\n"
        f"  export AGENT_ENGINE_RESOURCE_NAME={remote_agent.resource_name}"
    )
    return remote_agent.resource_name


if __name__ == "__main__":
    _yaml = sys.argv[1] if len(sys.argv) > 1 else _DEFAULT_YAML
    _name = sys.argv[2] if len(sys.argv) > 2 else _DEFAULT_DISPLAY_NAME
    deploy(_yaml, display_name=_name)
