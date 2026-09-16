# Project: Cloud Logging at Scale to BigQuery via Pub/Sub SMT (`examples/cloud-logging-pubsub-bigquery-smt`)

## Architecture
The solution implements a high-volume, cost-optimized serverless log analytics pipeline on Google Cloud Platform:
1. **Log Ingestion & FinOps Filtering**: Cloud Logging Log Router applies an Inclusion Filter (`severity >= INFO` by default) via a Project Sink (`cloud-logging-pubsub-log-sink`) to export logs to a Pub/Sub Ingestion Topic (`cloud-logs-ingestion-topic`), paired with an optional Log Exclusion Filter (`exclude-routed-logs-from-default`) that bypasses `_Default` log bucket storage ($0.50/GB savings).
2. **Serverless Stream Transformation (Inline SMT)**: A Pub/Sub BigQuery Subscription (`cloud-logs-bq-sub`) executes an inline JavaScript Single Message Transform (SMT) UDF (`udf/process_cloud_logs.js :: processCloudLogs(message, metadata)`). The UDF intercepts `LogEntry` payloads, safely stringifies polymorphic nested JSON objects (`jsonPayload`, `protoPayload`, `labels`, `resource.labels`) into JSON strings to prevent BigQuery schema drift while preserving top-level structured `RECORD`/`STRUCT` fields (`httpRequest`, `operation`, `sourceLocation`, `resource.type`).
3. **Storage & Partitioning**: Transformed messages stream directly into BigQuery table `unified_cloud_logs` (`use_table_schema = true`, `write_metadata = true`, `drop_unknown_fields = false`), partitioned by `DATE(timestamp)` (`DAY`) and clustered by `logName, severity`.
4. **Resilience & DLQ Replay**: Failed transforms or schema rejections capture diagnostic metadata in `message.attributes["udf_error"]`. After `max_delivery_attempts = 5`, messages route to Dead-Letter Topic `cloud-logs-dlq-topic` and Pull Subscription `cloud-logs-dlq-sub`. A standalone Python CLI (`cli/log_pipeline_tool.py`) provides synthetic log generation (`generate-logs`), DLQ inspection (`inspect-dlq`), automated payload repair/replay (`replay-dlq`), and FinOps ROI modeling (`analyze-savings`).

## Code Layout
All project deliverables reside in `/usr/local/google/home/kasin/.gemini/jetski/scratch/oss_footprint_plan/targets/04_gcp_cloud_logging_pubsub_bq` and are staged cleanly into `/usr/local/google/home/kasin/.gemini/jetski/scratch/oss_footprint_plan/.staging/gcp-pso/examples/cloud-logging-pubsub-bigquery-smt` on branch `feat/cloud-logging-pubsub-bigquery-smt` (forked from `main`):

```
04_gcp_cloud_logging_pubsub_bq/
├── PROJECT.md                          # Global project index & architecture specification
├── README.md                           # Enterprise PSO documentation, Mermaid diagrams, Bates-stamped wrapper
├── PR_TEMPLATE.md                      # Ready-to-submit GitHub PR description & 1-click compare URL
├── DEPLOYMENT_REPORT.md                # Comprehensive verification & deployment report
├── TEST_INFRA.md                       # E2E test infrastructure specification
├── TEST_READY.md                       # E2E test suite readiness & tier coverage summary
├── udf/
│   └── process_cloud_logs.js           # Hardened JS SMT UDF with Node.js export & Apache 2.0 header
├── terraform/
│   ├── versions.tf                     # Terraform >= 1.3.0, google provider >= 5.20.0
│   ├── variables.tf                    # Parameterized project_id, region, dataset_id, filters
│   ├── main.tf                         # BQ dataset/table, Pub/Sub topics/subs, SMT, Sink/Exclusion, IAM, Alerts
│   ├── outputs.tf                      # Exported resource identifiers
│   └── schema.json                     # 20-column BigQuery schema (4 metadata + 16 LogEntry fields, 44 total subfields)
├── cli/
│   ├── __init__.py
│   └── log_pipeline_tool.py            # Python CLI (generate-logs, inspect-dlq, replay-dlq, analyze-savings)
└── tests/
    ├── __init__.py
    ├── test_smt_udf.py                 # Offline Node.js subprocess test suite (>= 10 payload edge cases)
    ├── test_schema_compatibility.py    # Schema conformance tests against terraform/schema.json
    ├── test_cli_tool.py                # Unit tests for all 4 CLI subcommands & financial formulas
    ├── test_tier5_adversarial.py       # Tier 5 white-box adversarial stress tests
    └── e2e/
        ├── __init__.py
        └── test_e2e_pipeline.py        # Opaque-box E2E test suite (Tiers 1-4)
```

## Feature Inventory
Every feature from the Survey phase is assigned to a specific milestone below:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | De-Identified Enterprise PSO `README.md` | Complete PSO documentation with zero occurrences of legacy client acronym, legacy demo project, or legacy region; excludes `screenshot01.png` | M1 | survey |
| F2 | FinOps Cost Optimization Rationale | Narrative explaining Log Exclusion ($0.50/GB saved) + Export Sink + zero-compute Pub/Sub SMT vs Dataflow workers | M1 | survey |
| F3 | Mermaid Architecture & Sequence Diagrams | Two Mermaid diagrams (System Architecture flowchart + End-to-End Message & DLQ Sequence diagram) | M1 | survey |
| F4 | Operational Monitoring & Cost Metrics | Documentation & MQL/PromQL queries for `bytes_ingested`, `byte_count`, `num_undelivered_messages`, `message_transform_latencies` | M1 | survey |
| F5 | BigQuery Dataset & Partitioned/Clustered Table | Terraform `google_bigquery_dataset` & `google_bigquery_table` (`unified_cloud_logs`), `DAY` partition on `timestamp`, cluster by `logName, severity` | M1 | survey |
| F6 | BigQuery 20-Column Native JSON/STRUCT Schema | `terraform/schema.json` with 20 top-level columns (4 metadata + 16 LogEntry fields, 44 total fields including nested `RECORD` subfields) | M1 | survey |
| F7 | Pub/Sub Topics & DLQ Pull Subscription | `cloud-logs-ingestion-topic`, `cloud-logs-dlq-topic`, and `cloud-logs-dlq-sub` in `terraform/main.tf` | M1 | survey |
| F8 | Pub/Sub BigQuery Subscription with Inline SMT | `cloud-logs-bq-sub` with `use_table_schema=true`, `write_metadata=true`, `drop_unknown_fields=false`, `max_delivery_attempts=5`, `message_transforms` loading `udf/process_cloud_logs.js` | M1 | survey |
| F9 | Log Router Sink & Exclusion Filter | `google_logging_project_sink` (`cloud-logging-pubsub-log-sink`) and conditional `google_logging_project_exclusion` (`exclude-routed-logs-from-default`) | M1 | survey |
| F10 | Least-Privilege Pipeline IAM Bindings | Scoped IAM bindings for Log Sink writer identity and Pub/Sub service agent (`service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com`) | M1 | survey |
| F11 | Cloud Monitoring Alert Policies | Two `google_monitoring_alert_policy` resources for DLQ undelivered messages (>0) and high UDF latency (>500ms) | M1 | survey |
| F12 | Hardened Inline JavaScript SMT UDF | `udf/process_cloud_logs.js` (`processCloudLogs`) stringifying dynamic object fields, rejecting non-object roots, populating `attributes["udf_error"]`, and supporting Node.js export | M1 | survey |
| F13 | Synthetic Log Generator CLI | `cli/log_pipeline_tool.py generate-logs` supporting `local`, `pubsub`, `logging` modes and `json`, `proto`, `http`, `malformed`, `mixed` payloads | M2 | survey |
| F14 | DLQ Inspector & Replayer CLI | `cli/log_pipeline_tool.py inspect-dlq` & `replay-dlq` supporting offline `--mock-file`, `udf_error` diagnostics, and `--auto-repair` | M2 | survey |
| F15 | FinOps Cost Savings Calculator CLI | `cli/log_pipeline_tool.py analyze-savings` computing monthly/annual baseline vs optimized costs across daily GB and retention days | M2 | survey |
| F16 | SMT JS UDF Offline Unit Test Suite | `tests/test_smt_udf.py` executing `udf/process_cloud_logs.js` via Node.js subprocess across >= 10 distinct payload edge cases | M2 | survey |
| F17 | Schema Compatibility Test Suite | `tests/test_schema_compatibility.py` verifying UDF output types against `terraform/schema.json` | M2 | survey |
| F18 | CLI & Financial Calculator Test Suite | `tests/test_cli_tool.py` testing all CLI subcommands, mock DLQ workflows, and savings math | M2 | survey |
| F19 | Opaque-Box Requirement-Driven E2E Suite | `TEST_INFRA.md`, `tests/e2e/test_e2e_pipeline.py` (Tiers 1-4 with >= 5 tests/feature), and `TEST_READY.md` | E2E | survey |
| F20 | Final Milestone E2E & Tier 5 Hardening | Phase 1: 100% pass on Tiers 1-4 E2E suite. Phase 2: Tier 5 white-box adversarial coverage hardening (`tests/test_tier5_adversarial.py`) | M3 | survey |
| F21 | Upstream Git Staging & Linter Compliance | Branch `feat/cloud-logging-pubsub-bigquery-smt` from `main` in `.staging/gcp-pso`, Apache 2.0 headers, root `README.md` & `helpers/exclusion_list.txt`, `flake8`/`black`, `terraform fmt`/`validate` | M3 | survey |
| F22 | PR Package & Subclass 858 Exhibit Update | `PR_TEMPLATE.md`, `DEPLOYMENT_REPORT.md`, Bates-stamped `README.md` (`B03.051`), and update to `evidences/EXHIBIT_B03_OPEN_SOURCE_PORTFOLIO.md` | M3 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Core Pipeline, JS UDF, Terraform IaC & Docs | F1–F12: Author `udf/process_cloud_logs.js`, `terraform/*` (`versions.tf`, `variables.tf`, `main.tf`, `outputs.tf`, `schema.json`), `README.md`, and mirror `PROJECT.md` to root. Verify `terraform fmt -check` & `terraform validate`. | none | IN_PROGRESS |
| E2E | Opaque-Box E2E Test Track | F19: Author `TEST_INFRA.md`, create opaque-box E2E test suite (`tests/e2e/test_e2e_pipeline.py`) covering Tiers 1–4 across all pipeline features, and publish `TEST_READY.md`. | none | IN_PROGRESS |
| M2 | Operational Python CLI & Unit Test Suite | F13–F18: Author `cli/log_pipeline_tool.py` and offline `pytest` unit test suite (`tests/test_smt_udf.py`, `tests/test_schema_compatibility.py`, `tests/test_cli_tool.py`). Verify `flake8`, `black`, and 100% `pytest` pass. | M1 | PLANNED |
| M3 | Upstream Git Staging, PR/Exhibit Package & Final E2E/Tier 5 | F20–F22: Execute Final Milestone Phase 1 (100% E2E pass) & Phase 2 (Tier 5 adversarial tests `tests/test_tier5_adversarial.py`), stage into `.staging/gcp-pso` branch `feat/cloud-logging-pubsub-bigquery-smt` (from `main`), author `PR_TEMPLATE.md`, `DEPLOYMENT_REPORT.md`, and update `evidences/EXHIBIT_B03_OPEN_SOURCE_PORTFOLIO.md`. | M1, M2, E2E | PLANNED |

## Interface Contracts

### 1. `udf/process_cloud_logs.js` ↔ `terraform/main.tf` & `tests/test_smt_udf.py`
- **File Path**: `udf/process_cloud_logs.js`
- **Function Signature**: `function processCloudLogs(message, metadata)`
- **Input Contract**:
  - `message`: Object `{ data: string, attributes?: Object<string, string> }` where `data` is a UTF-8 JSON string representing a Cloud Logging `LogEntry` (when called by Pub/Sub SMT, `message.data` is a string).
  - `metadata`: Optional Pub/Sub metadata object.
- **Transformation Behavior**:
  - Parses `message.data` as JSON. If the parsed root value is null, primitive, or an Array (`!data || typeof data !== 'object' || Array.isArray(data)`), throws an `Error("Root log payload must be a non-null JSON object")`.
  - Stringifies object fields (`typeof val === 'object' && val !== null`):
    - `data.jsonPayload` -> JSON string
    - `data.protoPayload` -> JSON string
    - `data.labels` -> JSON string
    - `data.resource.labels` -> JSON string (if `data.resource` is an object)
  - Preserves all other fields intact (`insertId`, `logName`, `timestamp`, `receiveTimestamp`, `severity`, `textPayload`, `httpRequest`, `operation`, `trace`, `spanId`, `traceSampled`, `sourceLocation`, `resource.type`).
  - Re-serializes `message.data = JSON.stringify(data)` and returns `message`.
- **Error Handling Contract**:
  - On any exception (`SyntaxError` or validation `Error`), catches the error, initializes `message.attributes = message.attributes || {}`, sets `message.attributes["udf_error"] = error.message || error.toString()`, leaves `message.data` as the original input string, and returns `message`.
- **Node.js Export**:
  - Ends with `if (typeof module !== 'undefined' && module.exports) { module.exports = { processCloudLogs }; }` so Python tests can require/invoke it via Node.js.

### 2. `terraform/schema.json` ↔ `udf/process_cloud_logs.js` & `tests/test_schema_compatibility.py`
- **File Path**: `terraform/schema.json`
- **Schema Structure**: JSON array of 20 top-level BigQuery column definitions (4 Pub/Sub metadata columns: `subscription_name`, `message_id`, `publish_time`, `attributes`; 16 Cloud Logging `LogEntry` columns: `insertId`, `logName`, `timestamp`, `receiveTimestamp`, `severity`, `textPayload`, `jsonPayload`, `protoPayload`, `resource`, `labels`, `httpRequest`, `operation`, `trace`, `spanId`, `traceSampled`, `sourceLocation`).
- **Type Contract**:
  - `attributes`, `jsonPayload`, `protoPayload`, `labels`, `resource.labels` MUST have `"type": "JSON"`.
  - `resource`, `httpRequest`, `operation`, `sourceLocation` MUST have `"type": "RECORD"` with explicit `"fields"` arrays.
  - All columns MUST specify `"mode": "NULLABLE"`.

### 3. `cli/log_pipeline_tool.py` ↔ `tests/test_cli_tool.py` & E2E Tests
- **File Path**: `cli/log_pipeline_tool.py`
- **CLI Entrypoint**: Executable via `python3 cli/log_pipeline_tool.py <subcommand> [options]`
- **Subcommands**:
  1. `generate-logs`: `--count INT`, `--payload-type {json,proto,http,malformed,mixed}`, `--mode {local,pubsub,logging}`, `--output-file PATH`, `--project STR`, `--topic STR`. Outputs valid newline-delimited JSON strings (or raw malformed strings when `--payload-type malformed`).
  2. `inspect-dlq`: `--mock-file PATH`, `--project STR`, `--subscription STR`, `--max-messages INT`, `--format {table,json}`. Reads failed messages (each JSON object having `data` and `attributes.udf_error`), outputs diagnostic summary.
  3. `replay-dlq`: `--mock-file PATH`, `--output-file PATH`, `--auto-repair`, `--project STR`, `--subscription STR`, `--topic STR`. When `--auto-repair` is set, wraps non-JSON or non-object `data` into `{"textPayload": <raw_string>, "severity": "WARNING"}`, removes `attributes["udf_error"]`, and writes/publishes repaired messages. Returns JSON/text summary of repaired count.
  4. `analyze-savings`: `--daily-gb FLOAT`, `--retention-days INT`, `--default-exclusion-pct FLOAT`, `--format {table,json}`. Validates `daily_gb > 0` and `retention_days >= 1` (exits with code 2 on invalid input). Returns JSON/table with `monthly_volume_gb`, `baseline_monthly_cost_usd`, `optimized_monthly_cost_usd`, `monthly_savings_usd`, `annual_savings_usd`, and `savings_percentage`.
