# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from data_modelling_agent.sub_agents.modelling_orchestrator_agent.const import (
    GCS_BUCKET,
)
from data_modelling_agent.sub_agents.modelling_orchestrator_agent.sub_agents.modeller_agent.const import (
    BQ_METADATA_TASK,
)
from google.cloud import storage


def cleanup_metadata(metadata):
    metadata_lines = metadata.split("\n")
    cleaned_metadata_lines = []
    for line in metadata_lines:
        if "```"in line:
            continue
        if "true" in line:
            line = line.replace("true", "True")
        if "false" in line:
            line = line.replace("false", "False")
        cleaned_metadata_lines.append(line.strip())
    cleaned_metadata = "\n".join(cleaned_metadata_lines)
    return cleaned_metadata
    
def get_metadata_from_gcs(folder_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET)
    gcs_path = folder_name+"/"+BQ_METADATA_TASK+".txt"
    blob = bucket.blob(gcs_path)
    metadata = blob.download_as_text()
    return metadata