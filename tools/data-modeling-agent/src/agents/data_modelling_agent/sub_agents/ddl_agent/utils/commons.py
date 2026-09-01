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