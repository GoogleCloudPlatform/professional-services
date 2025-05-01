# Google Cloud Project Configuration
PROJECT_ID = "<project_id>"
LOCATION = "us-central1"

# BigQuery Configuration
target_bq_project_id = "<target_project_id>"
target_bq_dataset = "tdm_bigquery_demo_target"
source_bq_project_id = "<source_project_id>"
source_bq_dataset = "tdm_bigquery_demo"
audit_table = "<project_id>.datageneration.audit_log"

# Input Table Names (as a string, then potentially parsed in main)
input_bq_table_names = (
    "<project_id>.tdm_bigquery_demo.Dim_Account,"
    "<project_id>.tdm_bigquery_demo.Fact_Transactions"
)
""" input_bq_table_names = (
    "<project_id>.tdm_bigquery_demo.Dim_Account,"
    "<project_id>.tdm_bigquery_demo.Dim_Account_Type,"
    "<project_id>.tdm_bigquery_demo.Dim_Branch,"
    "<project_id>.tdm_bigquery_demo.Dim_Channel,"
    "<project_id>.tdm_bigquery_demo.Dim_Customer,"
    "<project_id>.tdm_bigquery_demo.Dim_Customer_Segment,"
    "<project_id>.tdm_bigquery_demo.Dim_Date,"
    "<project_id>.tdm_bigquery_demo.Dim_Location,"
    "<project_id>.tdm_bigquery_demo.Dim_Product,"
    "<project_id>.tdm_bigquery_demo.Dim_Product_Category,"
    "<project_id>.tdm_bigquery_demo.Dim_Time,"
    "<project_id>.tdm_bigquery_demo.Dim_Transaction_Type,"
    "<project_id>.tdm_bigquery_demo.Fact_Transactions"
)
"""

# Desired record counts for generated tables
user_counts = {
    "Dim_Account": 10,
    "Fact_Transactions": 20,
}
"""user_counts = {
    "Dim_Date": 10,
    "Dim_Time": 10,
    "Dim_Customer": 10,
    "Dim_Customer_Segment": 10,
    "Dim_Location": 10,
    "Dim_Account": 10,
    "Dim_Account_Type": 10,
    "Dim_Branch": 10,
    "Dim_Product": 10,
    "Dim_Product_Category": 10,
    "Dim_Channel": 10,
    "Dim_Transaction_Type": 10,
    "Fact_Transactions": 20,
}
"""

# GCS Configuration
gcs_bucket_name = "data-generation-usecase"

# Source Type
SOURCE_TYPE = "BigQuery"  # or "GCS"

# These will be initialized in main.py or passed around
# batch_id (generated dynamically)
# output_gcs_path (e.g., f"gs://{gcs_bucket_name}/<project_id>/tdm_output/{batch_id}/")
# staging_gcs_path (e.g., f"gs://{gcs_bucket_name}/<project_id>/tdm_staging/{batch_id}")
# staging_path_bigquery (e.g., f"gs://{gcs_bucket_name}/<project_id>/tdm_staging/bigquery/{batch_id}")

# Local output directory for Snowfakery
LOCAL_OUTPUT_BASE_DIR = "./output"  # Snowfakery generates files here first, batch_id subfolder will be created
