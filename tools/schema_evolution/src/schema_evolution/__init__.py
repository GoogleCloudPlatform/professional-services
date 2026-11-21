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

"""schema_evolution - schema evolution for Vertex AI Search datastores.

Typical usage inside an importer::

    from schema_evolution import evolve_schema

    evolve_schema("schema.json", datastore_path=DATASTORE_PATH)
    # ... normal import flow ...
"""

import logging

from schema_evolution.cli import (
    RunReport,
    Status,
    Target,
    TargetOutcome,
    filter_targets,
    load_config,
    parse_config,
    run_targets,
)
from schema_evolution.evolver import (
    DEFAULT_RETRY,
    ON_BREAKING_RAISE,
    ON_BREAKING_SKIP,
    SchemaEvolver,
    clear_cache,
    evolve_schema,
)
from schema_evolution.schema import (
    Action,
    BreakingSchemaChangeError,
    ChangeType,
    ConfigError,
    DatastoreNotFoundError,
    EvolutionResult,
    InvalidSchemaError,
    SchemaApplyError,
    SchemaChange,
    SchemaEvolutionError,
    SchemaFetchError,
    check_key_properties,
    diff_schemas,
    load_schema,
    merge_schemas,
    validate_schema,
)

__version__ = "0.1.0"

__all__ = [
    "Action",
    "BreakingSchemaChangeError",
    "ChangeType",
    "ConfigError",
    "DEFAULT_RETRY",
    "DatastoreNotFoundError",
    "EvolutionResult",
    "InvalidSchemaError",
    "ON_BREAKING_RAISE",
    "ON_BREAKING_SKIP",
    "RunReport",
    "SchemaApplyError",
    "SchemaChange",
    "SchemaEvolutionError",
    "SchemaEvolver",
    "SchemaFetchError",
    "Status",
    "Target",
    "TargetOutcome",
    "check_key_properties",
    "clear_cache",
    "diff_schemas",
    "evolve_schema",
    "filter_targets",
    "load_config",
    "load_schema",
    "merge_schemas",
    "parse_config",
    "run_targets",
    "validate_schema",
]

logging.getLogger(__name__).addHandler(logging.NullHandler())
