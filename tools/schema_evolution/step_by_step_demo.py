"""Simple step-by-step demo for Vertex AI Search Schema Evolution.

Files used:
  - Schema:      schemas/example_schema.json
  - Sample data: schemas/sample_data.json

Run:
  .venv/bin/python step_by_step_demo.py
"""

import json
from pathlib import Path
from google.api_core import exceptions as gexc
from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1 as discoveryengine
from google.protobuf import struct_pb2

from schema_evolution import evolve_schema

PROJECT_ID = "poc-projects-513715"
LOCATION = "global"
EXISTING_DS = "se-e2e-empty-global"
NEW_DS = "se-step-by-step-demo"

SCHEMA_FILE = Path("schemas/example_schema.json")
DATA_FILE = Path("schemas/sample_data.json")


def load_sample_rows(datastore_id: str) -> None:
    """Load sample rows from schemas/sample_data.json into the datastore."""
    rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    client = discoveryengine.DocumentServiceClient(
        client_options=ClientOptions(quota_project_id=PROJECT_ID)
    )
    branch = (
        f"projects/{PROJECT_ID}/locations/{LOCATION}"
        f"/collections/default_collection/dataStores/{datastore_id}/branches/default_branch"
    )
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


def create_datastore_if_missing(datastore_id: str) -> None:
    """Create a blank datastore if it does not already exist."""
    client = discoveryengine.DataStoreServiceClient(
        client_options=ClientOptions(quota_project_id=PROJECT_ID)
    )
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


def run_step(title: str, datastore_id: str, create_first: bool = False) -> None:
    print(f"\n=== {title} ({datastore_id}) ===")
    if create_first:
        create_datastore_if_missing(datastore_id)

    # 1. Update schema from schemas/example_schema.json
    result = evolve_schema(
        SCHEMA_FILE,
        project_id=PROJECT_ID,
        location=LOCATION,
        datastore_id=datastore_id,
    )
    print(result.summary())

    # 2. Load sample rows from schemas/sample_data.json
    load_sample_rows(datastore_id)


if __name__ == "__main__":
    run_step("STEP 1: Update existing datastore", EXISTING_DS)
    run_step("STEP 2: Create/update second datastore", NEW_DS, create_first=True)
