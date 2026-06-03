import google.auth
from google.adk.tools.bigquery import BigQueryCredentialsConfig, BigQueryToolset
from google.adk.tools.bigquery.config import BigQueryToolConfig, WriteMode

# --- BigQuery Toolkit Configuration ---

# Write modes define BigQuery access control of agent:
# ALLOWED: Tools will have full write capabilites.
# BLOCKED: Default mode. Effectively makes the tool read-only.
# PROTECTED: Only allows writes on temporary data for a given BigQuery session.
tool_config = BigQueryToolConfig(write_mode=WriteMode.BLOCKED)

# Initialize the tools to use the application default credentials (ADC).
# This works for local development after `gcloud auth application-default login`
# and for cloud environments like Cloud Run or Agent Engine.
application_default_credentials, _ = google.auth.default()
credentials_config = BigQueryCredentialsConfig(
    credentials=application_default_credentials
)

bigquery_toolset = BigQueryToolset(
    credentials_config=credentials_config,
    bigquery_tool_config=tool_config,
    tool_filter=[
        'list_dataset_ids',
        'get_dataset_info',
        'list_table_ids',
        'get_table_info',
        'execute_sql',
    ]
)