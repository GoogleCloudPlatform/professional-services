import logging
import pytest
import os
import yaml
from pathlib import Path

TEST_CASES_DIR = os.path.join(os.path.dirname(__file__), "test_cases")

def pytest_sessionstart(session):
    """Check for essential setup before starting the session."""
    if not os.path.isdir(TEST_CASES_DIR):
        pytest.exit(f"Test case directory not found: {TEST_CASES_DIR}", returncode=1)

    if not os.getenv("PROJECT_ID"):
        pytest.exit(
            "Environment variable 'PROJECT_ID' is not set. It is required for test execution.",
            returncode=1,
        )
    logging.info(
        "Initial checks passed. PROJECT_ID=%s",
        os.getenv("PROJECT_ID"),
    )


def pytest_generate_tests(metafunc):
    """
    Dynamically generates tests based on YAML files found in the test_cases directory.
    """
    if "service" in metafunc.fixturenames and "module_name" in metafunc.fixturenames and "asset_data_file" in metafunc.fixturenames and "expected_violation" in metafunc.fixturenames:
        test_cases_dir = Path(__file__).parent / "test_cases"
        if not test_cases_dir.is_dir():
            metafunc.parametrize("service,module_name,asset_data_file,expected_violation", [])
            return

        all_yaml_files = test_cases_dir.rglob("*.yaml")
        
        params = []
        ids = []

        for test_file in all_yaml_files:
            with open(test_file, 'r') as f:
                data = yaml.safe_load(f)

            if not isinstance(data, dict) or "shared_config" not in data:
                continue # Not a test definition file

            shared_config = data.get("shared_config", {})
            module_name = shared_config.get("name")
            default_markers_names = shared_config.get("default_markers", [])
            
            try:
                service = test_file.relative_to(test_cases_dir).parts[0]
            except IndexError:
                continue

            # Create a list of marker objects
            default_markers = [getattr(pytest.mark, marker) for marker in default_markers_names]

            for test_name, test_config in data.items():
                if test_name == "shared_config":
                    continue

                logging.debug("Running %s", test_name)
                if not isinstance(test_config, dict):
                    continue

                asset_data_name = test_config.get("asset_data")
                if not asset_data_name:
                    continue

                if not asset_data_name.endswith(".yaml"):
                    asset_data_name += ".yaml"

                # Construct the path to the asset data file
                asset_data_file = test_file.parent / asset_data_name

                expected_violation = test_config.get("expected_violation", {})

                test_id = f"{module_name}-{test_name}"
                params.append(pytest.param(service, module_name, asset_data_file, expected_violation, marks=default_markers))
                ids.append(test_id)

        metafunc.parametrize("service,module_name,asset_data_file,expected_violation", params, ids=ids)
