import logging
import os
import subprocess
import yaml
from pathlib import Path

def get_module_path(service: str, module_name: str) -> Path:
    """
    Constructs the path to the corresponding SHA module definition file.
    """
    project_root = Path(__file__).parent.parent
    module_path = project_root / "samples" / "gcloud" / service / f"{module_name}.yaml"
    
    if not module_path.exists():
        raise FileNotFoundError(f"Module definition not found at '{module_path}'")
        
    return module_path

def run_gcloud_simulate(module_path: Path, asset_data_file: Path) -> dict:
    """
    Executes the `gcloud scc manage custom-modules sha simulate` command.
    """
    project_id = os.getenv("PROJECT_ID")
    command = [
        "gcloud",
        "scc",
        "manage",
        "custom-modules",
        "sha",
        "simulate",
        f"--custom-config-from-file={module_path}",
        f"--resource-from-file={asset_data_file}",
        "--format=yaml",
        f"--project={project_id}",
    ]
    
    try:
        logging.debug("Executing gcloud command: %s", " ".join(command))
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
        )
        
        output = yaml.safe_load(result.stdout)
        return output.get("result", {})
        
    except subprocess.CalledProcessError as e:
        error_message = (
            f"gcloud command failed with exit code {e.returncode}."
            f"Stderr: {e.stderr}"
            f"Stdout: {e.stdout}"
        )
        raise RuntimeError(error_message) from e
    except (yaml.YAMLError, AttributeError) as e:
        raise ValueError(f"Failed to parse gcloud YAML output: {e}") from e

def test_sha_module(service: str, module_name: str, asset_data_file: Path, expected_violation: dict):
    """
    Tests a specific SHA module scenario defined by a YAML test case.
    """
    module_path = get_module_path(service, module_name)

    simulation_result = run_gcloud_simulate(module_path, asset_data_file)
    logging.debug("Result from simulation: %s", simulation_result)

    if not expected_violation:
        # Expect no violation
        assert "noViolation" in simulation_result, f"Expected no violation, but got {simulation_result}"
    else:
        # Expect a violation with specific attributes
        assert "finding" in simulation_result, f"Expected a violation, but none was found. Result: {simulation_result}"
        finding = simulation_result["finding"]
        for key, value in expected_violation.items():
            assert finding.get(key) == value, f"Mismatch in finding attribute '{key}': expected '{value}', got '{finding.get(key)}'"