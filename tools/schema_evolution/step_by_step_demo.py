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

"""Step-by-step demo: use the schema_evolution package inside your own script.

Files used:
  - Schema:      schemas/example_schema.json
  - Sample data: schemas/sample_data.json

Run (from anywhere; works straight from a clone, no `pip install .` needed):
  export GCP_PROJECT_ID=my-project GCP_LOCATION=global \
         EXISTING_DATASTORE_ID=my-ds NEW_DATASTORE_ID=my-new-ds
  python3 step_by_step_demo.py
"""

import json
import os
import sys
from pathlib import Path

from google.api_core import exceptions as gexc
from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1 as discoveryengine
from google.protobuf import struct_pb2

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "src"))  # allow running from a clone without installing

from schema_evolution import evolve_schema  # noqa: E402

PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "your-gcp-project-id")
LOCATION = os.environ.get("GCP_LOCATION", "global")
EXISTING_DS = os.environ.get("EXISTING_DATASTORE_ID", "your-existing-datastore")
NEW_DS = os.environ.get("NEW_DATASTORE_ID", "your-new-datastore")

SCHEMA_FILE = BASE_DIR / "schemas" / "example_schema.json"
DATA_FILE = BASE_DIR / "schemas" / "sample_data.json"


def _client_options() -> ClientOptions:
    opts = {"quota_project_id": PROJECT_ID}
    if LOCATION != "global":
        opts["api_endpoint"] = f"{LOCATION}-discoveryengine.googleapis.com"
    return ClientOptions(**opts)


def _collection_path() -> str:
    return f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection"


def load_sample_rows(datastore_id: str) -> None:
    """Load sample rows from schemas/sample_data.json into the datastore."""
    rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    client = discoveryengine.DocumentServiceClient(client_options=_client_options())
    branch = f"{_collection_path()}/dataStores/{datastore_id}/branches/default_branch"
    for row in rows:
        struct = struct_pb2.Struct()
        struct.update(row["data"])
        client.update_document(
            request=discoveryengine.UpdateDocumentRequest(
                document=discoveryengine.Document(name=f"{branch}/documents/{row['id']}", struct_data=struct),
                allow_missing=True,
            )
        )
    print(f"Loaded {len(rows)} rows from {DATA_FILE.name} into '{datastore_id}'.")


def create_datastore_if_missing(datastore_id: str) -> None:
    """Create a blank datastore if it does not already exist."""
    client = discoveryengine.DataStoreServiceClient(client_options=_client_options())
    try:
        client.create_data_store(
            parent=_collection_path(),
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

    # 1. Create/update the schema from schemas/example_schema.json
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
