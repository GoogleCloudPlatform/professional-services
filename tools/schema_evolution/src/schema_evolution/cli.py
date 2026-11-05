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

"""Command line for the schema evolution utility.

    python3 main.py --config config.yaml --dry-run
    python3 main.py --config config.yaml
    python3 main.py --config config.yaml --project my-dev-project --datastore journals-ds

Exit codes: 0 all OK, 1 any error, 2 breaking change(s) blocked (or found by --dry-run).
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import List, Optional

from schema_evolution.config import filter_targets, load_config
from schema_evolution.exceptions import ConfigError
from schema_evolution.runner import run_targets

EXIT_ERROR = 1


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="schema-evolution",
        description="Create or evolve Vertex AI Search datastore schemas from a config file "
        "listing projects, datastores and schema.json files.",
    )
    parser.add_argument("--config", "-c", required=True, help="Path to config.yaml (or .json).")
    parser.add_argument("--dry-run", action="store_true", help="Show the changes, write nothing.")
    parser.add_argument("--project", action="append", help="Only this project id (repeatable).")
    parser.add_argument("--datastore", action="append", help="Only this datastore id (repeatable).")
    parser.add_argument("--fail-fast", action="store_true", help="Stop at the first datastore that fails.")
    parser.add_argument("--validate-only", action="store_true", help="Validate config and schema files offline.")
    parser.add_argument("--json", action="store_true", help="Print the report as JSON.")
    parser.add_argument("--report-file", help="Also write the JSON report to this file.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug logging.")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = _parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        stream=sys.stderr,
    )
    try:
        targets = filter_targets(load_config(args.config), args.project, args.datastore)
    except ConfigError as e:
        print(f"CONFIG ERROR: {e}", file=sys.stderr)
        return EXIT_ERROR

    if args.validate_only:
        return _validate_only(targets)

    report = run_targets(targets, dry_run=args.dry_run, fail_fast=args.fail_fast)
    print(json.dumps(report.to_dict(), indent=2, default=str) if args.json else report.summary())
    if args.report_file:
        try:
            Path(args.report_file).write_text(json.dumps(report.to_dict(), indent=2, default=str), encoding="utf-8")
        except OSError as e:
            print(f"Could not write report file {args.report_file}: {e}", file=sys.stderr)
            return EXIT_ERROR
    return report.exit_code


def _validate_only(targets) -> int:
    from schema_evolution.exceptions import InvalidSchemaError
    from schema_evolution.loader import load_schema

    failed = 0
    for t in targets:
        try:
            schema = load_schema(str(t.schema_file), t.schema_key)
            print(f"[VALID  ] {t.label}  {t.schema_file} ({len(schema['properties'])} fields)")
        except InvalidSchemaError as e:
            failed += 1
            print(f"[INVALID] {t.label}  {t.schema_file}: {e}")
    return EXIT_ERROR if failed else 0


if __name__ == "__main__":
    sys.exit(main())
