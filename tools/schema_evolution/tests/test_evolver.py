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

import copy
import json
import threading
import time

import pytest
from google.api_core import exceptions as gexc
from google.cloud import discoveryengine_v1 as discoveryengine

import schema_evolution.evolver as evolver_mod
from schema_evolution import (
    Action,
    BreakingSchemaChangeError,
    DatastoreNotFoundError,
    InvalidSchemaError,
    SchemaApplyError,
    SchemaEvolver,
    SchemaFetchError,
    clear_cache,
    evolve_schema,
)

DS_PATH = "projects/p/locations/us/collections/default_collection/dataStores/ds"
SCHEMA_NAME = DS_PATH + "/schemas/default_schema"
EMPTY = {"type": "object", "properties": {}}
DESIRED = {"type": "object", "properties": {"title": {"type": "string", "retrievable": True}}}
BREAKING_LIVE = {"type": "object", "properties": {"title": {"type": "number"}, "other": {"type": "string"}}}
BREAKING_DESIRED = {
    "type": "object",
    "properties": {"title": {"type": "string"}, "other": {"type": "string", "retrievable": True}},
}


# ------------------------------------------------------------------- fakes
class _Op:
    def __init__(self, error=None, delay=0.0):
        self.error, self.delay = error, delay

    def result(self, timeout=None):
        if self.delay:
            time.sleep(self.delay)
        if self.error:
            raise self.error


class FakeSchemaClient:
    """In-memory SchemaServiceClient. ``errors`` raise on the call, ``op_errors`` from the LRO."""

    def __init__(self, live=None, *, mode="json"):
        self.live = copy.deepcopy(live)
        self.mode = mode
        self.raw_json = None
        self.calls, self.requests = [], []
        self.errors = {"get": [], "create": [], "update": [], "delete": []}
        self.op_errors = {"create": [], "update": []}
        self.persist = lambda schema: schema  # simulate service-side normalisation
        self.after_update = None
        self.op_delay = 0.0

    def _maybe_raise(self, kind):
        if self.errors[kind]:
            raise self.errors[kind].pop(0)

    def _op(self, kind):
        return _Op(self.op_errors[kind].pop(0) if self.op_errors[kind] else None, self.op_delay)

    def get_schema(self, name, retry=None):
        self.calls.append("get")
        self._maybe_raise("get")
        if self.live is None:
            raise gexc.NotFound("schema not found")
        if self.raw_json is not None:
            return discoveryengine.Schema(name=name, json_schema=self.raw_json)
        if self.mode == "struct":
            return discoveryengine.Schema(name=name, struct_schema=self.live)
        return discoveryengine.Schema(name=name, json_schema=json.dumps(self.live))

    def create_schema(self, request, retry=None):
        self.calls.append("create")
        self.requests.append(request)
        self._maybe_raise("create")
        op = self._op("create")
        if op.error is None:
            self.live = self.persist(json.loads(request.schema.json_schema))
        return op

    def update_schema(self, request, retry=None):
        self.calls.append("update")
        self.requests.append(request)
        self._maybe_raise("update")
        op = self._op("update")
        if op.error is None:
            self.live = self.persist(json.loads(request.schema.json_schema))
            if self.after_update:
                self.after_update(self)
        return op

    def delete_schema(self, name, retry=None):
        self.calls.append("delete")
        self._maybe_raise("delete")
        self.live = None
        return _Op()


class FakeDocumentClient:
    def __init__(self, docs=0, error=None):
        self.docs, self.error, self.requests = docs, error, []

    def list_documents(self, request=None, retry=None):
        self.requests.append(request)
        if self.error:
            raise self.error
        return iter([object()] * self.docs)


@pytest.fixture(autouse=True)
def _reset_cache():
    clear_cache()
    yield
    clear_cache()


def make(client, docs=None, **kwargs):
    kwargs.setdefault("retry_backoff", 0)
    kwargs.setdefault("datastore_client", _FakeDataStoreClient())
    return SchemaEvolver.from_datastore_path(DS_PATH + "/branches/0", client=client, document_client=docs, **kwargs)


# ------------------------------------------------------------ construction
def test_path_parsing_variants():
    ev = make(FakeSchemaClient())
    assert (ev.project_id, ev.location, ev.datastore_id, ev.collection) == ("p", "us", "ds", "default_collection")
    assert ev.schema_name == SCHEMA_NAME
    assert SchemaEvolver.from_datastore_path("https://us-discoveryengine.googleapis.com/v1/" + DS_PATH).datastore_id == "ds"
    assert SchemaEvolver.from_datastore_path("projects/p/locations/global/dataStores/x").collection == "default_collection"


@pytest.mark.parametrize("bad", ["bad/path", "", "projects/p/locations/us/collections/c", None])
def test_invalid_paths(bad):
    with pytest.raises(ValueError):
        SchemaEvolver.from_datastore_path(bad)


def test_id_validation_and_cleanup():
    assert SchemaEvolver(" p ", "us", "ds\n").datastore_id == "ds"
    for bad in ["", "   ", "a/b", "a b", None, 5]:
        with pytest.raises(ValueError):
            SchemaEvolver("p", "us", bad)


@pytest.mark.parametrize(
    "kwargs", [{"on_breaking": "force"}, {"operation_timeout": 0}, {"max_attempts": 0}, {"cache_ttl": -1}]
)
def test_option_validation(kwargs):
    with pytest.raises(ValueError):
        SchemaEvolver("p", "us", "ds", **kwargs)


def test_client_kwargs_regional_global_transport():
    regional = SchemaEvolver("p", "us", "ds", transport="rest")._client_kwargs()
    assert regional["client_options"].api_endpoint == "us-discoveryengine.googleapis.com"
    assert regional["client_options"].quota_project_id == "p"
    assert regional["transport"] == "rest"
    global_opts = SchemaEvolver("p", "global", "ds")._client_kwargs()["client_options"]
    assert global_opts.api_endpoint is None and global_opts.quota_project_id == "p"


# ------------------------------------------------------------------ create
def test_creates_when_missing():
    client = FakeSchemaClient(live=None)
    result = make(client).evolve(DESIRED)
    assert result.action is Action.CREATED and result.changed and not result.warnings
    assert client.live == {"$schema": "https://json-schema.org/draft/2020-12/schema", **DESIRED}


def test_payload_keeps_explicit_schema_version():
    client = FakeSchemaClient(live=None)
    make(client).evolve({"$schema": "https://json-schema.org/draft/2020-12/schema", **DESIRED})
    assert json.loads(client.requests[0].schema.json_schema)["$schema"].endswith("2020-12/schema")


def test_create_already_exists_falls_back_to_update():
    client = FakeSchemaClient(live=None)

    def create(request, retry=None):  # another writer created it a moment earlier
        client.calls.append("create")
        client.live = copy.deepcopy(EMPTY)
        raise gexc.AlreadyExists("exists")

    client.create_schema = create
    result = make(client).evolve(DESIRED)
    assert result.action is Action.UPDATED
    assert client.live["properties"]["title"] == DESIRED["properties"]["title"]


def test_missing_datastore_raises():
    client = FakeSchemaClient(live=None)
    client.errors["create"].append(gexc.NotFound("datastore not found"))
    with pytest.raises(DatastoreNotFoundError):
        make(client).evolve(DESIRED)


def test_new_fields_require_type():
    with pytest.raises(InvalidSchemaError, match="must declare a 'type'"):
        make(FakeSchemaClient(live=None)).evolve({"properties": {"a": {"retrievable": True}}})
    live = {"type": "object", "properties": {"obj": {"type": "object", "properties": {}}}}
    with pytest.raises(InvalidSchemaError, match="obj.child"):
        make(FakeSchemaClient(live=live)).evolve({"properties": {"obj": {"type": "object", "properties": {"child": {}}}}})


# ---------------------------------------------------------- live payloads
def test_empty_default_schema_is_updated():
    client = FakeSchemaClient(live={})
    client.raw_json = ""  # datastore's default schema exists but is empty
    client.after_update = lambda c: setattr(c, "raw_json", None)
    result = make(client).evolve(DESIRED)
    assert result.action is Action.UPDATED and not result.warnings
    assert [str(c) for c in result.changes] == ["+ title"]


def test_struct_schema_with_float_numbers_is_no_change():
    desired = {"type": "object", "properties": {"a": {"type": "string", "maxLength": 10}}}
    assert make(FakeSchemaClient(live=desired, mode="struct")).evolve(desired).action is Action.NO_CHANGE


def test_permission_denied_on_read():
    client = FakeSchemaClient(live=DESIRED)
    client.errors["get"].append(gexc.PermissionDenied("nope"))
    with pytest.raises(SchemaFetchError):
        make(client).evolve(DESIRED)


@pytest.mark.parametrize("payload", ["{not json", "[1, 2]"])
def test_unparseable_live_schema(payload):
    client = FakeSchemaClient(live={})
    client.raw_json = payload
    with pytest.raises(SchemaFetchError):
        make(client).evolve(DESIRED)


# ----------------------------------------------------------------- caching
def test_no_change_then_cached():
    client = FakeSchemaClient(live=DESIRED)
    assert make(client).evolve(DESIRED).action is Action.NO_CHANGE
    second = make(client).evolve(DESIRED)
    assert second.cached and client.calls == ["get"]


def test_cache_ttl_expiry(monkeypatch):
    client = FakeSchemaClient(live=DESIRED)
    now = [1000.0]
    monkeypatch.setattr(evolver_mod.time, "monotonic", lambda: now[0])
    make(client, cache_ttl=60).evolve(DESIRED)
    make(client, cache_ttl=60).evolve(DESIRED)
    assert client.calls == ["get"]
    now[0] += 61
    make(client, cache_ttl=60).evolve(DESIRED)
    assert client.calls == ["get", "get"]


def test_cache_disabled_and_new_schema_version_rechecked():
    client = FakeSchemaClient(live=DESIRED)
    make(client, use_cache=False).evolve(DESIRED)
    make(client, use_cache=False).evolve(DESIRED)
    assert client.calls.count("get") == 2
    make(client).evolve(DESIRED)
    newer = copy.deepcopy(DESIRED)
    newer["properties"]["title"]["indexable"] = True
    assert make(client).evolve(newer).action is Action.UPDATED


def test_concurrent_threads_apply_once():
    client = FakeSchemaClient(live=EMPTY)
    client.op_delay = 0.2
    results = []
    threads = [threading.Thread(target=lambda: results.append(make(client).evolve(DESIRED))) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert client.calls.count("update") == 1
    assert sorted(r.action.value for r in results) == ["NO_CHANGE"] * 3 + ["UPDATED"]


# ----------------------------------------------------------------- updates
def test_safe_update_preserves_live_fields():
    client = FakeSchemaClient(live={"type": "object", "properties": {"other": {"type": "number"}, "title": {"type": "string"}}})
    result = make(client).evolve(DESIRED)
    assert result.action is Action.UPDATED
    assert client.live["properties"]["other"] == {"type": "number"}
    assert client.live["properties"]["title"]["retrievable"] is True
    assert client.requests[-1].allow_missing is True


def test_dry_run_writes_nothing_and_reports_breaking():
    client = FakeSchemaClient(live={"type": "object", "properties": {"title": {"type": "number"}}})
    result = make(client).evolve(DESIRED, dry_run=True)
    assert result.action is Action.DRY_RUN and result.has_breaking
    assert client.calls == ["get"]
    client.live = None
    assert make(client).evolve(DESIRED, dry_run=True).action is Action.DRY_RUN
    assert "create" not in client.calls


def test_dry_run_catches_key_property_conflicts():
    client = FakeSchemaClient(live={"type": "object", "properties": {"title": {"type": "string", "keyPropertyMapping": "title"}}})
    with pytest.raises(InvalidSchemaError, match="unique"):
        make(client).evolve({"properties": {"h": {"type": "string", "keyPropertyMapping": "title"}}}, dry_run=True)


def test_plan_is_read_only():
    client = FakeSchemaClient(live=EMPTY)
    assert [str(c) for c in make(client).plan(DESIRED)] == ["+ title"]
    assert client.calls == ["get"]


# -------------------------------------------------------- breaking changes
def test_breaking_blocked_by_default():
    client = FakeSchemaClient(live=BREAKING_LIVE)
    with pytest.raises(BreakingSchemaChangeError) as exc:
        make(client).evolve(BREAKING_DESIRED)
    assert [c.path for c in exc.value.changes] == ["title.type"]
    assert "update" not in client.calls


def test_skip_applies_only_safe_changes():
    client = FakeSchemaClient(live=BREAKING_LIVE)
    result = make(client, on_breaking="skip").evolve(BREAKING_DESIRED)
    assert result.action is Action.UPDATED and not result.warnings
    assert [c.path for c in result.skipped] == ["title.type"]
    assert client.live["properties"]["title"] == {"type": "number"}
    assert client.live["properties"]["other"]["retrievable"] is True


def test_skip_with_only_breaking_changes_is_no_change():
    client = FakeSchemaClient(live={"type": "object", "properties": {"title": {"type": "number"}}})
    result = make(client, on_breaking="skip").evolve(DESIRED)
    assert result.action is Action.NO_CHANGE and result.skipped and result.has_breaking
    assert "update" not in client.calls


def test_recreate_if_empty_deletes_and_creates():
    client, docs = FakeSchemaClient(live=BREAKING_LIVE), FakeDocumentClient(docs=0)
    result = make(client, docs, recreate_if_empty=True).evolve(BREAKING_DESIRED)
    assert result.action is Action.RECREATED and not result.warnings
    assert client.calls == ["get", "delete", "create", "get"]
    assert client.live["properties"]["title"] == {"type": "string"}
    assert docs.requests[0]["parent"].endswith("/branches/default_branch")


@pytest.mark.parametrize("docs", [FakeDocumentClient(docs=1), FakeDocumentClient(error=gexc.PermissionDenied("no"))])
def test_recreate_refused_unless_verifiably_empty(docs):
    client = FakeSchemaClient(live=BREAKING_LIVE)
    with pytest.raises(BreakingSchemaChangeError):
        make(client, docs, recreate_if_empty=True).evolve(BREAKING_DESIRED)
    assert "delete" not in client.calls


def test_recreate_failure_after_delete_is_reported():
    client = FakeSchemaClient(live=BREAKING_LIVE)
    client.errors["create"].append(gexc.InvalidArgument("bad"))
    with pytest.raises(SchemaApplyError, match="deleted but could not be recreated"):
        make(client, FakeDocumentClient(), recreate_if_empty=True).evolve(BREAKING_DESIRED)


def test_recreate_tolerates_empty_delete_lro_result():
    """Live behaviour: DeleteSchema LRO ends with neither response nor error -> api-core raises."""
    client = FakeSchemaClient(live=BREAKING_LIVE)

    def delete(name, retry=None):
        client.calls.append("delete")
        client.live = None  # the delete really happened
        return _Op(gexc.GoogleAPICallError("Unexpected state: Long-running operation had neither response nor error set."))

    client.delete_schema = delete
    result = make(client, FakeDocumentClient(), recreate_if_empty=True).evolve(BREAKING_DESIRED)
    assert result.action is Action.RECREATED
    assert client.live["properties"]["title"] == {"type": "string"}


def test_recreate_delete_error_when_schema_still_exists():
    client = FakeSchemaClient(live=BREAKING_LIVE)
    client.delete_schema = lambda name, retry=None: _Op(gexc.InternalServerError("boom"))
    with pytest.raises(SchemaApplyError, match="Failed to delete"):
        make(client, FakeDocumentClient(), recreate_if_empty=True).evolve(BREAKING_DESIRED)
    assert client.live == BREAKING_LIVE


class _FakeDataStoreClient:
    def __init__(self, error=None):
        self.error = error

    def get_data_store(self, name, retry=None):
        if self.error:
            raise self.error
        return object()


def test_dry_run_detects_missing_datastore():
    ev = SchemaEvolver.from_datastore_path(DS_PATH, client=FakeSchemaClient(live=None),
                                           datastore_client=_FakeDataStoreClient(gexc.NotFound("no ds")))
    with pytest.raises(DatastoreNotFoundError):
        ev.evolve(DESIRED, dry_run=True)


def test_dry_run_missing_schema_on_existing_datastore_or_no_permission():
    for ds_client in (_FakeDataStoreClient(), _FakeDataStoreClient(gexc.PermissionDenied("no get"))):
        ev = SchemaEvolver.from_datastore_path(DS_PATH, client=FakeSchemaClient(live=None), datastore_client=ds_client)
        assert ev.evolve(DESIRED, dry_run=True).action is Action.DRY_RUN


# ------------------------------------------- failures, conflicts, timeouts
def test_update_failure_raises_and_is_not_cached():
    client = FakeSchemaClient(live=EMPTY)
    client.op_errors["update"].append(gexc.InvalidArgument("boom"))
    with pytest.raises(SchemaApplyError):
        make(client).evolve(DESIRED)
    assert make(client).evolve(DESIRED).action is Action.UPDATED


def test_conflict_is_retried_after_reread():
    client = FakeSchemaClient(live=EMPTY)
    client.op_errors["update"].append(gexc.Aborted("concurrent update"))
    assert make(client).evolve(DESIRED).action is Action.UPDATED
    assert client.calls.count("update") == 2


def test_conflict_resolved_by_other_writer_is_no_change():
    client = FakeSchemaClient(live=EMPTY)

    def update(request, retry=None):
        client.calls.append("update")
        client.live = copy.deepcopy(DESIRED)  # the other writer applied the same change
        return _Op(gexc.FailedPrecondition("update in progress"))

    client.update_schema = update
    assert make(client).evolve(DESIRED).action is Action.NO_CHANGE
    assert client.calls.count("update") == 1


def test_persistent_conflict_gives_up_with_backoff():
    client = FakeSchemaClient(live=EMPTY)
    client.op_errors["update"] += [gexc.Aborted("busy")] * 3
    ev = make(client, retry_backoff=1.5)
    sleeps = []
    ev._sleep = sleeps.append
    with pytest.raises(SchemaApplyError, match="still conflicting after 3"):
        ev.evolve(DESIRED)
    assert sleeps == [1.5, 3.0]


def test_operation_timeout():
    client = FakeSchemaClient(live=EMPTY)
    client.op_errors["update"].append(TimeoutError("lro"))
    with pytest.raises(SchemaApplyError, match="Timed out after 5s"):
        make(client, operation_timeout=5).evolve(DESIRED)


def test_missing_datastore_on_update():
    client = FakeSchemaClient(live=EMPTY)
    client.errors["update"].append(gexc.NotFound("gone"))
    with pytest.raises(DatastoreNotFoundError):
        make(client).evolve(DESIRED)


# ------------------------------------------------------------ verification
def _drop_completable(schema):
    for field in schema["properties"].values():
        field.pop("completable", None)
    return schema


def test_verification_warns_when_service_drops_values():
    client = FakeSchemaClient(live=EMPTY)
    client.persist = _drop_completable
    result = make(client).evolve({"properties": {"title": {"type": "string", "completable": True}}})
    assert result.action is Action.UPDATED
    assert len(result.warnings) == 1 and "title.completable" in result.warnings[0]


def test_verification_can_be_disabled():
    client = FakeSchemaClient(live=EMPTY)
    client.persist = _drop_completable
    result = make(client, verify=False).evolve({"properties": {"title": {"type": "string", "completable": True}}})
    assert not result.warnings and client.calls == ["get", "update"]


# ---------------------------------------------------------- key properties
KPM_LIVE = {"type": "object", "properties": {"title": {"type": "string", "keyPropertyMapping": "title"}}}


def test_duplicate_key_property_blocked_before_update():
    client = FakeSchemaClient(live=KPM_LIVE)
    with pytest.raises(InvalidSchemaError, match="unique"):
        make(client).evolve({"properties": {"headline": {"type": "string", "keyPropertyMapping": "title"}}})
    assert "update" not in client.calls


def test_move_key_property_with_null():
    client = FakeSchemaClient(live=KPM_LIVE)
    desired = {"properties": {"title": {"keyPropertyMapping": None},
                              "headline": {"type": "string", "keyPropertyMapping": "title"}}}
    result = make(client).evolve(desired)
    assert result.action is Action.UPDATED and not result.warnings
    assert "keyPropertyMapping" not in client.live["properties"]["title"]
    assert client.live["properties"]["headline"]["keyPropertyMapping"] == "title"


# ------------------------------------------------------------------ helper
def test_evolve_schema_helper_argument_rules():
    with pytest.raises(ValueError):
        evolve_schema(DESIRED)
    with pytest.raises(ValueError):
        evolve_schema(DESIRED, datastore_path=DS_PATH, project_id="p")
    assert evolve_schema(DESIRED, datastore_path=DS_PATH, client=FakeSchemaClient()).action is Action.CREATED
    result = evolve_schema(DESIRED, project_id="p", location="us", datastore_id="ds2", client=FakeSchemaClient())
    assert result.action is Action.CREATED


def test_schema_file_with_fallback_key(tmp_path):
    f = tmp_path / "schema.json"
    f.write_text(json.dumps({"fallback_schema": {"struct_schema": DESIRED}}))
    result = evolve_schema(
        str(f), schema_key=["journals_schema", "fallback_schema"], datastore_path=DS_PATH, client=FakeSchemaClient()
    )
    assert result.action is Action.CREATED
