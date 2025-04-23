import logging
import os
import yaml
import pytest
from main import run_gcloud_command

TEST_CASES_DIR = os.path.join(os.path.dirname(__file__), "test_cases")


def pytest_sessionstart(session):
    """Check for essential setup before starting the session."""
    if not os.path.isdir(TEST_CASES_DIR):
        pytest.exit(f"Test case directory not found: {TEST_CASES_DIR}", returncode=1)
    if not os.getenv('PREFIX'):
        pytest.exit("Environment variable 'PREFIX' is not set. It is required for test execution.", returncode=1)
    if not os.getenv('PROJECT_ID'):
        pytest.exit("Environment variable 'PROJECT_ID' is not set. It is required for test execution.", returncode=1)

def build_command(shared_config, step):
    command_template = shared_config.get('command')
    additional_flags = ""
    flags_shared_config = shared_config.get('default_command_flags', {})
    flags_step = step.get('command_flags', {})
    merged_flags = flags_shared_config | flags_step
    logging.debug("Merged command flags=%s", merged_flags)

    for key, value in merged_flags.items():
        logging.debug("Parsing flag with key=%s and value=%s", key, value)
        if value is True:
            additional_flags = f"{additional_flags } --{key}"
        elif value is False:
            additional_flags = f"{additional_flags } --no-{key}"
        elif value == "absent":
            additional_flags = f"{additional_flags }"
        else:
            additional_flags = f"{additional_flags} --{key}={value}"

    return f"{command_template} {additional_flags}"


def pytest_collection_modifyitems(session, config, items):
    """
    Modify collected tests to inject the PREFIX into command strings.
    """
    prefix = os.getenv('PREFIX')
    for item in items:
        if 'steps' in getattr(item, 'callspec', {}).params:
            identifier = item.callspec.params.get('name', "").replace("_", "-")
            logging.debug("Processing pytest item: %s with identifier: %s", item.nodeid, identifier)
            shared_config = item.callspec.params.get('shared_config', [])
            logging.debug("Using test shared_config=%s", shared_config)

            steps = item.callspec.params.get('steps', [])
            for step in steps:
                identifier = f"{prefix}-{identifier}"
                command_template = step.get('command')
                if command_template is None:     # Checking from shared_config test
                    command_template = build_command(shared_config, step)

                if '{{ prefix }}' in command_template and prefix is not None:
                    command = command_template.replace('{{ prefix }}', prefix)

                if '{{ identifier }}' in command_template and identifier is not None:
                    command = command_template.replace('{{ identifier }}', identifier)

                logging.debug("Updating prefix and identifier for command to %s", command)
                step.update(command=command)

@pytest.hookimpl
def pytest_runtest_teardown(item, nextitem):
    """
    Execute teardown commands defined in test steps after the test runs.
    """
    logging.debug("Running teardown check for item: %s", item.nodeid)
    prefix = os.getenv('PREFIX')
    shared_config = item.callspec.params.get('shared_config', [])
    logging.debug("Using test shared_config=%s", shared_config)
    identifier = item.callspec.params.get('name', "").replace("_", "-")
    steps = item.callspec.params.get('steps', [])
    for step in steps:
        identifier = f"{prefix}-{identifier}"
        teardown_template = step.get('teardown_command')
        if teardown_template is None:
            teardown_template = shared_config.get('teardown_command')
        
        logging.debug("Found teardown command template: %s with identifier %s", teardown_template, identifier)

        teardown_command = teardown_template
        if '{{ prefix }}' in teardown_template and prefix is not None:
            teardown_command = teardown_command.replace('{{ prefix }}', prefix)

        if '{{ identifier }}' in teardown_template and identifier is not None:
            teardown_command = teardown_command.replace('{{ identifier }}', identifier)

        logging.info("Executing teardown command %s", teardown_command)
        try:
            run_gcloud_command(teardown_command)
            logging.debug("Teardown command executed successfully.")
        except Exception as e:
            logging.error(
                "Teardown command failed for command: %s\nError: %s",
                teardown_command,
                e)

@pytest.hookimpl
def pytest_generate_tests(metafunc):
    """
    Generate parametrized tests from YAML files found in TEST_CASES_DIR.
    """
    if "name" in metafunc.fixturenames and "steps" in metafunc.fixturenames:
        logging.debug("Generating tests for %s from directory: %s", metafunc.function.__name__, TEST_CASES_DIR)
        test_cases = generate_test_cases(TEST_CASES_DIR, metafunc)
        try:
            metafunc.parametrize("name,steps,shared_config", test_cases)
        except Exception as e:
            logging.error("Failed to parametrize %s: %s", metafunc.function.__name__, e, exc_info=True)
            pytest.fail(f"Error during parametrization of {metafunc.function.__name__}: {e}")


def generate_test_cases(folder_path, metafunc):
    """
    Walks a folder, parses YAML files, and yields pytest.param objects.
    """
    logging.debug("Scanning for YAML test cases in: %s", folder_path)

    test_cases = []
    for root, dirs, filenames in os.walk(folder_path):
        for filename in filenames:
            if filename.endswith((".yaml", ".yml")):
                filepath = os.path.join(root, filename)
                logging.debug("Processing YAML file: %s", filepath)
                try:
                    with open(filepath, "r", encoding="utf-8") as file:
                        data = yaml.safe_load(file)
                        shared_config = data.get("shared_config", {})
                        default_markers = shared_config.get("default_markers", [])
                        logging.info("Retrieving common information: %s", shared_config)
                        for key, value in data.items():
                            if key == "shared_config": 
                                continue
                            markers = value.get("markers", [])
                            markers.extend(default_markers)
                            marks = [getattr(pytest.mark, mark)
                                     for mark in markers]
                            test_cases.append(pytest.param(key, value.get("steps"), shared_config,
                                                           marks=marks))
                except yaml.YAMLError as e:
                    logging.error("Error parsing YAML file %s: %s", filepath, e)
                    continue
                except Exception as e:
                    logging.error("Unexpected error processing file %s: %s", 
                                  filepath, e, exc_info=True)
                    continue
    return test_cases
