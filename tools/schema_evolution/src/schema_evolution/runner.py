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

"""Run schema evolution for every datastore listed in the config."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Sequence

from schema_evolution.config import Target
from schema_evolution.evolver import SchemaEvolver
from schema_evolution.exceptions import BreakingSchemaChangeError, SchemaEvolutionError
from schema_evolution.models import EvolutionResult

logger = logging.getLogger(__name__)


class Status(str, Enum):
    OK = "OK"  # created / updated / no change / dry run
    BLOCKED = "BLOCKED"  # breaking change refused (on_breaking=raise) or found by dry run
    ERROR = "ERROR"  # invalid schema, permission, missing datastore, apply failure ...
    NOT_RUN = "NOT_RUN"  # skipped after an earlier failure with fail_fast


@dataclass
class TargetOutcome:
    target: Target
    status: Status
    result: Optional[EvolutionResult] = None
    error: Optional[str] = None
    seconds: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_id": self.target.project_id,
            "location": self.target.location,
            "datastore_id": self.target.datastore_id,
            "schema_file": str(self.target.schema_file),
            "status": self.status.value,
            "action": self.result.action.value if self.result else None,
            "error": self.error,
            "seconds": round(self.seconds, 2),
            "result": self.result.to_dict() if self.result else None,
        }


@dataclass
class RunReport:
    outcomes: List[TargetOutcome] = field(default_factory=list)
    dry_run: bool = False

    def count(self, status: Status) -> int:
        return sum(1 for o in self.outcomes if o.status is status)

    @property
    def ok(self) -> bool:
        return all(o.status is Status.OK for o in self.outcomes)

    @property
    def exit_code(self) -> int:
        """0 = all OK, 1 = any error, 2 = only breaking-change blocks."""
        if any(o.status in (Status.ERROR, Status.NOT_RUN) for o in self.outcomes):
            return 1
        if any(o.status is Status.BLOCKED for o in self.outcomes):
            return 2
        return 0

    def summary(self) -> str:
        mode = " (dry run)" if self.dry_run else ""
        lines = [f"Schema evolution report{mode}", "=" * 60]
        for o in self.outcomes:
            action = o.result.action.value if o.result else "-"
            lines.append(f"[{o.status.value:<7}] {o.target.label}  action={action}  ({o.seconds:.1f}s)")
            if o.result:
                lines += [f"            {c}" for c in o.result.changes]
                lines += [f"            SKIPPED {c}" for c in o.result.skipped]
                lines += [f"            WARNING {w}" for w in o.result.warnings]
            if o.error:
                lines += [f"            {line}" for line in o.error.splitlines()]
        lines.append("=" * 60)
        lines.append(
            f"Total {len(self.outcomes)} | OK {self.count(Status.OK)} | BLOCKED {self.count(Status.BLOCKED)} | "
            f"ERROR {self.count(Status.ERROR)} | NOT_RUN {self.count(Status.NOT_RUN)}"
        )
        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dry_run": self.dry_run,
            "exit_code": self.exit_code,
            "totals": {s.value: self.count(s) for s in Status},
            "datastores": [o.to_dict() for o in self.outcomes],
        }


EvolverFactory = Callable[[Target], SchemaEvolver]


def _default_factory(target: Target, **overrides: Any) -> SchemaEvolver:
    options = dict(target.options)
    location = options.pop("location")
    options.update(overrides)
    return SchemaEvolver(target.project_id, location, target.datastore_id, **options)


def run_targets(
    targets: Sequence[Target],
    *,
    dry_run: bool = False,
    fail_fast: bool = False,
    evolver_factory: Optional[EvolverFactory] = None,
    **evolver_overrides: Any,
) -> RunReport:
    """Evolve each target in order. One failing datastore never stops the others
    unless ``fail_fast`` is set. The in-process cache is disabled (one-shot runs).
    """
    evolver_overrides.setdefault("use_cache", False)
    factory = evolver_factory or (lambda t: _default_factory(t, **evolver_overrides))
    report = RunReport(dry_run=dry_run)
    stop = False

    for target in targets:
        if stop:
            report.outcomes.append(TargetOutcome(target, Status.NOT_RUN, error="Not run: an earlier datastore failed."))
            continue
        logger.info("==> %s (schema: %s)", target.label, target.schema_file)
        started = time.monotonic()
        try:
            evolver = factory(target)
            result = evolver.evolve(str(target.schema_file), schema_key=target.schema_key, dry_run=dry_run)
            blocked = dry_run and result.has_breaking and target.options.get("on_breaking", "raise") == "raise"
            outcome = TargetOutcome(target, Status.BLOCKED if blocked else Status.OK, result=result)
            if blocked:
                outcome.error = "Breaking change(s) would be blocked on a real run."
        except BreakingSchemaChangeError as e:
            outcome = TargetOutcome(target, Status.BLOCKED, error=str(e))
        except (SchemaEvolutionError, ValueError) as e:
            outcome = TargetOutcome(target, Status.ERROR, error=f"{type(e).__name__}: {e}")
        except Exception as e:  # noqa: BLE001 - never let one datastore crash the whole run
            logger.exception("Unexpected error on %s", target.label)
            outcome = TargetOutcome(target, Status.ERROR, error=f"Unexpected {type(e).__name__}: {e}")
        outcome.seconds = time.monotonic() - started
        report.outcomes.append(outcome)
        logger.info("<== %s: %s", target.label, outcome.status.value)
        if fail_fast and outcome.status is not Status.OK:
            stop = True
    return report
