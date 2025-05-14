# Custom Organization Policy Test Framework

This framework uses `pytest` to execute and validate Google Cloud (`gcloud`) commands based on test definitions written in YAML files. It's designed to test interactions with Google Cloud resources, often in the context of enforcing custom organizational policies.

The framework automatically discovers test cases from YAML files, parametrizes tests, injects unique identifiers into commands, executes the commands, validates the output (return code, stdout, stderr), and runs defined teardown commands for cleanup.

## Prerequisites

1.  **Python:** Python 3.11 or newer is recommended.
2.  **pip:** Python's package installer.
3.  **Google Cloud SDK:** The `gcloud` command-line tool must be installed, authenticated, and configured on your system.
4.  **Project ID:** You need a Google Cloud Project ID where the test resources will be created and managed.
5.  **Environment Variables:** Two environment variables *must* be set before running tests:
    *   `PROJECT_ID`: Your Google Cloud Project ID.
    *   `PROJECT_NUMBER`: Your Google Cloud Project Number.
    *   `PREFIX`: A short string (e.g., `test`, `ci`, your initials) used to create unique names for temporary resources created during tests. This helps prevent naming collisions.

## Setup

1.  **Install dependencies:**
```bash
python3 -m venv venv
. venv/bin/activate
python -m pip install -r requirements.txt
```

2.  **Set Environment Variables:**
*   **Linux/macOS:**
```bash
export PROJECT_ID="custom-org-policy-library"
export PROJECT_NUMBER="215309932287"
export PREFIX="cuop-library"
```

* (Remember to replace `"your-gcp-project-id"`,`"your-gcp-project-number"`  and `"your-prefix"` with actual values)*

## How to add a Test Case ?

Tests are defined in YAML files located within the `test_cases/` directory (including subdirectories).

1.  **Create or choose a YAML file:** Place your test definitions in a relevant `.yaml` or `.yml` file inside `test_cases/`. For example, `test_cases/cloudsql/mysql.yaml`.

2.  **Define `shared_config` (Optional but Recommended):**
    At the top level of the YAML file, you can define a `shared_config` block to specify common settings for all test cases within that file.

    *   `command`: (Required if not defined in each step) The base `gcloud` command *template*. Use `{{ identifier }}` as a placeholder for the unique resource name generated for the test.
    *   `teardown_command`: (Optional but Recommended) The `gcloud` command *template* to clean up resources created by the test. Use `{{ identifier }}`. This command runs automatically after each test case finishes, regardless of success or failure.
    *   `default_command_flags`: (Optional) A dictionary of flags that will be added to the `command` for *all* test cases in the file, unless overridden by a specific test case's `command_flags`.
        *   Flag names are keys.
        *   Values can be:
            *   `true`: Appends `--flag_name`.
            *   `false`: Appends `--no-flag_name`.
            *   `"absent"`: The flag (and its default value, if any) is *not* included in the final command. Useful for testing defaults or removing a default flag.
            *   Other strings/numbers: Appends `--flag_name=value`.
    *   `default_markers`: (Optional) A list of pytest markers to apply to all tests in the file.

3.  **Define Test Cases:**
    Each top-level key in the YAML file (other than `shared_config`) defines a separate test case. The key itself becomes part of the test name and the generated `identifier`. Underscores (`_`) in the key name are converted to hyphens (`-`) for the identifier.

    *   `steps`: (Required) A list containing one or more steps for the test case.
    *   `command`: (Optional) A *complete* `gcloud` command string. If provided, this *overrides* the `shared_config.command` and ignores `command_flags`. Placeholders `{{ prefix }}` and `{{ identifier }}` *will* be substituted if present.
    *   `command_flags`: (Optional) A dictionary of flags specific to *this* test step. These flags are *merged* with `shared_config.default_command_flags`, with the step's flags taking precedence. Use the same value types (`true`, `false`, `"absent"`, string/number) as in `default_command_flags`. Use this *instead* of `command` if you only want to modify flags based on the `shared_config.command`.
    *   `expected_result`: (Required) A dictionary describing the expected outcome of the `gcloud` command for this step.
    *   `return_code`: (Optional, defaults to `0`) The expected exit code of the `gcloud` command.
    *   `stdout`: (Optional) A substring expected to be present in the command's standard output.
    *   `stderr`: (Optional) A substring expected to be present in the command's standard error (often used for checking constraint violations).
    *   `markers`: (Optional) A list of pytest markers specific to this test case, added to any `default_markers`.

4.  **Placeholders:**
    *   `{{ identifier }}`: This placeholder will be automatically replaced in `command` and `teardown_command` templates. The identifier is generated as `{PREFIX}-{test_case_key}` (with underscores in the key replaced by hyphens). For example, if `PREFIX` is `dev` and the test key is `cloudsql_mysql_instance_allowed`, the resource identifier becomes `dev-cloudsql-mysql-instance-allowed`.
    *   `{{ prefix }}`: This placeholder will be replaced by the value of the `PREFIX` environment variable if used directly in a command template (less common than using `{{ identifier }}` which includes the prefix).

### Example (`mysql.yaml`) Walkthrough

```yaml
# test_cases/mysql.yaml (Simplified)
shared_config:
  command:  gcloud sql instances create {{ identifier }} # Base command template
  teardown_command: gcloud sql instances delete {{ identifier }} # Cleanup command
  default_command_flags: # Default flags for all tests below
    availability-type: REGIONAL
    region: asia-southeast2
    # ... other default flags ...
    ssl-mode: ENCRYPTED_ONLY
  default_markers: # Default markers
    - cloudsql
    - mysql

# Test Case 1: Uses all defaults
cloudsql_mysql_instance_allowed:
  steps:
  - expected_result:
      return_code: 0 # Expect success with default flags

# Test Case 2: Overrides one flag to test a failure scenario
cloudsql_mysql_instance_no_ssl_mode_encrypted:
  steps:
  - command_flags: # Override default_command_flags
      ssl-mode: absent # Remove the --ssl-mode flag
    expected_result:
      return_code: 1 # Expect failure
      stderr: "customConstraints/custom.cloudsqlRequireSSLConnection" # Expect specific error message

# Test Case 3: Adds a flag to test a failure scenario
cloudsql_mysql_instance_no_public_authorized_networks:
  steps:
  - command_flags: # Add a flag not in defaults
      authorized-networks: 0.0.0.0/0
    expected_result:
      return_code: 1 # Expect failure
      stderr: "customConstraints/custom.cloudsqlDisablePublicAuthorizedNetworks"
```

## How to run Tests Cases ?

Ensure you are in the project's root directory and have set the `PROJECT_ID` and `PREFIX` environment variables.

1. **Run all tests:**
```bash
. venv/bin/activate
export PROJECT_ID=my-project-id
export PROJECT_NUMBER=11111111111
export PREFIX=custom-org-policy-1234
pytest main.py
```

2. **Run tests with specific markers:**
(Markers are defined in `default_markers` or the `markers` list within a test case).
```bash
pytest main.py -m mysql # Run tests marked with 'mysql'
```

3. **Run specific test cases by name (keyword matching):**
(Matches against the test case key from the YAML file).
```bash
pytest main.py -k cloudsql_mysql_instance_no_ssl_mode_encrypted # Run a specific test
```

4.  **Generate an HTML Report:**

This creates a `report.html` file in the current directory.

**Important:** 
The teardown command defined in `shared_config.teardown_command` or `step.teardown_command` runs automatically after each test case completes its execution, attempting to clean up any resources created by the test's `command`. Check the logs for teardown success or failure messages.