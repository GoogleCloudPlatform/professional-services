# Monitoring Alert Test Framework

This framework uses `pytest` to execute and validate Google Cloud (`gcloud`) commands based on test definitions written in YAML files. It's designed to test interactions with Google Cloud resources, particularly in the context of detecting triggers for monitoring alerts.

The framework automatically discovers test cases from YAML files, parametrizes tests, injects unique identifiers and other context-specific variables into commands, executes these commands, and then runs defined teardown commands for cleanup. It also supports global setup and teardown routines via a `fixture.yaml` file.

## Prerequisites

1.  **Python:** Python 3.11 or newer is recommended.
2.  **pip:** Python's package installer.
3.  **Google Cloud SDK:** The `gcloud` command-line tool must be installed, authenticated, and configured on your system.
4.  **Project Configuration:** You need a Google Cloud Project where the test resources will be created and managed.
5.  **Environment Variables:** The following environment variables *must* be set before running tests:
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
        export PROJECT_ID="your-gcp-project-id"
        export PROJECT_NUMBER="your-gcp-project-number"
        export PREFIX="your-prefix"
        ```
    *(Remember to replace `"your-gcp-project-id"`, `"your-gcp-project-number"`, and `"your-prefix"` with actual values)*

## How to add a Test Case?

Tests are defined in YAML files located within the `test_cases/` directory (including subdirectories, excluding `fixture.yaml`).

1.  **Create or choose a YAML file:** Place your test definitions in a relevant `.yaml` or `.yml` file inside `test_cases/`. For example, `test_cases/network/peering.yaml`.

2.  **Define `shared_config`:**
    At the top level of your YAML file, you can define a `shared_config` block to specify common settings for all test cases within that file.
    *   `command`: (Optional) A base `gcloud` command template that will be used for steps that do not define their own `command`.
    *   `teardown_command`: (Optional) A default `gcloud` command template for cleaning up resources. If a step doesn't have its own `teardown_command`, this one will be used. This command is executed after the entire test case (all its steps) completes, for each step that should use it.
    *   `default_command_flags`: (Optional) A dictionary of flags that will be added to the `command` for all test cases in the file. These can be overridden or extended by a specific step's `command_flags`.
        *   Flag names are keys.
        *   Values can be:
            *   `true`: Appends `--flag_name`.
            *   `false`: Appends `--no-flag_name`.
            *   `"absent"`: The flag (and its value, if any from a higher default) is *not* included.
            *   Other strings/numbers: Appends `--flag_name="value"` (quotes added for string values).
    *   `default_markers`: (Optional) A list of pytest markers (strings) to apply to all test cases defined in this file.
    *   `log_filter`: (Optional) The Cloud Logging query string used to fetch relevant logs for assertion, typically related to the actions performed by the test commands.

3.  **Define Test Cases:**
    Each top-level key in the YAML file (other than `shared_config`) defines a separate test case. The key itself (e.g., `network_peering_creation_audit_log`) is used to generate a unique `identifier` for resources. Underscores (`_`) in the key are converted to hyphens (`-`) for the identifier.

    A test case consists of:
    *   `steps`: (Required) A list, where each item in the list is a dictionary defining a step in the test.
    *   `markers`: (Optional) A list of pytest markers specific to this test case. These are combined with `default_markers` from `shared_config`.

4.  **Define Steps (within the `steps` list):**
    Each step dictionary can have the following keys:
    *   `command`: (Required if not provided in `shared_config`) The `gcloud` command template for this specific step. Overrides `shared_config.command`.
    *   `teardown_command`: (Optional) A `gcloud` command template to clean up resources created specifically by this step. Overrides `shared_config.teardown_command` for this step. This command is executed after the parent test case (all its steps) completes.
    *   `command_flags`: (Optional) A dictionary of flags specific to this step. These are merged with `shared_config.default_command_flags`, with step-specific flags taking precedence.
    *   `expected_result`: (Required) A dictionary describing the expected outcome of this step's `command`.
        *   `return_code`: (Optional, defaults to `0`) The expected exit code of the `gcloud` command.
        *   `attributes`: (Optional) A dictionary where keys are JSONPath-like expressions targeting fields in the generated Cloud Log entry, and values are the expected values for those fields. This is used for validating the content of audit logs or other logs.

5.  **Placeholders for Command Templates:**
    The following placeholders can be used in `command`, `teardown_command` strings, and `command_flags` values:
    *   `{{ identifier }}`: Replaced by a unique identifier for the test case, constructed as `{PREFIX}-{test_case_key}`. For example, if `PREFIX` is `dev` and the test case key is `my_test_instance`, `{{ identifier }}` becomes `dev-my-test-instance`.
    *   `{{ prefix }}`: Replaced by the value of the `PREFIX` environment variable.
    *   `{{ project }}`: Replaced by the value of the `PROJECT_ID` environment variable.
    *   `{{ project_number }}`: Replaced by the value of the `PROJECT_NUMBER` environment variable.
    *   `{{ random }}`: Replaced by an 8-character unique random hexadecimal string. This string is generated once per test case (i.e., per top-level key in the YAML file) and remains constant across all steps and teardown commands for that test case.

### Example (`test_cases/network/peeringChanges.yaml`) Walkthrough

This example demonstrates creating, updating, and deleting a network peering, with associated audit log checks.

```yaml
# test_cases/network/peeringChanges.yaml
shared_config:
  log_filter: >-  # Applied to all test cases in this file for log validation
    resource.type="gce_network" AND 
    (
      protoPayload.methodName:"compute.networks.insert" OR 
      protoPayload.methodName:"compute.networks.patch" OR 
      protoPayload.methodName:"compute.networks.delete" OR 
      protoPayload.methodName:"compute.networks.addPeering" OR 
      protoPayload.methodName:"compute.networks.updatePeering" OR 
      protoPayload.methodName:"compute.networks.removePeering"
    )
  default_markers: # Markers applied to all test cases below
    - network
    - network-peering

# Test Case 1: Network Peering Creation
network_peering_creation_audit_log:
  steps:
  - command: gcloud compute networks peerings create {{ identifier }} --network monitoring-alert-vpc-network
    # This step uses its own teardown_command
    teardown_command: gcloud compute networks peerings delete {{ identifier }} --network monitoring-alert-vpc-network
    command_flags: 
      # Step-specific flag
      peer-network: "monitoring-alert-vpc-network-peer"
    expected_result:
      return_code: 0 # Expect command to succeed
      # Expected attributes in the corresponding log entry
      attributes:
        'protoPayload.resourceName': "projects/{{ project }}/global/networks/monitoring-alert-vpc-network"
        'protoPayload.methodName': "v1.compute.networks.addPeering"

# Test Case 2: Network Peering Update (multi-step)
network_peering_update_audit_log:
  steps:
  # Step 1: Create the peering (prerequisite for update)
  - command: gcloud compute networks peerings create {{ identifier }} --network monitoring-alert-vpc-network
    # This teardown will run after the entire 'network_peering_update_audit_log' test case finishes
    teardown_command: gcloud compute networks peerings delete {{ identifier }} --network monitoring-alert-vpc-network
    command_flags: 
      peer-network: "monitoring-alert-vpc-network-peer"
    expected_result:
      return_code: 0
  # Step 2: Update the peering
  - command: gcloud compute networks peerings update {{ identifier }} --network monitoring-alert-vpc-network
    command_flags: 
      export-custom-routes: true # Add/override flag for this step
    expected_result:
      return_code: 0
      attributes:
        'protoPayload.resourceName': "projects/{{ project }}/global/networks/monitoring-alert-vpc-network"
        'protoPayload.methodName': "v1.compute.networks.updatePeering"

# Test Case 3: Network Peering Deletion
network_peering_delete_audit_log:
  steps:
  # Step 1: Create the peering (prerequisite for delete)
  - command: gcloud compute networks peerings create {{ identifier }} --network monitoring-alert-vpc-network
    command_flags: 
      peer-network: "monitoring-alert-vpc-network-peer"
    expected_result:
      return_code: 0
  # Step 2: Delete the peering
  - command: gcloud compute networks peerings delete {{ identifier }} --network monitoring-alert-vpc-network
    expected_result:
      return_code: 0
      attributes:
        'protoPayload.resourceName': "projects/{{ project }}/global/networks/monitoring-alert-vpc-network"
        'protoPayload.methodName': "v1.compute.networks.removePeering"
```


## How to run Tests Cases? ##

Ensure you are in the project's root directory, have activated your virtual environment, and have set the PROJECT_ID, PROJECT_NUMBER, and PREFIX environment variables.

The primary test file containing the test execution logic (which pytest_generate_tests parametrizes) is assumed to be main.py in this example. Adjust if your test functions are elsewhere.

### Run all tests: ### 
```bash
pytest main.py
```


### Run tests with specific markers ###
Markers can be defined in shared_config.default_markers or a test case's markers list. Available markers are also often listed in pytest.ini.

```bash
pytest main.py -m network-peering # Run tests marked with 'network-peering'
```

### Run specific test cases by name (keyword matching) ###
This matches against the test case key from the YAML file (e.g., network_peering_creation_audit_log).

```bash
pytest main.py -k network_peering_creation_audit_log # Run a specific test
pytest main.py -k "network_peering" # Run tests with 'network_peering' in their name
```

### Generate an HTML Report ###
The pytest.ini is configured to produce an HTML report.This creates a report.html file in the current directory.

### Important Notes on Teardown ###
- **Test Case Teardown:** For each test case defined in a YAML file, any teardown_command (either specified in a step or inherited from shared_config.teardown_command) is executed after that specific test case (all its steps) completes. This happens for each step that has an applicable teardown command. This ensures cleanup for resources created during the test case.
- **Global Teardown:** Commands in fixture.yaml under after_tests are executed once after all test cases in the entire test session have finished.
