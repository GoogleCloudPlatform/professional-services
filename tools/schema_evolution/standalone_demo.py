"""Standalone schema evolution script (no imports from schema_evolution).

Reads:
  - Schema:      schemas/example_schema.json
  - Sample data: schemas/sample_data.json

Run:
  .venv/bin/python standalone_demo.py
"""

import copy
import json
from pathlib import Path
from google.api_core import exceptions as gexc
from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1 as discoveryengine
from google.protobuf import struct_pb2

PROJECT_ID = "poc-projects-513715"
LOCATION = "global"
EXISTING_DS = "se-e2e-empty-global"
NEW_DS = "se-step-by-step-demo"

SCHEMA_FILE = Path("schemas/example_schema.json")
DATA_FILE = Path("schemas/sample_data.json")
JSON_SCHEMA_VERSION = "https://json-schema.org/draft/2020-12/schema"
BOOL_ANNOTATIONS = {"retrievable", "indexable", "searchable", "dynamicFacetable", "completable"}


def _client_options() -> ClientOptions:
    opts = {"quota_project_id": PROJECT_ID}
    if LOCATION != "global":
        opts["api_endpoint"] = f"{LOCATION}-discoveryengine.googleapis.com"
    return ClientOptions(**opts)


def _datastore_path(datastore_id: str) -> str:
    return f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/dataStores/{datastore_id}"


def _norm(key: str, val):
    if val is None and key in BOOL_ANNOTATIONS:
        return False
    return val


def diff_and_merge(desired: dict, live: dict) -> tuple[list[str], dict]:
    """Compare desired schema against live schema and build an additive merged schema."""
    changes: list[str] = []
    merged = copy.deepcopy(live) if live else {"$schema": JSON_SCHEMA_VERSION, "type": "object", "properties": {}}
    merged.setdefault("$schema", desired.get("$schema", JSON_SCHEMA_VERSION))
    merged.setdefault("type", "object")
    live_props = merged.setdefault("properties", {})

    for field, d_attrs in desired.get("properties", {}).items():
        if field not in live_props:
            changes.append(f"+ {field}")
            live_props[field] = {k: v for k, v in d_attrs.items() if v is not None}
            continue

        l_attrs = live_props[field]
        if "type" in d_attrs and l_attrs.get("type") and d_attrs["type"] != l_attrs.get("type"):
            raise ValueError(f"Breaking type change on '{field}': {l_attrs.get('type')} -> {d_attrs['type']}")

        for k, d_val in d_attrs.items():
            l_val = l_attrs.get(k)
            if _norm(k, d_val) != _norm(k, l_val):
                changes.append(f"~ {field}.{k}: {l_val!r} -> {d_val!r}")
                if d_val is None:
                    l_attrs.pop(k, None)
                else:
                    l_attrs[k] = copy.deepcopy(d_val)

    return changes, merged


def evolve_schema_standalone(schema_file: Path, datastore_id: str) -> None:
    """Read schema.json, compare with live datastore schema, and create/update only if needed."""
    desired = json.loads(schema_file.read_text(encoding="utf-8"))
    client = discoveryengine.SchemaServiceClient(client_options=_client_options())
    ds_path = _datastore_path(datastore_id)
    schema_name = f"{ds_path}/schemas/default_schema"

    # 1. Read live schema
    try:
        schema_obj = client.get_schema(name=schema_name)
        live = json.loads(schema_obj.json_schema) if schema_obj.json_schema else {}
        exists = True
    except gexc.NotFound:
        live = {}
        exists = False

    # 2. Diff & additive merge
    changes, merged = diff_and_merge(desired, live)
    if not changes:
        print(f"[NO_CHANGE] {schema_name}")
        return

    payload = json.dumps(merged)

    # 3. Create or Update in GCP
    if not exists:
        client.create_schema(
            request=discoveryengine.CreateSchemaRequest(
                parent=ds_path,
                schema_id="default_schema",
                schema=discoveryengine.Schema(json_schema=payload),
            )
        ).result(timeout=3600)
        action = "CREATED"
    else:
        client.update_schema(
            request=discoveryengine.UpdateSchemaRequest(
                schema=discoveryengine.Schema(name=schema_name, json_schema=payload),
                allow_missing=True,
            )
        ).result(timeout=3600)
        action = "UPDATED"

    print(f"[{action}] {schema_name}")
    for c in changes:
        print(f"  {c}")


def create_datastore_if_missing(datastore_id: str) -> None:
    """Create a blank datastore if it does not already exist."""
    client = discoveryengine.DataStoreServiceClient(client_options=_client_options())
    parent = f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection"
    try:
        client.create_data_store(
            parent=parent,
            data_store_id=datastore_id,
            data_store=discoveryengine.DataStore(
                display_name=datastore_id,
                industry_vertical=discoveryengine.IndustryVertical.GENERIC,
                solution_types=[discoveryengine.SolutionType.SOLUTION_TYPE_SEARCH],
                content_config=discoveryengine.DataStore.ContentConfig.NO_CONTENT,
            ),
        ).result(timeout=120)
        print(f"Created new datastore '{datastore_id}'.")
    except gexc.AlreadyExists:
        print(f"Datastore '{datastore_id}' already exists.")


def load_sample_rows(datastore_id: str) -> None:
    """Load sample rows from schemas/sample_data.json into the datastore."""
    rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    client = discoveryengine.DocumentServiceClient(client_options=_client_options())
    branch = f"{_datastore_path(datastore_id)}/branches/default_branch"
    for row in rows:
        struct = struct_pb2.Struct()
        struct.update(row["data"])
        client.update_document(
            request=discoveryengine.UpdateDocumentRequest(
                document=discoveryengine.Document(name=f"{branch}/documents/{row['id']}", struct_data=struct),
                allow_missing=True,
            )
        )
    print(f"Loaded {len(rows)} rows from {DATA_FILE} into '{datastore_id}'.")


def run_step(title: str, datastore_id: str, create_first: bool = False) -> None:
    print(f"\n=== {title} ({datastore_id}) ===")
    if create_first:
        create_datastore_if_missing(datastore_id)

    evolve_schema_standalone(SCHEMA_FILE, datastore_id)
    load_sample_rows(datastore_id)


if __name__ == "__main__":
    run_step("STEP 1: Update existing datastore", EXISTING_DS)
    run_step("STEP 2: Create/update second datastore", NEW_DS, create_first=True)
