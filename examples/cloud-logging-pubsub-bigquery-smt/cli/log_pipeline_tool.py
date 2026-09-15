# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""CLI utility for Cloud Logging to BigQuery via Pub/Sub SMT pipeline.

Provides four subcommands:
  - generate-logs: Emits synthetic Cloud Logging payloads (json, proto,
    http, malformed, mixed) locally or to GCP Pub/Sub / Cloud Logging.
  - inspect-dlq: Pulls or reads dead-lettered messages from DLQ subscription
    or mock file and displays diagnostic udf_error summaries.
  - replay-dlq: Repairs failed DLQ messages (wrapping corrupted payloads into
    structured textPayload entries with WARNING severity and stripping
    udf_error) and replays them to the ingestion topic or local output file.
  - analyze-savings: Computes monthly/annual Cloud Logging FinOps cost savings
    comparing _Default bucket ingestion against Pub/Sub SMT + BigQuery storage.
"""

import argparse
import datetime
import json
import sys
import uuid
from typing import Any, Dict, List, Optional


def _utc_now_iso() -> str:
    """Returns current UTC timestamp in RFC3339 / ISO8601 format."""
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    return now_utc.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def build_synthetic_log_entry(
    index: int,
    payload_type: str,
    project_id: str = "parameterized-project",
) -> str:
    """Constructs a single synthetic Cloud Logging entry or malformed payload.

    Args:
        index: Sequence index of the generated log message.
        payload_type: One of 'json', 'proto', 'http', 'malformed', or 'mixed'.
        project_id: Parameterized GCP project identifier.

    Returns:
        A string containing either a valid JSON serialized LogEntry or a
        corrupted raw string (when payload_type resolves to 'malformed').
    """
    if payload_type == "mixed":
        valid_types = ["json", "proto", "http"]
        effective_type = valid_types[index % len(valid_types)]
    else:
        effective_type = payload_type

    if effective_type == "malformed":
        prefix = f"CORRUPTED_RAW_SYSLOG_STREAM_{index}_"
        malformed_samples = [
            prefix + "{unterminated_json_payload",
            '["invalid_root_array_payload_not_a_json_object"]',
            "42",
        ]
        return malformed_samples[index % len(malformed_samples)]

    now_ts = _utc_now_iso()
    trace_id = uuid.uuid4().hex
    span_id = uuid.uuid4().hex[:16]
    producer_url = "github.com/GoogleCloudPlatform/professional-services"

    base_entry: Dict[str, Any] = {
        "insertId": f"synth-log-{index}-{uuid.uuid4().hex[:8]}",
        "logName": f"projects/{project_id}/logs/enterprise-app-telemetry",
        "timestamp": now_ts,
        "receiveTimestamp": now_ts,
        "severity": ["INFO", "WARNING", "ERROR"][index % 3],
        "resource": {
            "type": "k8s_container",
            "labels": {
                "project_id": project_id,
                "location": "us-central1",
                "cluster_name": "prod-analytics-cluster",
                "namespace_name": "telemetry-ingestion",
                "pod_name": f"log-router-pod-{index % 5}",
                "container_name": "app-service",
            },
        },
        "labels": {
            "environment": "production",
            "cost_center": "finops-core",
            "service_tier": "tier-1",
            "sequence_id": str(index),
        },
        "operation": {
            "id": f"op-{uuid.uuid4().hex[:12]}",
            "producer": producer_url,
            "first": index == 0,
            "last": False,
        },
        "trace": f"projects/{project_id}/traces/{trace_id}",
        "spanId": span_id,
        "traceSampled": True,
        "sourceLocation": {
            "file": "services/telemetry/handler.py",
            "line": 142 + (index % 50),
            "function": "process_telemetry_event",
        },
    }

    if effective_type == "json":
        base_entry["jsonPayload"] = {
            "event": "user_transaction_processed",
            "transaction_id": f"txn-{uuid.uuid4().hex[:10]}",
            "latency_ms": 18.4 + (index * 1.5),
            "metadata": {
                "region": "us-central1",
                "retry_count": index % 3,
                "tags": ["audit", "compliance", "finops"],
            },
        }
    elif effective_type == "proto":
        sa_email = f"sa-analytics@{project_id}.iam.gserviceaccount.com"
        base_entry["protoPayload"] = {
            "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
            "serviceName": "bigquery.googleapis.com",
            "methodName": "google.cloud.bigquery.v2.JobService.InsertJob",
            "authenticationInfo": {"principalEmail": sa_email},
            "requestMetadata": {
                "callerIp": "198.51.100.42",
                "callerSuppliedUserAgent": "gcloud-python/1.0",
            },
        }
    elif effective_type == "http":
        ua_str = "Mozilla/5.0 (compatible; GoogleCloud-TelemetryAgent/2.0)"
        base_entry["httpRequest"] = {
            "requestMethod": "POST",
            "requestUrl": "https://api.example.com/v1/telemetry/ingest",
            "requestSize": 2048 + index * 64,
            "status": 200 if index % 5 != 4 else 503,
            "responseSize": 512,
            "userAgent": ua_str,
            "remoteIp": "203.0.113.15",
            "serverIp": "10.128.0.45",
            "referer": "https://console.example.com/dashboard",
            "latency": f"0.{110 + (index % 80):03d}s",
            "cacheLookup": True,
            "cacheHit": index % 2 == 0,
            "cacheValidatedWithOriginServer": True,
            "cacheFillBytes": 1024,
            "protocol": "HTTP/2",
        }
        base_entry["jsonPayload"] = {
            "http_handler": "ingress_gateway",
            "upstream_status": "healthy",
        }

    return json.dumps(base_entry)


def handle_generate_logs(args: argparse.Namespace) -> int:
    """Executes the generate-logs subcommand."""
    if args.count < 1:
        print("Error: --count must be >= 1", file=sys.stderr)
        return 2

    project_id = args.project or "parameterized-project"
    lines: List[str] = []
    for i in range(args.count):
        entry = build_synthetic_log_entry(i, args.payload_type, project_id)
        lines.append(entry)

    if args.mode == "local":
        output_text = "\n".join(lines) + "\n"
        if args.output_file:
            with open(args.output_file, "w", encoding="utf-8") as f:
                f.write(output_text)
            print(
                f"Generated {len(lines)} entries to {args.output_file}",
                file=sys.stderr,
            )
        else:
            sys.stdout.write(output_text)
        return 0

    if args.mode == "pubsub":
        try:
            from google.cloud import pubsub_v1  # type: ignore

            publisher = pubsub_v1.PublisherClient()
            topic_path = publisher.topic_path(project_id, args.topic)
            for line in lines:
                data_bytes = line.encode("utf-8")
                future = publisher.publish(topic_path, data=data_bytes)
                future.result()
            print(f"Published {len(lines)} messages to {topic_path}")
            return 0
        except Exception as exc:
            print(
                f"Error publishing to Pub/Sub ({args.topic}): {exc}",
                file=sys.stderr,
            )
            return 1

    if args.mode == "logging":
        try:
            from google.cloud import logging as cloud_logging  # type: ignore

            client = cloud_logging.Client(project=project_id)
            logger = client.logger("enterprise-app-telemetry")
            for line in lines:
                try:
                    parsed = json.loads(line)
                    logger.log_struct(parsed)
                except ValueError:
                    logger.log_text(line)
            print(f"Wrote {len(lines)} log entries to Cloud Logging")
            return 0
        except Exception as exc:
            print(
                f"Error writing to Cloud Logging API: {exc}",
                file=sys.stderr,
            )
            return 1

    return 0


def _load_dlq_messages_from_mock(
    mock_file: str, max_messages: int
) -> List[Dict[str, Any]]:
    """Loads failed Pub/Sub messages from a JSON or JSONL mock file."""
    with open(mock_file, "r", encoding="utf-8") as f:
        raw_content = f.read().strip()

    if not raw_content:
        return []

    messages: List[Dict[str, Any]] = []
    try:
        parsed = json.loads(raw_content)
        if isinstance(parsed, list):
            raw_list = parsed
        elif isinstance(parsed, dict) and "messages" in parsed:
            raw_list = parsed["messages"]
        else:
            raw_list = [parsed]
    except json.JSONDecodeError:
        raw_list = []
        for line in raw_content.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                raw_list.append(json.loads(line))
            except json.JSONDecodeError:
                err_str = "SyntaxError: Malformed raw line in mock file"
                raw_list.append(
                    {
                        "data": line,
                        "attributes": {"udf_error": err_str},
                    }
                )

    for idx, item in enumerate(raw_list[:max_messages]):
        if isinstance(item, dict):
            data_str = item.get("data", "")
            if not isinstance(data_str, str):
                data_str = json.dumps(data_str)
            attrs = item.get("attributes") or {}
            udf_err = (
                attrs.get("udf_error")
                or item.get("udf_error")
                or "Unknown schema or UDF error"
            )
            msg_id = item.get("message_id", f"dlq-msg-{idx}")
            pub_time = item.get("publish_time", _utc_now_iso())
            messages.append(
                {
                    "message_id": msg_id,
                    "publish_time": pub_time,
                    "data": data_str,
                    "udf_error": udf_err,
                    "attributes": {**attrs, "udf_error": udf_err},
                }
            )
        else:
            err_msg = "Invalid non-object DLQ message format"
            messages.append(
                {
                    "message_id": f"dlq-msg-{idx}",
                    "publish_time": _utc_now_iso(),
                    "data": str(item),
                    "udf_error": err_msg,
                    "attributes": {"udf_error": err_msg},
                }
            )

    return messages


def handle_inspect_dlq(args: argparse.Namespace) -> int:
    """Executes the inspect-dlq subcommand."""
    messages: List[Dict[str, Any]] = []
    if args.mock_file:
        max_m = args.max_messages
        messages = _load_dlq_messages_from_mock(args.mock_file, max_m)
    else:
        try:
            from google.cloud import pubsub_v1  # type: ignore

            project_id = args.project or "parameterized-project"
            subscriber = pubsub_v1.SubscriberClient()
            sub_name = args.subscription
            sub_path = subscriber.subscription_path(project_id, sub_name)
            pull_req = {
                "subscription": sub_path,
                "max_messages": args.max_messages,
            }
            response = subscriber.pull(request=pull_req)
            for idx, received in enumerate(response.received_messages):
                msg = received.message
                attrs = dict(msg.attributes) if msg.attributes else {}
                default_err = "Delivery failure / schema mismatch"
                udf_err = attrs.get("udf_error", default_err)
                messages.append(
                    {
                        "message_id": msg.message_id or f"dlq-live-{idx}",
                        "publish_time": str(msg.publish_time),
                        "data": msg.data.decode("utf-8", errors="replace"),
                        "udf_error": udf_err,
                        "attributes": attrs,
                    }
                )
        except Exception as exc:
            print(
                f"Error pulling from DLQ ({args.subscription}): {exc}",
                file=sys.stderr,
            )
            return 1

    if args.format == "json":
        print(json.dumps(messages, indent=2))
    else:
        print("=" * 78)
        print(f"DLQ Inspection Report | Subscription: {args.subscription}")
        print(f"Total DLQ messages inspected: {len(messages)}")
        print("-" * 78)
        for msg in messages:
            preview = msg["data"][:50].replace("\n", " ")
            print(
                f"[{msg['message_id']}] Error: {msg['udf_error']} | "
                f"Payload: {preview}"
            )
        print("=" * 78)

    return 0


def repair_dlq_message(
    msg: Dict[str, Any],
    auto_repair: bool = True,
    project_id: str = "parameterized-project",
) -> Dict[str, Any]:
    """Repairs a dead-lettered message envelope for clean re-ingestion.

    When auto_repair is True, wraps non-JSON or non-object payloads into a
    valid Cloud Logging LogEntry structure with textPayload and WARNING
    severity, and strips the udf_error attribute.

    Args:
        msg: Dictionary representing the DLQ message envelope.
        auto_repair: Whether to auto-wrap corrupted payloads into LogEntries.
        project_id: Parameterized GCP project ID.

    Returns:
        A dictionary containing both the clean Pub/Sub envelope ("data",
        "attributes") and top-level LogEntry fields for schema validation.
    """
    raw_data = msg.get("data", "")
    raw_attrs = msg.get("attributes") or {}
    clean_attrs = {k: v for k, v in raw_attrs.items() if k != "udf_error"}

    now_ts = _utc_now_iso()
    repaired_entry: Optional[Dict[str, Any]] = None

    if isinstance(raw_data, str):
        try:
            parsed = json.loads(raw_data)
            if isinstance(parsed, dict):
                if (
                    "data" in parsed
                    and isinstance(parsed["data"], str)
                    and "severity" not in parsed
                ):
                    try:
                        inner = json.loads(parsed["data"])
                        if isinstance(inner, dict):
                            parsed = inner
                    except ValueError:
                        pass
                log_keys = ("severity", "textPayload", "jsonPayload")
                has_log_keys = any(k in parsed for k in log_keys)
                if isinstance(parsed, dict) and has_log_keys:
                    repaired_entry = parsed
        except ValueError:
            repaired_entry = None

    if repaired_entry is None:
        if auto_repair:
            repaired_entry = {
                "insertId": f"repaired-{uuid.uuid4().hex[:10]}",
                "logName": f"projects/{project_id}/logs/dlq-replayed",
                "timestamp": now_ts,
                "receiveTimestamp": now_ts,
                "severity": "WARNING",
                "textPayload": str(raw_data),
                "labels": {"repaired_from_dlq": "true"},
                "resource": {
                    "type": "global",
                    "labels": {"project_id": project_id},
                },
            }
        else:
            return {
                "data": str(raw_data),
                "attributes": clean_attrs,
            }

    default_id = f"repaired-{uuid.uuid4().hex[:10]}"
    default_log = f"projects/{project_id}/logs/dlq-replayed"
    repaired_entry.setdefault("insertId", default_id)
    repaired_entry.setdefault("logName", default_log)
    repaired_entry.setdefault("timestamp", now_ts)
    repaired_entry.setdefault("receiveTimestamp", now_ts)
    repaired_entry.setdefault("severity", "WARNING")
    payload_keys = ("textPayload", "jsonPayload", "protoPayload")
    has_payload = any(k in repaired_entry for k in payload_keys)
    if not has_payload:
        repaired_entry["textPayload"] = str(raw_data)

    serialized_entry = json.dumps(repaired_entry)

    result: Dict[str, Any] = {
        "data": serialized_entry,
        "attributes": clean_attrs,
    }
    for k, v in repaired_entry.items():
        if k not in result:
            result[k] = v
    return result


def handle_replay_dlq(args: argparse.Namespace) -> int:
    """Executes the replay-dlq subcommand."""
    project_id = args.project or "parameterized-project"
    messages: List[Dict[str, Any]] = []

    if args.mock_file:
        max_m = args.max_messages
        messages = _load_dlq_messages_from_mock(args.mock_file, max_m)
    else:
        try:
            from google.cloud import pubsub_v1  # type: ignore

            subscriber = pubsub_v1.SubscriberClient()
            sub_name = args.subscription
            sub_path = subscriber.subscription_path(project_id, sub_name)
            pull_req = {
                "subscription": sub_path,
                "max_messages": args.max_messages,
            }
            response = subscriber.pull(request=pull_req)
            for idx, received in enumerate(response.received_messages):
                msg = received.message
                attrs = dict(msg.attributes) if msg.attributes else {}
                messages.append(
                    {
                        "message_id": msg.message_id or f"dlq-live-{idx}",
                        "data": msg.data.decode("utf-8", errors="replace"),
                        "attributes": attrs,
                    }
                )
        except Exception as exc:
            print(
                f"Error pulling from DLQ ({args.subscription}): {exc}",
                file=sys.stderr,
            )
            return 1

    repaired_list: List[Dict[str, Any]] = []
    do_rep = args.auto_repair
    for msg in messages:
        repaired = repair_dlq_message(msg, do_rep, project_id)
        repaired_list.append(repaired)

    if args.output_file:
        with open(args.output_file, "w", encoding="utf-8") as f:
            for item in repaired_list:
                f.write(json.dumps(item) + "\n")

    summary = {
        "status": "success",
        "subscription": args.subscription,
        "target_topic": args.topic,
        "auto_repair": bool(args.auto_repair),
        "inspected_count": len(messages),
        "repaired_count": len(repaired_list),
        "replayed_count": len(repaired_list),
        "repaired_messages": repaired_list,
    }

    if args.format == "json":
        print(json.dumps(summary, indent=2))
    else:
        n_in = len(messages)
        n_rep = len(repaired_list)
        print(
            f"DLQ Replay Summary: Inspected={n_in}, Repaired={n_rep}, "
            f"Replayed={n_rep} to topic '{args.topic}' "
            f"(auto_repair={do_rep})"
        )

    return 0


def calculate_finops_savings(
    daily_gb: float,
    retention_days: int = 365,
    default_exclusion_pct: float = 80.0,
) -> Dict[str, Any]:
    """Calculates monthly and annual FinOps cost savings for Cloud Logging.

    Compares standard Cloud Logging _Default bucket ingestion ($0.50/GB)
    against Log Router Exclusion + Pub/Sub Inline SMT + BigQuery storage.

    Args:
        daily_gb: Daily log ingestion volume in gigabytes (must be > 0).
        retention_days: Required log retention period in days (must be >= 1).
        default_exclusion_pct: Percentage of logs excluded from _Default.

    Returns:
        Dictionary with monthly volume, baseline cost, optimized cost, net
        dollar savings, annual savings, and savings percentage.
    """
    if daily_gb <= 0:
        raise ValueError("daily_gb must be strictly greater than 0")
    if retention_days < 1:
        raise ValueError("retention_days must be at least 1")
    if default_exclusion_pct < 0 or default_exclusion_pct > 100:
        raise ValueError("default_exclusion_pct must be between 0 and 100")

    monthly_volume_gb = round(daily_gb * 30.0, 2)
    baseline_monthly_cost_usd = round(monthly_volume_gb * 0.50, 2)

    exclusion_ratio = default_exclusion_pct / 100.0
    retained_gb = monthly_volume_gb * (1.0 - exclusion_ratio)
    exported_gb = monthly_volume_gb * exclusion_ratio

    if retained_gb >= 300.0:
        free_tier_allowance = min(50.0, retained_gb * 0.15)
    else:
        free_tier_allowance = retained_gb * 0.15
    billable_retained = max(0.0, retained_gb - free_tier_allowance)
    retained_default_cost_usd = billable_retained * 0.50

    active_months = min(retention_days, 90) / 30.0
    long_term_months = max(0, retention_days - 90) / 30.0
    raw_bq_rate = active_months * 0.02 + long_term_months * 0.01
    bq_storage_per_logical_gb = raw_bq_rate / 10.0
    pubsub_delivery_per_gb = 0.01

    rate_per_gb = pubsub_delivery_per_gb + bq_storage_per_logical_gb
    exported_pipeline_cost_usd = exported_gb * rate_per_gb

    optimized_monthly_cost_usd = round(
        retained_default_cost_usd + exported_pipeline_cost_usd, 2
    )
    monthly_savings_usd = round(
        baseline_monthly_cost_usd - optimized_monthly_cost_usd, 2
    )
    annual_savings_usd = round(monthly_savings_usd * 12.0, 2)
    savings_percentage = round(
        (monthly_savings_usd / baseline_monthly_cost_usd) * 100.0, 2
    )

    return {
        "daily_gb": daily_gb,
        "retention_days": retention_days,
        "default_exclusion_pct": default_exclusion_pct,
        "monthly_volume_gb": monthly_volume_gb,
        "baseline_monthly_cost_usd": baseline_monthly_cost_usd,
        "optimized_monthly_cost_usd": optimized_monthly_cost_usd,
        "monthly_savings_usd": monthly_savings_usd,
        "annual_savings_usd": annual_savings_usd,
        "savings_percentage": savings_percentage,
    }


def handle_analyze_savings(args: argparse.Namespace) -> int:
    """Executes the analyze-savings subcommand."""
    if args.daily_gb <= 0:
        print(
            f"Error: --daily-gb must be > 0 (got {args.daily_gb})",
            file=sys.stderr,
        )
        return 2
    if args.retention_days < 1:
        r_days = args.retention_days
        err_ret = f"Error: --retention-days must be >= 1 (got {r_days})"
        print(err_ret, file=sys.stderr)
        return 2
    if args.default_exclusion_pct < 0 or args.default_exclusion_pct > 100:
        print(
            "Error: --default-exclusion-pct must be between 0 and 100 "
            f"(got {args.default_exclusion_pct})",
            file=sys.stderr,
        )
        return 2

    report = calculate_finops_savings(
        daily_gb=args.daily_gb,
        retention_days=args.retention_days,
        default_exclusion_pct=args.default_exclusion_pct,
    )

    if args.format == "json":
        print(json.dumps(report, indent=2))
    else:
        base_usd = report["baseline_monthly_cost_usd"]
        opt_usd = report["optimized_monthly_cost_usd"]
        m_sav = report["monthly_savings_usd"]
        a_sav = report["annual_savings_usd"]
        pct = report["savings_percentage"]
        m_vol = report["monthly_volume_gb"]
        excl = report["default_exclusion_pct"]
        print("=" * 72)
        print("Cloud Logging FinOps Cost Optimization & ROI Analysis")
        print("-" * 72)
        print(f"Daily Ingestion Volume    : {report['daily_gb']:,.2f} GB/day")
        print(f"Monthly Ingestion Volume  : {m_vol:,.2f} GB/mo")
        print(f"Retention Period          : {report['retention_days']} days")
        print(f"_Default Exclusion Ratio  : {excl:.1f}%")
        print("-" * 72)
        print(f"Baseline Monthly Cost     : ${base_usd:,.2f} USD")
        print(f"Optimized Monthly Cost    : ${opt_usd:,.2f} USD")
        print(f"Estimated Monthly Savings : ${m_sav:,.2f} USD")
        print(f"Estimated Annual Savings  : ${a_sav:,.2f} USD")
        print(f"Net TCO Reduction         : {pct:.2f}%")
        print("=" * 72)

    return 0


def build_parser() -> argparse.ArgumentParser:
    """Builds the argument parser for log_pipeline_tool.py."""
    parser = argparse.ArgumentParser(
        prog="log_pipeline_tool.py",
        description=(
            "Operational CLI utility for Cloud Logging at Scale to BigQuery "
            "via Pub/Sub Single Message Transforms (SMT)."
        ),
    )
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # 1. generate-logs
    gen_parser = subparsers.add_parser(
        "generate-logs",
        help="Generate synthetic Cloud Logging entries or malformed payloads.",
    )
    gen_parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="Number of log messages to generate (default: 10).",
    )
    gen_parser.add_argument(
        "--payload-type",
        choices=["json", "proto", "http", "malformed", "mixed"],
        default="mixed",
        help="Payload structure type (default: mixed).",
    )
    gen_parser.add_argument(
        "--mode",
        choices=["local", "pubsub", "logging"],
        default="local",
        help="Execution mode: local stdout/file, Pub/Sub, or Cloud Logging.",
    )
    gen_parser.add_argument(
        "--output-file",
        type=str,
        default=None,
        help="Optional file path to write generated JSON lines.",
    )
    gen_parser.add_argument(
        "--project",
        type=str,
        default="parameterized-project",
        help="Google Cloud Project ID.",
    )
    gen_parser.add_argument(
        "--topic",
        type=str,
        default="cloud-logs-ingestion-topic",
        help="Target Pub/Sub ingestion topic name.",
    )

    # 2. inspect-dlq
    insp_parser = subparsers.add_parser(
        "inspect-dlq",
        help="Inspect dead-lettered messages and display udf_error.",
    )
    insp_parser.add_argument(
        "--mock-file",
        type=str,
        default=None,
        help="Path to local JSON/JSONL mock DLQ file for offline inspection.",
    )
    insp_parser.add_argument(
        "--project",
        type=str,
        default="parameterized-project",
        help="Google Cloud Project ID.",
    )
    insp_parser.add_argument(
        "--subscription",
        type=str,
        default="cloud-logs-dlq-sub",
        help="DLQ pull subscription name (default: cloud-logs-dlq-sub).",
    )
    insp_parser.add_argument(
        "--max-messages",
        type=int,
        default=10,
        help="Maximum number of DLQ messages to inspect (default: 10).",
    )
    insp_parser.add_argument(
        "--format",
        choices=["table", "json"],
        default="table",
        help="Output display format (table or json).",
    )

    # 3. replay-dlq
    rep_parser = subparsers.add_parser(
        "replay-dlq",
        help="Repair and replay dead-lettered messages back to pipeline.",
    )
    rep_parser.add_argument(
        "--mock-file",
        type=str,
        default=None,
        help="Path to local JSON/JSONL mock DLQ file for offline replay.",
    )
    rep_parser.add_argument(
        "--output-file",
        type=str,
        default=None,
        help="Optional file path to write repaired JSONL messages.",
    )
    rep_parser.add_argument(
        "--auto-repair",
        action="store_true",
        help="Wrap malformed payloads into textPayload with WARNING severity.",
    )
    rep_parser.add_argument(
        "--project",
        type=str,
        default="parameterized-project",
        help="Google Cloud Project ID.",
    )
    rep_parser.add_argument(
        "--subscription",
        type=str,
        default="cloud-logs-dlq-sub",
        help="Source DLQ pull subscription name.",
    )
    rep_parser.add_argument(
        "--topic",
        type=str,
        default="cloud-logs-ingestion-topic",
        help="Target Pub/Sub ingestion topic for replaying messages.",
    )
    rep_parser.add_argument(
        "--max-messages",
        type=int,
        default=10,
        help="Maximum number of messages to replay (default: 10).",
    )
    rep_parser.add_argument(
        "--format",
        choices=["table", "json"],
        default="json",
        help="Summary output format (default: json).",
    )

    # 4. analyze-savings
    sav_parser = subparsers.add_parser(
        "analyze-savings",
        help="Calculate monthly and annual Cloud Logging FinOps cost savings.",
    )
    sav_parser.add_argument(
        "--daily-gb",
        type=float,
        required=True,
        help="Daily Cloud Logging volume in gigabytes (must be > 0).",
    )
    sav_parser.add_argument(
        "--retention-days",
        type=int,
        default=365,
        help="Log retention duration in days (default: 365).",
    )
    sav_parser.add_argument(
        "--default-exclusion-pct",
        type=float,
        default=80.0,
        help="Percentage of logs excluded from _Default bucket (default: 80).",
    )
    sav_parser.add_argument(
        "--format",
        choices=["table", "json"],
        default="table",
        help="Output display format (table or json).",
    )

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    """Main entrypoint for CLI execution."""
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.subcommand == "generate-logs":
        return handle_generate_logs(args)
    if args.subcommand == "inspect-dlq":
        return handle_inspect_dlq(args)
    if args.subcommand == "replay-dlq":
        return handle_replay_dlq(args)
    if args.subcommand == "analyze-savings":
        return handle_analyze_savings(args)

    parser.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
