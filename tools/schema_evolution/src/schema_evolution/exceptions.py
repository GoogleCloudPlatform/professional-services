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

"""Exceptions raised by schema_evolution.

Every error raised by the package is a subclass of ``SchemaEvolutionError``,
so callers can catch one type if they want a single failure path.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Sequence

if TYPE_CHECKING:
    from schema_evolution.models import SchemaChange


class SchemaEvolutionError(Exception):
    """Base class for all schema_evolution errors."""


class InvalidSchemaError(SchemaEvolutionError):
    """The desired (local) schema is malformed, incomplete or could not be loaded."""


class ConfigError(SchemaEvolutionError):
    """The run configuration (projects / datastores / schema files) is invalid."""


class SchemaFetchError(SchemaEvolutionError):
    """The live schema could not be read (permissions, auth, network, bad payload)."""


class DatastoreNotFoundError(SchemaEvolutionError):
    """The target datastore does not exist (or is not visible to the caller)."""


class SchemaApplyError(SchemaEvolutionError):
    """Creating, updating or recreating the schema failed."""


class BreakingSchemaChangeError(SchemaEvolutionError):
    """The desired schema contains changes Vertex AI Search cannot apply in place.

    The service does not support changing a field's type (or format) on an
    existing schema. Attribute ``changes`` holds the offending changes.
    """

    def __init__(self, changes: Sequence["SchemaChange"]):
        self.changes = list(changes)
        details = "; ".join(str(c) for c in self.changes)
        super().__init__(
            f"{len(self.changes)} breaking schema change(s) detected: {details}. "
            "Vertex AI Search cannot change a field type in place. Options: "
            "on_breaking='skip' (apply only the safe changes), "
            "recreate_if_empty=True (only if the datastore has no documents), "
            "or migrate to a new datastore."
        )
