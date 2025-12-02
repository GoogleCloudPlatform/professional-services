# GCP Custom SHA Module Testing Framework

This framework provides an automated way to test GCP Custom Security Health Analytics (SHA) modules.

## Prerequisites

- Python 3.7+
- `gcloud` CLI installed and authenticated
- The target GCP project must have the Security Command Center API (`security-command-center.googleapis.com`) enabled.

## Setup

1. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

## Test Case Structure

Tests are defined in `.yaml` files located under the `tests/test_cases/` directory. Each service (e.g., `cloudkms`) should have its own subdirectory.

### YAML Test File Structure

A test YAML file defines a set of tests for a specific SHA module. Here is an example structure:

```yaml
# tests/test_cases/cloudkms/cloudkmsAllowedRotationPeriod/cryptokey.yaml
shared_config:
  name: cloudkmsAllowedRotationPeriod
  default_markers:
    - cloudkms

# Test case 1: Allowed retention period
allowed_rotation_period:
  asset_data: asset_allowed_retention_period.yaml
  expected_violation: {}

# Test case 2: Unallowed retention period
unallowed_rotation_period:
  asset_data: asset_unallowed_retention_period.yaml
  expected_violation:
    state: "ACTIVE"
    # other finding attributes...
```

**`shared_config`:**
- `name`: The name of the SHA module to be tested. This corresponds to the module definition file in `samples/gcloud/<service>/<name>.yaml`.
- `default_markers`: A list of pytest markers to be applied to all tests in this file. This is useful for grouping tests (e.g., by service).

**Test Cases:**
- Each top-level key after `shared_config` defines a new test case.
- `asset_data`: The name of the YAML file containing the asset data for the test. This file should be located in the same directory than the test file.
- `expected_violation`:
    - If empty (`{}`), the test expects **no violation**.
    - If populated, the test expects a finding with attributes matching the specified key-value pairs.

### Asset Data Files

Asset data files (e.g., `asset_allowed_retention_period.yaml`) contain the GCP asset data used as input for the `gcloud scc manage custom-modules sha simulate` command. They should be placed in a directory structure like `tests/test_cases/<service>/<module_name>/`.

## Running Tests

You can run tests using `pytest` from the `tests` directory.

### Run All Tests

To run all discovered tests:
```bash
pytest main.py
```

### Filtering by Marker

You can run specific groups of tests using markers defined in the `default_markers` section of your test files. Use the `-m` flag.

```bash
# Run all tests marked with 'cloudkms'
pytest main.py -m cloudkms
```

### Filtering by Keyword

Pytest also allows you to run tests with names that match a specific keyword expression using the `-k` flag. The test names are generated as `<module_name>-<test_case_name>`.

```bash
# Run the 'cloudkms_key_rotation_period_allowed' tes
pytest main.py -k cloudkms_key_rotation_period_allowed
```

### Test Reports

An HTML report of the test results will be generated at `report.html`.