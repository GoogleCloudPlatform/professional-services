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
"""Base data models and abstractions for modular CLI stages."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import yaml


@dataclass
class StageResult:
    """Structured output result for a single evaluation CLI stage."""

    stage: str
    status: str = "COMPLETED"
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat())
    events: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Return canonical dictionary representation for downstream ingestion."""
        return {
            "stage": self.stage,
            "status": self.status,
            "timestamp": self.timestamp,
            "events": self.events,
            "metadata": self.metadata,
        }

    def to_json(self, indent: int | None = 2) -> str:
        """Serialize stage result to valid JSON string."""
        return json.dumps(self.to_dict(), indent=indent, default=str)

    def to_yaml(self) -> str:
        """Serialize stage result to YAML string."""
        return yaml.dump(self.to_dict(),
                         default_flow_style=False,
                         sort_keys=False)


class BaseStage:
    """Abstract base class for isolated evaluation CLI stages."""

    stage_name: str = "base"

    def execute(self,
                config_data: dict[str, Any] | None = None,
                **kwargs: Any) -> StageResult:
        """Run the stage and emit structured JSON/YAML events."""
        raise NotImplementedError("Subclasses must implement execute()")
