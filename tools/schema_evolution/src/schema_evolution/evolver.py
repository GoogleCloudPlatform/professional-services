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

"""SchemaEvolver: check the live datastore schema and apply changes only when needed.

Every schema update makes Vertex AI Search re-index the whole datastore, so the
evolver writes only when the desired schema really differs from the live one.
"""

from __future__ import annotations

import concurrent.futures
import hashlib
import json
import logging
import re
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

from google.api_core import exceptions as gexc
from google.api_core import retry as gretry
from google.api_core.client_options import ClientOptions
from google.auth.exceptions import GoogleAuthError
from google.cloud import discoveryengine_v1 as discoveryengine

from schema_evolution.diff import diff_schemas, merge_schemas
from schema_evolution.exceptions import (
    BreakingSchemaChangeError,
    DatastoreNotFoundError,
    InvalidSchemaError,
    SchemaApplyError,
    SchemaFetchError,
)
from schema_evolution.loader import (
    JSON_SCHEMA_VERSION,
    SchemaKey,
    SchemaSource,
    check_key_properties,
    load_schema,
)
from schema_evolution.models import Action, ChangeType, EvolutionResult, SchemaChange

logger = logging.getLogger(__name__)

ON_BREAKING_RAISE = "raise"
ON_BREAKING_SKIP = "skip"
_ON_BREAKING_CHOICES = (ON_BREAKING_RAISE, ON_BREAKING_SKIP)

DEFAULT_RETRY = gretry.Retry(
    predicate=gretry.if_exception_type(
        gexc.ServiceUnavailable,
        gexc.ResourceExhausted,
        gexc.DeadlineExceeded,
        gexc.InternalServerError,
    ),
    initial=1.0,
    maximum=30.0,
    multiplier=2.0,
    timeout=300.0,
)

# Errors that usually mean "another writer / operation is in progress":
# re-read the live schema, re-diff and retry.
_CONFLICT_ERRORS = (gexc.Aborted, gexc.FailedPrecondition, gexc.Conflict)
_TIMEOUT_ERRORS = (concurrent.futures.TimeoutError, TimeoutError)

_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]*$")
_DATASTORE_PATH_RE = re.compile(
    r"(?:^|/)projects/(?P<project>[^/]+)/locations/(?P<location>[^/]+)"
    r"(?:/collections/(?P<collection>[^/]+))?/dataStores/(?P<datastore>[^/?#]+)"
)

# Per-process state shared by all evolvers (warm Cloud Function / Cloud Run instances).
_cache: Dict[Tuple[Any, ...], float] = {}  # cache key -> expiry (monotonic seconds)
_schema_locks: Dict[str, threading.Lock] = {}
_state_guard = threading.Lock()


def clear_cache() -> None:
    """Forget every schema verified in this process."""
    with _state_guard:
        _cache.clear()


def _cache_hit(key: Tuple[Any, ...]) -> bool:
    with _state_guard:
        expiry = _cache.get(key)
        if expiry is None:
            return False
        if expiry > time.monotonic():
            return True
        del _cache[key]
        return False


def _cache_put(key: Tuple[Any, ...], ttl: float) -> None:
    with _state_guard:
        _cache[key] = time.monotonic() + ttl


def _schema_lock(schema_name: str) -> threading.Lock:
    with _state_guard:
        return _schema_locks.setdefault(schema_name, threading.Lock())


class _RetryableConflict(Exception):
    def __init__(self, cause: Exception):
        super().__init__(str(cause))
        self.cause = cause


class SchemaEvolver:
    """Keeps a Vertex AI Search datastore schema in sync with a desired schema.

    Example::

        evolver = SchemaEvolver("my-project", "us", "journals-ds")
        result = evolver.evolve("schema.json")
    """

    def __init__(
        self,
        project_id: str,
        location: str,
        datastore_id: str,
        *,
        collection: str = "default_collection",
        schema_id: str = "default_schema",
        on_breaking: str = ON_BREAKING_RAISE,
        recreate_if_empty: bool = False,
        verify: bool = True,
        operation_timeout: float = 3600.0,
        use_cache: bool = True,
        cache_ttl: float = 3600.0,
        max_attempts: int = 3,
        retry_backoff: float = 2.0,
        retry: Optional[gretry.Retry] = DEFAULT_RETRY,
        client: Optional[Any] = None,
        document_client: Optional[Any] = None,
        datastore_client: Optional[Any] = None,
        transport: Optional[str] = None,
        credentials: Optional[Any] = None,
    ):
        self.project_id = _clean_id("project_id", project_id)
        self.location = _clean_id("location", location)
        self.datastore_id = _clean_id("datastore_id", datastore_id)
        self.collection = _clean_id("collection", collection)
        self.schema_id = _clean_id("schema_id", schema_id)
        if on_breaking not in _ON_BREAKING_CHOICES:
            raise ValueError(f"on_breaking must be one of {_ON_BREAKING_CHOICES}, got {on_breaking!r}")
        if operation_timeout <= 0:
            raise ValueError("operation_timeout must be > 0")
        if cache_ttl < 0 or retry_backoff < 0:
            raise ValueError("cache_ttl and retry_backoff must be >= 0")
        if int(max_attempts) < 1:
            raise ValueError("max_attempts must be >= 1")
        self.on_breaking = on_breaking
        self.recreate_if_empty = recreate_if_empty
        self.verify = verify
        self.operation_timeout = operation_timeout
        self.use_cache = use_cache
        self.cache_ttl = cache_ttl
        self.max_attempts = int(max_attempts)
        self.retry_backoff = retry_backoff
        self.retry = retry
        self.transport = transport
        self.credentials = credentials
        self._client = client
        self._document_client = document_client
        self._datastore_client = datastore_client
        self._sleep = time.sleep

    # ------------------------------------------------------------------ factory
    @classmethod
    def from_datastore_path(cls, path: str, **kwargs: Any) -> "SchemaEvolver":
        """Build from a resource name, e.g.
        ``projects/p/locations/us/collections/default_collection/dataStores/ds[/branches/0]``.
        """
        if not isinstance(path, str):
            raise ValueError(f"datastore path must be a string, got {type(path).__name__}")
        match = _DATASTORE_PATH_RE.search(path.strip())
        if not match:
            raise ValueError(f"Not a valid datastore resource name: {path!r}")
        if match.group("collection"):
            kwargs.setdefault("collection", match.group("collection"))
        return cls(match.group("project"), match.group("location"), match.group("datastore"), **kwargs)

    # --------------------------------------------------------------- properties
    @property
    def datastore_name(self) -> str:
        return (
            f"projects/{self.project_id}/locations/{self.location}"
            f"/collections/{self.collection}/dataStores/{self.datastore_id}"
        )

    @property
    def schema_name(self) -> str:
        return f"{self.datastore_name}/schemas/{self.schema_id}"

    @property
    def branch_name(self) -> str:
        return f"{self.datastore_name}/branches/default_branch"

    def _client_kwargs(self) -> Dict[str, Any]:
        opts: Dict[str, Any] = {"quota_project_id": self.project_id}
        if self.location != "global":
            opts["api_endpoint"] = f"{self.location}-discoveryengine.googleapis.com"
        kwargs: Dict[str, Any] = {"client_options": ClientOptions(**opts)}
        if self.transport:
            kwargs["transport"] = self.transport
        if self.credentials is not None:
            kwargs["credentials"] = self.credentials
        return kwargs

    @property
    def client(self) -> Any:
        if self._client is None:
            self._client = discoveryengine.SchemaServiceClient(**self._client_kwargs())
        return self._client

    @property
    def document_client(self) -> Any:
        if self._document_client is None:
            self._document_client = discoveryengine.DocumentServiceClient(**self._client_kwargs())
        return self._document_client

    @property
    def datastore_client(self) -> Any:
        if self._datastore_client is None:
            self._datastore_client = discoveryengine.DataStoreServiceClient(**self._client_kwargs())
        return self._datastore_client

    # ------------------------------------------------------------------ public
    def get_live_schema(self) -> Optional[Dict[str, Any]]:
        """Return the live schema as a dict, or ``None`` if it does not exist."""
        try:
            schema_obj = self.client.get_schema(name=self.schema_name, retry=self.retry)
        except gexc.NotFound:
            return None
        except (gexc.GoogleAPIError, GoogleAuthError) as e:
            raise SchemaFetchError(f"Could not read schema {self.schema_name}: {e}") from e
        return _schema_to_dict(schema_obj)

    def plan(self, schema: SchemaSource, *, schema_key: SchemaKey = None) -> List[SchemaChange]:
        """Return the changes ``evolve`` would apply (read-only)."""
        desired = load_schema(schema, schema_key)
        live = self.get_live_schema()
        return _all_added(desired) if live is None else diff_schemas(desired, live)

    def evolve(self, schema: SchemaSource, *, schema_key: SchemaKey = None, dry_run: bool = False) -> EvolutionResult:
        """Check the datastore schema; create/update it only if it differs.

        Raises:
            InvalidSchemaError: desired schema is malformed or would be invalid.
            BreakingSchemaChangeError: unsupported change and ``on_breaking="raise"``.
            DatastoreNotFoundError: the datastore does not exist.
            SchemaFetchError: the live schema could not be read.
            SchemaApplyError: create/update/recreate failed.
        """
        desired = load_schema(schema, schema_key)
        cache_key = (self.schema_name, _fingerprint(desired), self.on_breaking, self.recreate_if_empty)
        use_cache = self.use_cache and self.cache_ttl > 0 and not dry_run

        if use_cache and _cache_hit(cache_key):
            logger.debug("Schema %s already verified in this process.", self.schema_name)
            return EvolutionResult(Action.NO_CHANGE, self.schema_name, cached=True)

        with _schema_lock(self.schema_name):  # one evolution per schema per process
            if use_cache and _cache_hit(cache_key):
                return EvolutionResult(Action.NO_CHANGE, self.schema_name, cached=True)
            result = self._evolve_locked(desired, dry_run)
            if use_cache:
                _cache_put(cache_key, self.cache_ttl)
            return result

    # ------------------------------------------------------------ main flow
    def _evolve_locked(self, desired: Dict[str, Any], dry_run: bool) -> EvolutionResult:
        live = self.get_live_schema()
        if live is None:
            changes = _all_added(desired)
            _require_types(changes)
            if dry_run:
                # A missing schema and a missing datastore both return NotFound on get_schema.
                self._ensure_datastore_exists()
                return EvolutionResult(Action.DRY_RUN, self.schema_name, changes)
            if self._create(desired):
                logger.info("Created schema %s with %d field(s).", self.schema_name, len(changes))
                return EvolutionResult(Action.CREATED, self.schema_name, changes, warnings=self._verify(desired, changes))
            live = self.get_live_schema() or {}  # created concurrently by another writer

        attempt = 1
        while True:
            try:
                return self._evolve_existing(desired, live, dry_run)
            except _RetryableConflict as conflict:
                if attempt >= self.max_attempts:
                    raise SchemaApplyError(
                        f"Schema update for {self.schema_name} still conflicting after {attempt} attempt(s): "
                        f"{conflict.cause}"
                    ) from conflict.cause
                delay = self.retry_backoff * (2 ** (attempt - 1))
                logger.warning(
                    "Schema update conflict on %s (%s); re-reading and retrying in %.1fs.",
                    self.schema_name, conflict.cause, delay,
                )
                self._sleep(delay)
                attempt += 1
                live = self.get_live_schema() or {}

    def _evolve_existing(self, desired: Dict[str, Any], live: Dict[str, Any], dry_run: bool) -> EvolutionResult:
        changes = diff_schemas(desired, live)
        if not changes:
            logger.info("Schema %s is up to date.", self.schema_name)
            return EvolutionResult(Action.NO_CHANGE, self.schema_name)
        _require_types(changes)
        if dry_run:
            check_key_properties(merge_schemas(desired, live))
            return EvolutionResult(Action.DRY_RUN, self.schema_name, changes)

        breaking = [c for c in changes if c.breaking]
        if breaking:
            if self.recreate_if_empty and self._datastore_is_empty():
                return self._recreate(desired, live, changes)
            if self.on_breaking == ON_BREAKING_RAISE:
                raise BreakingSchemaChangeError(breaking)
            for change in breaking:
                logger.warning("Skipping unsupported schema change on %s: %s", self.datastore_id, change)
            applicable = [c for c in changes if not c.breaking]
            if not applicable:
                return EvolutionResult(Action.NO_CHANGE, self.schema_name, skipped=breaking)
            merged = merge_schemas(desired, live, keep_live_types=True)
        else:
            applicable = changes
            merged = merge_schemas(desired, live)

        check_key_properties(merged)
        for change in applicable:
            logger.info("Applying schema change on %s: %s", self.datastore_id, change)
        self._update(merged)
        logger.info("Updated schema %s (%d change(s)); the datastore will re-index.", self.schema_name, len(applicable))
        return EvolutionResult(
            Action.UPDATED, self.schema_name, applicable, skipped=breaking, warnings=self._verify(desired, applicable)
        )

    # ---------------------------------------------------------------- writes
    def _create(self, schema: Dict[str, Any]) -> bool:
        """Create the schema. Returns False if it already exists."""
        check_key_properties(schema)
        request = discoveryengine.CreateSchemaRequest(
            parent=self.datastore_name,
            schema_id=self.schema_id,
            schema=discoveryengine.Schema(json_schema=_payload(schema)),
        )
        try:
            operation = self.client.create_schema(request=request, retry=self.retry)
            operation.result(timeout=self.operation_timeout)
            return True
        except gexc.AlreadyExists:
            logger.info("Schema %s already exists; switching to update.", self.schema_name)
            return False
        except gexc.NotFound as e:
            raise DatastoreNotFoundError(f"Datastore {self.datastore_name} not found: {e}") from e
        except _TIMEOUT_ERRORS as e:
            raise SchemaApplyError(self._timeout_message("create")) from e
        except Exception as e:  # noqa: BLE001 - surface every failure as a typed error
            raise SchemaApplyError(f"Failed to create schema {self.schema_name}: {e}") from e

    def _update(self, merged: Dict[str, Any]) -> None:
        fields: Dict[str, Any] = {
            "schema": discoveryengine.Schema(name=self.schema_name, json_schema=_payload(merged)),
        }
        if "allow_missing" in discoveryengine.UpdateSchemaRequest.meta.fields:
            fields["allow_missing"] = True  # also covers a schema deleted between read and write
        try:
            operation = self.client.update_schema(request=discoveryengine.UpdateSchemaRequest(**fields), retry=self.retry)
            operation.result(timeout=self.operation_timeout)
        except gexc.NotFound as e:
            raise DatastoreNotFoundError(f"Datastore {self.datastore_name} not found: {e}") from e
        except _CONFLICT_ERRORS as e:
            raise _RetryableConflict(e) from e
        except _TIMEOUT_ERRORS as e:
            raise SchemaApplyError(self._timeout_message("update")) from e
        except Exception as e:  # noqa: BLE001
            raise SchemaApplyError(f"Failed to update schema {self.schema_name}: {e}") from e

    def _recreate(self, desired: Dict[str, Any], live: Dict[str, Any], changes: List[SchemaChange]) -> EvolutionResult:
        """Delete + create the schema. Only called when the datastore has no documents."""
        merged = merge_schemas(desired, live)
        check_key_properties(merged)
        logger.warning(
            "Datastore %s has no documents; deleting and recreating its schema to apply: %s",
            self.datastore_name, "; ".join(str(c) for c in changes if c.breaking),
        )
        try:
            operation = self.client.delete_schema(name=self.schema_name, retry=self.retry)
            operation.result(timeout=self.operation_timeout)
        except gexc.NotFound:
            pass
        except _TIMEOUT_ERRORS as e:
            raise SchemaApplyError(self._timeout_message("delete")) from e
        except Exception as e:  # noqa: BLE001
            # DeleteSchema's LRO completes with an empty result (no response, no error), which
            # google-api-core reports as "neither response nor error set". Trust the live state.
            if not self._schema_is_gone():
                raise SchemaApplyError(f"Failed to delete schema {self.schema_name} for recreation: {e}") from e
            logger.debug("Delete of %s reported %r but the schema is gone; continuing.", self.schema_name, e)
        try:
            created = self._create(merged)
        except SchemaApplyError as e:
            raise SchemaApplyError(
                f"Schema {self.schema_name} was deleted but could not be recreated; re-run to create it. Cause: {e}"
            ) from e
        if not created:
            raise SchemaApplyError(f"Schema {self.schema_name} was recreated concurrently by another writer; re-run.")
        return EvolutionResult(Action.RECREATED, self.schema_name, changes, warnings=self._verify(desired, changes))

    # --------------------------------------------------------------- checks
    def _schema_is_gone(self) -> bool:
        try:
            return self.get_live_schema() is None
        except SchemaFetchError:
            return False

    def _ensure_datastore_exists(self) -> None:
        """Raise DatastoreNotFoundError if the datastore is verifiably missing (best effort)."""
        try:
            self.datastore_client.get_data_store(name=self.datastore_name, retry=self.retry)
        except gexc.NotFound as e:
            raise DatastoreNotFoundError(f"Datastore {self.datastore_name} not found: {e}") from e
        except Exception as e:  # noqa: BLE001 - e.g. missing dataStores.get permission: don't block a dry run
            logger.debug("Could not confirm datastore %s exists: %s", self.datastore_name, e)

    def _datastore_is_empty(self) -> bool:
        """True only if the datastore verifiably has zero documents (fails closed)."""
        try:
            pager = self.document_client.list_documents(
                request={"parent": self.branch_name, "page_size": 1}, retry=self.retry
            )
            return next(iter(pager), None) is None
        except Exception as e:  # noqa: BLE001
            logger.warning("Could not check whether %s is empty (%s); assuming it has documents.", self.datastore_name, e)
            return False

    def _verify(self, desired: Dict[str, Any], applied: List[SchemaChange]) -> List[str]:
        """Re-read after a write and report applied changes the service did not persist."""
        if not self.verify or not applied:
            return []
        try:
            after = self.get_live_schema()
        except SchemaFetchError as e:
            logger.warning("Post-apply verification skipped for %s: %s", self.schema_name, e)
            return [f"Verification skipped: {e}"]
        if after is None:
            return ["Schema not found right after it was written; verify manually."]
        prefixes = [c.path for c in applied]
        remaining = [c for c in diff_schemas(desired, after) if _is_under(c.path, prefixes)]
        if not remaining:
            return []
        warnings = [f"Not persisted by the service: {c}" for c in remaining]
        logger.warning(
            "Schema %s did not converge; fix these entries in the schema file or every cold start will "
            "re-apply them (each update re-indexes the datastore): %s",
            self.schema_name, "; ".join(str(c) for c in remaining),
        )
        return warnings

    def _timeout_message(self, verb: str) -> str:
        return (
            f"Timed out after {self.operation_timeout:.0f}s waiting for schema {verb} on {self.schema_name}. "
            "The operation may still finish server-side; re-run later (it is idempotent)."
        )


# ---------------------------------------------------------------------- helpers
def _clean_id(name: str, value: Any) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be a string, got {type(value).__name__}")
    cleaned = value.strip()
    if not _ID_RE.match(cleaned):
        raise ValueError(f"Invalid {name}: {value!r}")
    return cleaned


def _schema_to_dict(schema_obj: Any) -> Dict[str, Any]:
    try:
        json_schema = getattr(schema_obj, "json_schema", "") or ""
        if json_schema:
            data = json.loads(json_schema)
        elif hasattr(type(schema_obj), "to_dict"):
            raw = type(schema_obj).to_dict(schema_obj, preserving_proto_field_name=True)
            data = json.loads(raw["json_schema"]) if raw.get("json_schema") else raw.get("struct_schema")
        else:
            data = getattr(schema_obj, "struct_schema", None)
    except (ValueError, TypeError, KeyError) as e:
        raise SchemaFetchError(f"Live schema payload could not be parsed: {e}") from e
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise SchemaFetchError(f"Live schema is not a JSON object (got {type(data).__name__}).")
    return data


def _all_added(desired: Dict[str, Any]) -> List[SchemaChange]:
    return [
        SchemaChange(name, ChangeType.FIELD_ADDED, None, attrs)
        for name, attrs in (desired.get("properties") or {}).items()
    ]


def _missing_types(path: str, attrs: Any) -> List[str]:
    if not isinstance(attrs, dict):
        return [path]
    missing = [path] if attrs.get("type") is None else []
    for name, sub in (attrs.get("properties") or {}).items():
        missing += _missing_types(f"{path}.{name}", sub)
    if isinstance(attrs.get("items"), dict):
        missing += _missing_types(f"{path}[]", attrs["items"])
    return missing


def _require_types(changes: List[SchemaChange]) -> None:
    missing: List[str] = []
    for change in changes:
        if change.change_type is ChangeType.FIELD_ADDED:
            missing += _missing_types(change.path, change.new)
    if missing:
        raise InvalidSchemaError(f"New field(s) must declare a 'type': {', '.join(missing)}")


def _is_under(path: str, prefixes: List[str]) -> bool:
    return any(path == p or path.startswith(f"{p}.") or path.startswith(f"{p}[") for p in prefixes)


def _fingerprint(schema: Dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(schema, sort_keys=True).encode("utf-8")).hexdigest()


def _payload(schema: Dict[str, Any]) -> str:
    """JSON sent to the service. It rejects schemas without "$schema" ("Missing or Invalid schema version")."""
    if "$schema" in schema:
        return json.dumps(schema)
    return json.dumps({"$schema": JSON_SCHEMA_VERSION, **schema})


def evolve_schema(
    schema: SchemaSource,
    *,
    project_id: Optional[str] = None,
    location: Optional[str] = None,
    datastore_id: Optional[str] = None,
    datastore_path: Optional[str] = None,
    schema_key: SchemaKey = None,
    dry_run: bool = False,
    **kwargs: Any,
) -> EvolutionResult:
    """One-call helper: check the schema and apply changes only if needed.

    Identify the datastore either with ``datastore_path`` (full resource name)
    or with ``project_id`` + ``location`` + ``datastore_id`` (not both).
    Extra keyword arguments are passed to ``SchemaEvolver``.
    """
    ids = (project_id, location, datastore_id)
    if datastore_path:
        if any(v is not None for v in ids):
            raise ValueError("Pass either datastore_path or project_id/location/datastore_id, not both.")
        evolver = SchemaEvolver.from_datastore_path(datastore_path, **kwargs)
    elif all(ids):
        evolver = SchemaEvolver(project_id, location, datastore_id, **kwargs)  # type: ignore[arg-type]
    else:
        raise ValueError("Provide datastore_path, or project_id + location + datastore_id.")
    return evolver.evolve(schema, schema_key=schema_key, dry_run=dry_run)
