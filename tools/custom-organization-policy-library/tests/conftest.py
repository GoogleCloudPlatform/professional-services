import logging
import os
import re
import yaml
import pytest
from main import run_gcloud_command, GCLOUD_EXIT_CODE_OK_OR_FAIL_ALREADY_EXISTS

TEST_CASES_DIR = os.path.join(os.path.dirname(__file__), "test_cases")
FIXTURE_CONFIG_FILE = os.path.join(TEST_CASES_DIR, "fixture.yaml")


def pytest_sessionstart(session):
    """Check for essential setup before starting the session."""
    if not os.path.isdir(TEST_CASES_DIR):
        pytest.exit(f"Test case directory not found: {TEST_CASES_DIR}", returncode=1)
    if not os.getenv("PREFIX"):
        pytest.exit(
            "Environment variable 'PREFIX' is not set. It is required for test execution.",
            returncode=1,
        )
    if not os.getenv("PROJECT_ID"):
        pytest.exit(
            "Environment variable 'PROJECT_ID' is not set. It is required for test execution.",
            returncode=1,
        )
    if not os.getenv("PROJECT_NUMBER"):
        pytest.exit(
            "Environment variable 'PROJECT_NUMBER' is not set. It is required for test execution.",
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


def _substitute_variables(command_template, prefix, project_id, project_number):
    """Substitutes placeholders in a command string."""
    command = command_template
    if "{{ project }}" in command and project_id:
        command = command.replace("{{ project }}", project_id)
    if "{{ project_number }}" in command and project_number:
        command = command.replace("{{ project_number }}", project_number)
    if "{{ prefix }}" in command and prefix:
        command = command.replace("{{ prefix }}", prefix)
    return command


def _shorten_gcp_resource_name(name: str, max_len: int = 63) -> str:
    """Return a name that matches GCP's common DNS-like regex and length limit.

    GCE firewall rule names must match:
      ^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$

    We normalize to lowercase, replace invalid chars with '-', trim to max_len,
    ensure first char is a letter, and last char is alphanumeric.
    """
    if not name:
        return "a0"
    s = name.lower()
    s = re.sub(r"[^a-z0-9-]", "-", s)
    s = s[:max_len]
    # Ensure starts with a letter
    if not s[0].isalpha():
        s = ("a" + s[1:]) if len(s) > 1 else "a"
    # Ensure does not end with '-'
    s = s.rstrip("-")
    if not s:
        s = "a0"
    # Ensure last char is alphanumeric
    if not s[-1].isalnum():
        s = re.sub(r"[^a-z0-9]+$", "", s)
        if not s:
            s = "a0"
    return s


def _shorten_firewall_rule_name_in_command(command: str, full_identifier: str) -> str:
    """Shorten the firewall rule name within the given gcloud command string.

    This handles templates like:
      gcloud compute firewall-rules create allow-<prefix>-{{ identifier }} ...

    We parse out the token immediately following 'create' (or 'delete') and
    replace it with a shortened version after substituting the identifier.
    """
    try:
        import shlex
        # First, replace the identifier placeholder so the name is contiguous
        command = command.replace("{{ identifier }}", full_identifier)
        tokens = shlex.split(command)
        if len(tokens) < 5:
            return command
        # Locate operation index and resource name token
        name_idx = None
        for i, t in enumerate(tokens):
            if t in ("create", "delete") and i + 1 < len(tokens):
                name_idx = i + 1
                break
        if name_idx is None:
            return command
        name_template = tokens[name_idx]
        final_name = name_template.replace("{{ identifier }}", full_identifier)
        final_name = _shorten_gcp_resource_name(final_name)
        tokens[name_idx] = final_name
        return " ".join(shlex.quote(t) if " " in t or any(c in t for c in ['"', "'"]) else t for t in tokens)
    except Exception:  # Fallback to simple replace
        return command


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

            command = _substitute_variables(
                command_template, prefix, project_id, project_number
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

            command = _substitute_variables(
                command_template, prefix, project_id, project_number
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


def build_command(shared_config, step):
    """
    Build the gcloud command and flags that needs to be executed
    """
    if "command" in step:
        return step.get("command")

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
        # Skip optional 'no exceptions' scenarios unless explicitly enabled
        try:
            marks = [m.name for m in item.iter_markers()]
        except Exception:
            marks = []
        if "firewall_no_exceptions" in marks and os.getenv("FIREWALL_NO_EXCEPTIONS") != "1":
            item.add_marker(pytest.mark.skip(reason="Set FIREWALL_NO_EXCEPTIONS=1 to run no-exceptions scenarios"))

        if "steps" in getattr(item, "callspec", {}).params:
            identifier = item.callspec.params.get("name", "").replace("_", "-")
            logging.debug(
                "Processing pytest item: %s with identifier: %s",
                item.nodeid,
                identifier,
            )
            shared_config = item.callspec.params.get("shared_config", {})
            logging.debug("Using test shared_config=%s", shared_config)

            steps = item.callspec.params.get("steps", [])
            for step in steps:
                try:
                    command_template = step.get("command")
                    if command_template is None:
                        command_template = build_command(shared_config, step)

                    logging.debug(
                        "Retrieving template command=%s with identifier=%s",
                        command_template,
                        identifier,
                    )
                    command = _substitute_variables(
                        command_template, prefix, project_id, project_number
                    )
                    full_identifier = f"{prefix}-{identifier}"
                    if "gcloud compute firewall-rules" in command:
                        # Always handle firewall rule names via parser to include any prefixes
                        new_command = _shorten_firewall_rule_name_in_command(
                            command, full_identifier
                        )
                        logging.debug(
                            "Firewall command rewrite: base_id=%s, old=%s, new=%s",
                            full_identifier,
                            command,
                            new_command,
                        )
                        command = new_command
                    elif "{{ identifier }}" in command and identifier is not None:
                        command = command.replace("{{ identifier }}", full_identifier)

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

        teardown_command = _substitute_variables(
            teardown_template, prefix, project_id, project_number
        )
        if "gcloud compute firewall-rules" in teardown_command:
            teardown_command = _shorten_firewall_rule_name_in_command(
                teardown_command, identifier
            )
        elif "{{ identifier }}" in teardown_template and identifier is not None:
            teardown_command = teardown_command.replace(
                "{{ identifier }}", identifier
            )

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
