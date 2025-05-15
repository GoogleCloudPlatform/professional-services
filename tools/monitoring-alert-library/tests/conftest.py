import logging
import os
import yaml
import pytest
import uuid
import hashlib

from main import run_gcloud_command, substitute_variables, GCLOUD_EXIT_CODE_OK_OR_FAIL_ALREADY_EXISTS, RANDOM_KEY

TEST_CASES_DIR = os.path.join(os.path.dirname(__file__), "test_cases")
FIXTURE_CONFIG_FILE = os.path.join(TEST_CASES_DIR, "fixture.yaml")

def pytest_sessionstart(session):
    """Check for essential setup before starting the session."""
    if not os.path.isdir(TEST_CASES_DIR):
        pytest.exit(f"Test case directory not found: {TEST_CASES_DIR}", returncode=1)
    required_env_vars = ["PREFIX", "PROJECT_ID", "PROJECT_NUMBER"]
    for var in required_env_vars:
        if not os.getenv(var):
            pytest.exit(
                f"Environment variable '{var}' is not set. It is required for test execution.",
                returncode=1,
            )
    logging.info(
        "Initial checks passed. PREFIX=%s, PROJECT_ID=%s, PROJECT_NUMBER=%s",
        os.getenv("PREFIX"),
        os.getenv("PROJECT_ID"),
        os.getenv("PROJECT_NUMBER"),
    )

def _print_centered_with_fill(text_to_center):
    """
    Prints the given text centered on the screen,
    padded with '=' characters to fill the terminal width.
    """
    terminal_width = 80  # A common default
    centered_text = text_to_center.center(terminal_width, "=")
    logging.info(centered_text)


def _load_fixture_config():
    """Loads the fixture configuration YAML file."""
    if not os.path.exists(FIXTURE_CONFIG_FILE):
        logging.warning("Fixture configuration file not found: %s", FIXTURE_CONFIG_FILE)
        return None
    try:
        with open(FIXTURE_CONFIG_FILE, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        logging.error(
            "Unexpected error loading fixture file %s: %s",
            FIXTURE_CONFIG_FILE,
            e,
            exc_info=True,
        )
        pytest.fail(f"Failed to load {FIXTURE_CONFIG_FILE}: {e}", pytrace=False)

@pytest.fixture(scope="session", autouse=True)
def session_setup_and_teardown():
    """
    Executes global setup commands before all tests and teardown commands after.
    Reads commands from fixture.yaml.
    """
    logging.info("Starting session setup from fixture.yaml")
    config = _load_fixture_config()
    prefix = os.getenv("PREFIX")
    project_id = os.getenv("PROJECT_ID")
    project_number = os.getenv("PROJECT_NUMBER")

    # --- Before Tests ---
    if config and "before_tests" in config:
        _print_centered_with_fill("Executing 'before_tests' commands...")
        for item in config["before_tests"]:
            command_template = item.get("command")
            description = item.get("description", "N/A")
            expected_result = item.get("expected_result", {})
            expected_return_code = expected_result.get("return_code", 0)
            if not command_template:
                logging.warning(
                    "Skipping 'before_tests' item without command: %s", description
                )
                continue

            command = substitute_variables(
                command_template, prefix, project_id, project_number, None
            )
            logging.info("Running setup command (%s): %s", description, command)
            try:
                result = run_gcloud_command(command)
                if (
                    result.returncode != 0
                    and expected_return_code
                    != GCLOUD_EXIT_CODE_OK_OR_FAIL_ALREADY_EXISTS
                ):
                    logging.error(
                        "Setup command failed: %s with result: %s", command, result
                    )

                logging.debug(
                    "Setup command successful: %s with result: %s", command, result
                )
            except Exception as e:
                logging.exception(
                    "Exception during session setup command: %s and exception: %s",
                    command,
                    e,
                )
        _print_centered_with_fill("'before_tests' commands execution finished.")
    else:
        _print_centered_with_fill(
            "No 'before_tests' commands found or fixture file missing."
        )

    yield

    # --- After Tests ---
    config = _load_fixture_config()
    if config and "after_tests" in config:
        _print_centered_with_fill("Executing 'after_tests' commands...")
        for item in reversed(config["after_tests"]):
            command_template = item.get("command")
            description = item.get("description", "N/A")
            if not command_template:
                logging.warning(
                    "Skipping 'after_tests' item without command: %s", description
                )
                continue

            command = substitute_variables(
                command_template, prefix, project_id, project_number, None
            )
            logging.info("Running teardown command (%s): %s", description, command)
            try:
                result = run_gcloud_command(command)
                if result.returncode != 0:
                    logging.error(
                        "Teardown command failed: %s with result: %s", command, result
                    )

                logging.debug(
                    "Teardown command successful: %s with result: %s", command, result
                )
            except Exception as e:
                logging.exception(
                    "Exception during session teardown command: %s and exception: %s",
                    command,
                    e,
                )
        _print_centered_with_fill("'after_tests' commands execution finished.")
    else:
        _print_centered_with_fill(
            "No 'after_tests' commands found or fixture file missing."
        )

@pytest.fixture
def current_test_item(request):
    """
    Fixture to provide access to the current test item (pytest.Function object).
    """
    return request.node

def build_command(shared_config, step):
    """
    Build the gcloud command and flags that needs to be executed
    """
    if "command" in step:
        command_template = step.get("command")
    else:
        command_template = shared_config.get("command")

    if command_template is None:
        logging.error("Command template is missing in shared_config and step.")
        raise ValueError(
            "Cannot build command: 'command' template missing in shared_config and not overridden in step."
        )

    additional_flags = ""
    flags_shared_config = shared_config.get("default_command_flags", {})
    flags_step = step.get("command_flags", {})
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
            additional_flags = f'{additional_flags} --{key}="{value}"'

    return f"{command_template} {additional_flags}"


def pytest_collection_modifyitems(session, config, items):
    """
    Modify collected tests to inject the PREFIX into command strings.
    """
    prefix = os.getenv("PREFIX")
    project_id = os.getenv("PROJECT_ID")
    project_number = os.getenv("PROJECT_NUMBER")

    for item in items:
        if "steps" in getattr(item, "callspec", {}).params:
            identifier = item.callspec.params.get("name", "").replace("_", "-")
            random_string = str(uuid.uuid4())
            random = hashlib.sha256(random_string.encode()).hexdigest()
            random = random[:8]
            item.stash[RANDOM_KEY] = random

            logging.debug(
                "Processing pytest item: %s with identifier: %s and random: %s",
                item.nodeid,
                identifier,
                random
            )
            shared_config = item.callspec.params.get("shared_config", {})
            logging.debug("Using test shared_config=%s", shared_config)

            steps = item.callspec.params.get("steps", [])
            for step in steps:
                try:
                    command_template = build_command(shared_config, step)

                    logging.debug(
                        "Retrieving template command=%s with identifier=%s",
                        command_template,
                        identifier,
                    )
                    command = substitute_variables(
                        command_template, prefix, project_id, project_number, random
                    )
                    if "{{ identifier }}" in command and identifier is not None:
                        command = command.replace(
                            "{{ identifier }}", f"{prefix}-{identifier}"
                        )

                    logging.debug("Updating command to %s", command)
                    step.update(command=command)
                except Exception as e:
                    logging.error(
                        "Error processing step for item %s: %s",
                        item.nodeid,
                        e,
                        exc_info=True,
                    )


@pytest.hookimpl
def pytest_runtest_teardown(item, nextitem):
    """
    Execute teardown commands defined in test steps after the test runs.
    """
    logging.debug("Running teardown check for item: %s", item.nodeid)
    prefix = os.getenv("PREFIX")
    project_id = os.getenv("PROJECT_ID")
    project_number = os.getenv("PROJECT_NUMBER")
    random = item.stash.get(RANDOM_KEY, None)

    shared_config = item.callspec.params.get("shared_config", {})
    logging.debug("Using test shared_config=%s", shared_config)
    identifier = item.callspec.params.get("name", "").replace("_", "-")
    steps = item.callspec.params.get("steps", [])

    for step in steps:
        identifier = f"{prefix}-{identifier}"

        teardown_template = step.get("teardown_command")
        if teardown_template is None:
            teardown_template = shared_config.get("teardown_command")

        if teardown_template is None:
            logging.debug(
                "No specific teardown command found for step or in shared_config."
            )
            continue

        logging.debug(
            "Found teardown command template: %s with identifier %s",
            teardown_template,
            identifier,
        )

        teardown_command = substitute_variables(
            teardown_template, prefix, project_id, project_number, random
        )
        if "{{ identifier }}" in teardown_template and identifier is not None:
            teardown_command = teardown_command.replace("{{ identifier }}", identifier)

        logging.info("Executing test step teardown command: %s", teardown_command)
        try:
            result = run_gcloud_command(teardown_command)
            logging.debug(
                "Teardown command executed successfully with result=%s", result
            )
        except Exception as e:
            logging.error(
                "Teardown command failed for command: %s\nError: %s",
                teardown_command,
                e,
            )


@pytest.hookimpl
def pytest_generate_tests(metafunc):
    """
    Generate parametrized tests from YAML files found in TEST_CASES_DIR.
    """
    if "name" in metafunc.fixturenames and "steps" in metafunc.fixturenames:
        logging.debug(
            "Generating tests for %s from directory: %s",
            metafunc.function.__name__,
            TEST_CASES_DIR,
        )
        test_cases = generate_test_cases(TEST_CASES_DIR, metafunc)
        if not test_cases:
            logging.warning("No test cases found or generated in %s.", TEST_CASES_DIR)

        try:
            metafunc.parametrize("name,steps,shared_config", test_cases)
        except Exception as e:
            logging.error(
                "Failed to parametrize %s: %s",
                metafunc.function.__name__,
                e,
                exc_info=True,
            )
            pytest.fail(
                f"Error during parametrization of {metafunc.function.__name__}: {e}"
            )


def generate_test_cases(folder_path, metafunc):
    """
    Walks a folder, parses YAML files, and yields pytest.param objects.
    """
    logging.debug("Scanning for YAML test cases in: %s", folder_path)
    test_cases = []
    for root, dirs, filenames in os.walk(folder_path):
        for filename in filenames:
            if os.path.join(root, filename) == FIXTURE_CONFIG_FILE:
                continue

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
                            marks = [getattr(pytest.mark, mark) for mark in markers]
                            test_cases.append(
                                pytest.param(
                                    key, value.get("steps"), shared_config, marks=marks
                                )
                            )
                except yaml.YAMLError as e:
                    logging.error("Error parsing YAML file %s: %s", filepath, e)
                    continue
                except Exception as e:
                    logging.error(
                        "Unexpected error processing file %s: %s",
                        filepath,
                        e,
                        exc_info=True,
                    )
                    continue
    return test_cases
