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
    DDL_TASK,
)
from google.cloud import storage


def get_ddl_from_gcs(folder_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET)
    gcs_path = folder_name+"/"+DDL_TASK+".txt"
    blob = bucket.blob(gcs_path)
    ddl = blob.download_as_text()
    return ddl