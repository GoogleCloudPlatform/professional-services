# E2E Test Infra: Cloud Logging at Scale to BigQuery via Pub/Sub SMT

## Test Philosophy
- Requirement-driven, opaque-box testing derived strictly from `ORIGINAL_REQUEST.md` and `PROJECT.md` specifications.
- Complete independence from internal implementation details: exercises the Python CLI (`cli/log_pipeline_tool.py`) and JavaScript SMT UDF (`udf/process_cloud_logs.js`) via isolated OS subprocesses (`python3` and `node`), inspecting standard output, standard error, exit codes, and file artifacts exactly as an external operator or Pub/Sub BigQuery subscription would.
- 100% offline execution without requiring live Google Cloud Platform credentials, active Pub/Sub topics, or network connectivity.
- Methodology: Systematic 4-tier design (Category-Partition, Boundary Value Analysis, Pairwise Combinatorial Integration, Real-World Enterprise Workload Testing) + Tier 5 White-Box Adversarial Coverage Hardening.

## Feature Inventory & Test Matrix
| # | Feature Area / Component | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|:------:|:------:|:------:|
| 1 | De-Identification & Enterprise PSO Documentation (`README.md`) | R1.1–R1.4 | 5 | 5 | ✓ |
| 2 | Turnkey Terraform IaC & 20-Column BigQuery Schema (`terraform/`) | R2.1–R2.6 | 5 | 5 | ✓ |
| 3 | Hardened Inline JavaScript SMT UDF (`udf/process_cloud_logs.js`) | R3.1 | 5 | 5 | ✓ |
| 4 | Python Operational CLI (`cli/log_pipeline_tool.py`) | R3.2 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner**: `pytest` executed in 100% offline mode (`/usr/local/google/home/kasin/.gemini/jetski/scratch/oss_footprint_plan/.venv/bin/pytest tests/e2e/ tests/test_tier5_adversarial.py -v`).
- **Pass/Fail Semantics**: Exit code 0, 100% test pass rate with zero skips, PEP 8 compliance (`flake8` and `black --check`), Python AST compilation verification across all `.py` files, and strict Google Apache 2.0 header presence across all source files.
- **Directory Layout**:
  ```
  tests/
  ├── __init__.py
  ├── test_smt_udf.py                 # Unit tests for JS SMT UDF
  ├── test_schema_compatibility.py    # Unit tests for BigQuery schema compatibility
  ├── test_cli_tool.py                # Unit tests for CLI subcommands
  ├── test_tier5_adversarial.py       # Tier 5 white-box adversarial & stress test suite
  └── e2e/
      ├── __init__.py
      └── test_e2e_pipeline.py        # Opaque-box requirement-driven E2E suite (Tiers 1–4)
  ```

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|---|---|---|
| 1 | Enterprise FinOps Cloud Logging Audit (100 GB/day, 365-day retention, 80% `_Default` exclusion) | F02, F04, F15 | High |
| 2 | High-Scale Multi-Service Telemetry Batch (GKE Container + Cloud Load Balancer `httpRequest` + Cloud Audit `protoPayload` + Corrupted Syslog) | F06, F12, F13, F14 | Very High |
| 3 | End-to-End Malformed Log Storm Recovery & Auto-Repair Replay Pipeline | F08, F12, F13, F14 | Very High |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: >= 20 test cases (>= 5 per feature area across Documentation, Terraform/Schema, JS SMT UDF, and Python CLI).
- **Tier 2 (Boundary & Corner Cases)**: >= 20 test cases (>= 5 per feature area covering empty payloads, 5+ level deep nesting, null/primitive roots, pre-stringified JSON strings, missing attributes, and invalid CLI numerical boundaries).
- **Tier 3 (Cross-Feature Combinations)**: >= 4 comprehensive end-to-end pairwise pipeline chains (CLI Generation -> JS SMT Transformation -> BigQuery Schema Validation -> DLQ Inspection & Auto-Repair Replay -> Re-ingestion Conformance).
- **Tier 4 (Real-World Application Scenarios)**: >= 3 enterprise FinOps and multi-service SecOps telemetry workloads.
- **Tier 5 (White-Box Adversarial Hardening)**: >= 10 stress and security tests (Unicode/emoji/zero-width/control characters, 10,000-key massive JSON objects, prototype pollution payloads `__proto__`/`constructor`, circular/escaped string patterns, AST compilation, and Apache 2.0 license header audits).
- **Total Minimum E2E & Adversarial Test Count**: >= 55 test cases across `tests/e2e/test_e2e_pipeline.py` and `tests/test_tier5_adversarial.py`.
