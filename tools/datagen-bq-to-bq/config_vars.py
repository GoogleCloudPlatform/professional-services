"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

# Google Cloud Project Configuration
PROJECT_ID = "poc-env-aks-bq-admin"
LOCATION = "us-central1"
MODEL_ID="gemini-1.5-pro-002"

# BigQuery Configuration
target_bq_project_id = "poc-env-aks-bq-admin"
target_bq_dataset = "tdm_bigquery_demo_target"
source_bq_project_id = "poc-env-aks-bq-admin"
source_bq_dataset = "tdm_bigquery_demo"
audit_table = 'poc-env-aks-bq-admin.datageneration.audit_log'

# Input Table Names (as a string, then potentially parsed in main)
input_bq_table_names = (
    "poc-env-aks-bq-admin.tdm_bigquery_demo.Dim_Customer,"
    "poc-env-aks-bq-admin.tdm_bigquery_demo.Dim_Product,"
    "poc-env-aks-bq-admin.tdm_bigquery_demo.Fact_Transactions"
)


# Desired record counts for generated tables

user_counts = {
    "Dim_Customer": 10,
    "Dim_Product": 10,
    "Fact_Transactions": 20,
}


# GCS Configuration
gcs_bucket_name = "data-generation-usecase"

# Source Type
SOURCE_TYPE = "BigQuery"

# These will be initialized in main.py or passed around
# batch_id (generated dynamically)
# output_gcs_path (e.g., f"gs://{gcs_bucket_name}/poc-env-aks-bq-admin/tdm_output/{batch_id}/")
# staging_gcs_path (e.g., f"gs://{gcs_bucket_name}/poc-env-aks-bq-admin/tdm_staging/{batch_id}")
# staging_path_bigquery (e.g., f"gs://{gcs_bucket_name}/poc-env-aks-bq-admin/tdm_staging/bigquery/{batch_id}")


# Local output directory for Snowfakery
LOCAL_OUTPUT_BASE_DIR = "./output" # Snowfakery generates files here first, batch_id subfolder will be created
