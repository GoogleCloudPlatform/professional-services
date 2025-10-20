import os
import re
import sys
import logging
import shlex
import shutil
import subprocess


GCLOUD_EXIT_CODE_OK_OR_FAIL_ALREADY_EXISTS = "0_or_1_already_exists"


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


def test_gcloud_command(name, steps, shared_config):
    """
    Execute a pytest test involving gcloud command ans ensure
    that the gcloud output is container an expected pattern
    """
    logging.debug("Running gcloud test %s with shared_config=%s", name, shared_config)
    for step in steps:
        command = shlex.split(step.get("command"))
        if command[0] != "gcloud":
            logging.fatal("Command %s is not supported", command[0])
            assert False

        output = run_gcloud_command(step.get("command"))
        result = parse_gcloud_output(step, output)
        assert result


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
    
    expected_stderr_pattern = expected_result.get("stderr", "")
    if expected_stderr_pattern and not re.search(expected_stderr_pattern, stderr):
        logging.debug(
            "Expected stderr pattern: '%s' not found in: '%s'",
            expected_stderr_pattern,
            stderr,
        )
        return False

    # expected_stderr_substring = expected_result.get("stderr", "")
    # if expected_stderr_substring and expected_stderr_substring not in stderr:
    #     logging.debug(
    #         "Expected stderr substring: %s, got: %s", expected_stderr_substring, stderr
    #     )
    #     return False

    return True
