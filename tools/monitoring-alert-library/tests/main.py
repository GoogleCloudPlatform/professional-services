import os
import sys
import logging
import shlex
import shutil
import subprocess
import datetime
import time
import json
import pytest
from jsonpath_ng import parse as parse_jsonpath

GCLOUD_EXIT_CODE_OK_OR_FAIL_ALREADY_EXISTS = "0_or_1_already_exists"
RANDOM_KEY = pytest.StashKey[str]()

# Log polling constants
LOG_POLL_RETRIES = 5  # Number of retries for fetching logs
LOG_POLL_INITIAL_INTERVAL_SECONDS = 5  # Initial wait time
LOG_POLL_MAX_INTERVAL_SECONDS = 60  # Maximum wait time for exponential backoff


def substitute_variables(command_template, prefix, project_id, project_number, random):
    """Substitutes placeholders in a command string."""
    command = str(command_template)
    if "{{ project }}" in command and project_id:
        command = command.replace("{{ project }}", project_id)
    if "{{ project_number }}" in command and project_number:
        command = command.replace("{{ project_number }}", project_number)
    if "{{ prefix }}" in command and prefix:
        command = command.replace("{{ prefix }}", prefix)
    if "{{ random }}" in command and random:
        command = command.replace("{{ random }}", random)
    return command

def sanitize_gcloud_command(command_list):
    """
    Modifies a gcloud command list to ensure consistency and add standard arguments.
    """
    gcloud_path = shutil.which("gcloud")
    if not gcloud_path:
        logging.fatal("gcloud command not found in PATH.")
        sys.exit(1)

    command_list[0] = gcloud_path
    command_list.extend(["--format", "json"])
    command_list.extend(["--quiet"])

    project_id = os.getenv("PROJECT_ID")
    if not project_id:
        logging.fatal("Environment variable PROJECT_ID is not set.")
        sys.exit(1)

    command_list.extend(["--project", project_id])
    return command_list


def run_gcloud_command(command_string):
    """
    Executes a gcloud command string after sanitizing it.
    """
    command_list = shlex.split(command_string)
    sanitized_command_list = sanitize_gcloud_command(command_list)
    logging.debug(
        "Executing sanitized command: %s",
        " ".join(shlex.quote(arg) for arg in sanitized_command_list),
    )

    try:
        process_result = subprocess.run(
            sanitized_command_list, capture_output=True, check=False
        )
    except Exception as e:
        logging.error(
            "Failed to execute command: %s due to error: %s", sanitized_command_list, e
        )
        sys.exit(1)

    return process_result


def parse_gcloud_output(step, output):
    """
    Validates the output of a gcloud command against expected conditions
    defined in 'step'.
    """
    try:
        stdout = output.stdout.decode("utf-8") if output.stdout else ""
        stderr = output.stderr.decode("utf-8") if output.stderr else ""
        logging.debug("Gcloud stdout output=%s", stdout)
        logging.debug("Gcloud stderr output=%s", stderr)
    except UnicodeDecodeError as e:
        logging.error("Failed to decode gcloud output: %s", e)
        sys.exit(1)

    expected_result = step.get("expected_result")
    if expected_result is None:
        logging.error("Failed to retrieve expected_result for %s", step)
        sys.exit(1)

    expected_return_code = expected_result.get("return_code", 0)
    if expected_return_code == GCLOUD_EXIT_CODE_OK_OR_FAIL_ALREADY_EXISTS:
        logging.debug(
            "Expected return_code: %s, got: %s and stderr: %s",
            expected_return_code,
            output.returncode,
            stderr,
        )
        return output.returncode == 0 or (
            output.returncode == 1 and "ALREADY_EXISTS" in stderr
        )

    if expected_return_code != output.returncode:
        logging.debug(
            "Expected return_code: %s, got: %s", expected_return_code, output.returncode
        )
        return False

    expected_stdout_substring = expected_result.get("stdout", "")
    if expected_stdout_substring and expected_stdout_substring not in stdout:
        logging.debug(
            "Expected stdout substring: %s, got: %s", expected_stdout_substring, stdout
        )
        return False

    expected_stderr_substring = expected_result.get("stderr", "")
    if expected_stderr_substring and expected_stderr_substring not in stderr:
        logging.debug(
            "Expected stderr substring: %s, got: %s", expected_stderr_substring, stderr
        )
        return False

    return True

def validate_log_attributes(log_entry, expected_attributes, substitutions):
    """
    Validates attributes of a log entry against expected attributes after substitution.
    substitutions: dict with 'prefix', 'project_id', 'project_number', 'identifier'
    """
    if not log_entry:
        logging.error("Log entry is empty, cannot validate attributes.")
        return False
    if not expected_attributes:
        logging.debug("No expected_attributes to validate in log entry.")
        return True

    all_match = True
    for path_key, expected_value_template in expected_attributes.items():
        substituted_expected_value = substitute_variables(
            str(expected_value_template),
            substitutions["prefix"],
            substitutions["project_id"],
            substitutions["project_number"],
            substitutions["random"],
        )
        if "{{ identifier }}" in substituted_expected_value and "identifier" in substitutions:
            substituted_expected_value = substituted_expected_value.replace("{{ identifier }}", substitutions["identifier"])

        jsonpath_expr = parse_jsonpath(path_key)
        matches = jsonpath_expr.find(log_entry)

        if not matches:
            logging.warning(f"Log attribute check: JSONPath '{path_key}' not found in log entry.")
            all_match = False
            continue

        actual_value = matches[0].value

        # Attempt to match type of expected_value_template if it's not a string from YAML (e.g. bool, int)
        # YAML loads bools as Python bools, numbers as int/float.
        if isinstance(expected_value_template, bool):
            # Convert actual_value to bool for comparison
            if isinstance(actual_value, str):
                actual_value_cmp = actual_value.lower() == 'true'
            else:
                actual_value_cmp = bool(actual_value)
            expected_value_cmp = expected_value_template
        elif isinstance(expected_value_template, int):
            try:
                actual_value_cmp = int(actual_value)
                expected_value_cmp = expected_value_template
            except (ValueError, TypeError):
                logging.warning(f"Log attribute check: Cannot compare '{actual_value}' as int for path '{path_key}'.")
                all_match = False
                continue
        elif isinstance(expected_value_template, float):
            try:
                actual_value_cmp = float(actual_value)
                expected_value_cmp = expected_value_template
            except (ValueError, TypeError):
                logging.warning(f"Log attribute check: Cannot compare '{actual_value}' as float for path '{path_key}'.")
                all_match = False
                continue
        else: # Default to string comparison
            actual_value_cmp = str(actual_value)
            expected_value_cmp = str(substituted_expected_value)


        if actual_value_cmp != expected_value_cmp:
            logging.warning(
                f"Log attribute mismatch for '{path_key}'. Expected: '{expected_value_cmp}' (type: {type(expected_value_cmp)}), "
                f"Got: '{actual_value_cmp}' (type: {type(actual_value_cmp)}, original: '{actual_value}')"
            )
            all_match = False

    return all_match

def test_gcloud_command(current_test_item, name, steps, shared_config):
    """
    Execute a pytest test involving gcloud command, optionally check for specific logs,
    and ensure that the gcloud output and/or log attributes match expected patterns.
    """
    logging.info("STARTING GCLOUD TEST: %s (Shared config: %s)", name, shared_config)
    prefix = os.getenv("PREFIX")
    project_id = os.getenv("PROJECT_ID")
    project_number = os.getenv("PROJECT_NUMBER")
    random = current_test_item.stash.get(RANDOM_KEY, None)

    # This identifier is specific to the test case (e.g., 'myprefix-firewall-vpc-creation')
    test_specific_identifier = f"{prefix}-{name.replace('_', '-')}" if prefix else name.replace('_', '-')

    for step_index, step in enumerate(steps):
        step_name = step.get("name", f"Step {step_index + 1}")
        logging.info(f"Executing Test '{name}', {step_name}")

        main_command_str = step.get("command")
        if not main_command_str:
            logging.error(f"No command found for step {step_name} in test {name}")
            assert False, f"Missing command in step {step_name} for test {name}"

        # --- 1. Execute the main gcloud command ---
        logging.info(f"Main command for step '{step_name}': {main_command_str}")
        start_time_utc = datetime.datetime.utcnow()
        # Ensure RFC3339 format with Z for UTC, compatible with gcloud timestamp filters
        start_timestamp_rfc3339 = start_time_utc.isoformat(timespec='microseconds') + "Z"

        main_cmd_output_obj = run_gcloud_command(main_command_str)
        main_cmd_ok = parse_gcloud_output(step, main_cmd_output_obj)

        if not main_cmd_ok:
            stdout_raw = main_cmd_output_obj.stdout.decode('utf-8', errors='replace') if main_cmd_output_obj.stdout else ""
            stderr_raw = main_cmd_output_obj.stderr.decode('utf-8', errors='replace') if main_cmd_output_obj.stderr else ""
            logging.error(
                f"Main command for step '{step_name}' failed validation. "
                f"Return Code: {main_cmd_output_obj.returncode}. "
                f"STDOUT: {stdout_raw[:500]}... " 
                f"STDERR: {stderr_raw[:500]}..."
            )
            assert main_cmd_ok, f"Test '{name}', step '{step_name}': Main command execution or validation failed."

        # --- 2. Perform log validation if configured ---
        log_validation_overall_ok = True # Default to True if no log validation is configured
        log_filter_template = shared_config.get("log_filter")
        expected_attributes = step.get("expected_result", {}).get("attributes")

        if log_filter_template and expected_attributes:
            logging.info(f"Step '{step_name}': Performing log validation.")

            # Substitute variables in log_filter_template
            log_filter_substituted_vars = substitute_variables(
                log_filter_template, prefix, project_id, project_number, random
            )
            log_filter_final = log_filter_substituted_vars.replace("{{ identifier }}", test_specific_identifier)

            full_log_filter = f'({log_filter_final}) AND timestamp >= "{start_timestamp_rfc3339}"'
            logging_command_str = f"gcloud logging read '{full_log_filter}' --format json --limit 1 --order=desc"
            
            log_found_and_valid = False
            current_interval = LOG_POLL_INITIAL_INTERVAL_SECONDS

            for attempt in range(LOG_POLL_RETRIES):
                logging.info(
                    f"Log poll attempt {attempt + 1}/{LOG_POLL_RETRIES} for step '{step_name}'. "
                    f"Command: {logging_command_str}"
                )
                log_cmd_output_obj = run_gcloud_command(logging_command_str)

                log_stdout = log_cmd_output_obj.stdout.decode("utf-8", errors="replace") if log_cmd_output_obj.stdout else ""
                log_stderr = log_cmd_output_obj.stderr.decode("utf-8", errors="replace") if log_cmd_output_obj.stderr else ""

                if log_cmd_output_obj.returncode == 0 and log_stdout.strip():
                    try:
                        log_entries = json.loads(log_stdout)
                        if log_entries: # Found one or more log entries
                            log_entry = log_entries[0] # Process the latest one matching criteria
                            logging.info(f"Log entry found for step '{step_name}'. Validating attributes...")
                            logging.debug(f"Log entry content: {json.dumps(log_entry, indent=2)}")

                            substitutions_for_validation = {
                                "prefix": prefix,
                                "project_id": project_id,
                                "project_number": project_number,
                                "identifier": test_specific_identifier,
                                "random": random,
                            }
                            if validate_log_attributes(log_entry, expected_attributes, substitutions_for_validation):
                                logging.info(f"Log attributes validated successfully for step '{step_name}'.")
                                log_found_and_valid = True
                                break # Exit polling loop
                            else:
                                logging.warning(f"Log attributes validation failed for step '{step_name}'. Will retry if attempts left.")
                        else:
                            logging.info(f"Log poll attempt {attempt + 1}: No matching log entries found yet for step '{step_name}'.")
                    except json.JSONDecodeError as e:
                        logging.error(f"Failed to parse JSON from 'gcloud logging read' output: {e}. Output: {log_stdout}")
                else:
                    logging.warning(
                        f"Log poll attempt {attempt + 1} for step '{step_name}' failed or returned no output. "
                        f"RC: {log_cmd_output_obj.returncode}. Stderr: {log_stderr}"
                    )
                
                if attempt < LOG_POLL_RETRIES - 1:
                    logging.info(f"Waiting {current_interval}s before next log poll attempt...")
                    time.sleep(current_interval)
                    # Exponential backoff
                    current_interval = min(current_interval * 2, LOG_POLL_MAX_INTERVAL_SECONDS)

            log_validation_overall_ok = log_found_and_valid
            if not log_validation_overall_ok:
                logging.error(f"Test '{name}', step '{step_name}': Log validation failed after {LOG_POLL_RETRIES} attempts.")

        elif log_filter_template and not expected_attributes:
            logging.info(
                f"Step '{step_name}' for test '{name}': 'log_filter' provided but 'expected_result.attributes' is missing. "
                "Skipping log validation."
            )
        elif not log_filter_template and expected_attributes:
            logging.info(
                f"Step '{step_name}' for test '{name}': 'expected_result.attributes' provided but 'log_filter' is missing. "
                "Skipping log validation."
            )

        # --- 3. Final assertion for the step ---
        assert main_cmd_ok and log_validation_overall_ok, \
            f"Test '{name}', step '{step_name}' failed. Main command OK: {main_cmd_ok}, Log validation OK: {log_validation_overall_ok}"

        logging.info(f"COMPLETED Test '{name}', step '{step_name}' successfully.")

    logging.info(f"COMPLETED GCLOUD TEST: {name} successfully.")