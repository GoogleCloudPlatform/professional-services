"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

# Google Cloud Project Configuration
PROJECT_ID = "poc-env-aks-bq-admin"
LOCATION = "us-central1"
MODEL_ID="gemini-1.5-pro-002"

#GCS File Paht for the Source Input Files
input_gcs_path = {
    "Dim_Date": "gs://data-generation-usecase/poc-env-aks-bq-admin/tdm_without_header/Dim_Date/input/Dim_Date.csv",
    "Dim_Customer": "gs://data-generation-usecase/poc-env-aks-bq-admin/tdm_without_header/Dim_Customer/input/Dim_Customer.csv",
    "Fact_Transactions": "gs://data-generation-usecase/poc-env-aks-bq-admin/tdm_without_header/Fact_Transactions/input/Fact_Transactions.csv"
}

#GCS File Path for the Header Files for the corresonding Input Files
header_gcs_path = {
    "Dim_Date":"gs://data-generation-usecase/poc-env-aks-bq-admin/tdm_without_header/Dim_Date/input/header_Dim_Date.csv"
}

# Dictionary specifying the desired number of records to generate for each table.
user_counts = {
"Dim_Date":10,
"Dim_Customer":10,
"Fact_Transactions":20,
}

# GCS Configuration
gcs_bucket_name = "data-generation-usecase"
audit_table = 'poc-env-aks-bq-admin.datageneration.audit_log'


# Source Type
SOURCE_TYPE = "GCS"

# These will be initialized in main.py or passed around
# batch_id (generated dynamically)
# output_gcs_path (e.g., f"gs://{gcs_bucket_name}/poc-env-aks-bq-admin/tdm_output/{batch_id}/")
# staging_gcs_path (e.g., f"gs://{gcs_bucket_name}/poc-env-aks-bq-admin/tdm_staging/{batch_id}")
# staging_path_bigquery (e.g., f"gs://{gcs_bucket_name}/poc-env-aks-bq-admin/tdm_staging/bigquery/{batch_id}")


# Local output directory for Snowfakery
LOCAL_OUTPUT_BASE_DIR = "./output" # Snowfakery generates files here first, batch_id subfolder will be created