import uuid
import os
import shutil
from google.cloud import (
    bigquery,
)  # Removed storage import, individual modules handle it
from vertexai import init as vertex_init  # Preserving 'init' alias
from vertexai.generative_models import GenerativeModel, GenerationConfig

import config_vars
import bq_ops
import file_processing_utils
import snowfakery_gen
import audit_utils


def main():
    """Main function to orchestrate the synthetic data generation pipeline."""
    # Variables from notebook, initialized or generated
    batch_id = uuid.uuid4()  # Notebook uses this, then converts to str for logging
    print(f"Starting pipeline with batch_id: {str(batch_id)}")

    # Initialize clients and Vertex AI
    try:
        vertex_init(project=config_vars.PROJECT_ID, location=config_vars.LOCATION)
        gemini_model = GenerativeModel(
            "gemini-1.5-pro-002", generation_config=GenerationConfig(temperature=0)
        )
        bq_client_main = bigquery.Client(project=config_vars.PROJECT_ID)
    except Exception as e:
        print(f"Error during initialization: {e}")
        return

    # Define dynamic GCS paths using batch_id, preserving notebook structure
    output_gcs_path = f"gs://{config_vars.gcs_bucket_name}/{config_vars.PROJECT_ID}/tdm_output/{str(batch_id)}/"
    staging_gcs_path = f"gs://{config_vars.gcs_bucket_name}/{config_vars.PROJECT_ID}/tdm_staging/{str(batch_id)}"  # No trailing slash as per notebook
    staging_path_bigquery = f"gs://{config_vars.gcs_bucket_name}/{config_vars.PROJECT_ID}/tdm_staging/bigquery/{str(batch_id)}"  # No trailing slash

    # Initialize maps/dicts as in notebook
    table_attributes = {}
    input_gcs_path = config_vars.input_gcs_path
    header_gcs_path = config_vars.header_gcs_path

    # Local output directory for Snowfakery, will append batch_id
    local_snowfakery_output_base = config_vars.LOCAL_OUTPUT_BASE_DIR

    try:
        # 1. Export BigQuery Data to GCS (if source is BigQuery)
        if config_vars.SOURCE_TYPE == "BigQuery":
            print("\\n--- Exporting BigQuery tables to GCS ---")
            # The export function in notebook populates a global 'input_gcs_path', here it returns it
            input_gcs_path = bq_ops.export_bigquery_table_to_bq_gcs_staging(
                bq_client_main,
                config_vars.input_bq_table_names,  # Pass the string of table names
                staging_path_bigquery,  # Pass the batch-specific path
                input_gcs_path,
            )
            if not input_gcs_path:  # Check if the dictionary is empty
                raise Exception(
                    "Failed to export BigQuery tables or input_gcs_path map is empty."
                )
        # Add elif for SOURCE_TYPE == "GCS" if needed, similar to previous response

        # 2. Pre-process Source Files
        print("\\n--- Pre-processing source files ---")
        # This function in notebook uses/updates global 'table_attributes', here it returns it
        table_attributes = file_processing_utils.file_pre_processing(
            gemini_model,
            input_gcs_path,  # Pass the map generated above
            staging_gcs_path,  # Pass the general staging path for intermediate files
            header_gcs_path,  # Pass the (potentially empty) header_gcs_path map
            table_attributes,
        )
        if not table_attributes or not any(
            attrs.get("staging_gcs_path") for attrs in table_attributes.values()
        ):
            raise Exception(
                "File preprocessing failed or no staging paths were generated."
            )

        # 3. Start Audit Log
        print("\\n--- Logging start entries to audit table ---")
        audit_utils.start_audit_log(
            bq_client_main, batch_id, input_gcs_path, table_attributes, header_gcs_path
        )

        # 4. Generate Synthetic Data using Snowfakery (combines recipe gen and run)
        print("\\n--- Generating synthetic data (recipes and execution) ---")
        # Create a batch-specific local output directory for Snowfakery
        local_snowfakery_output_batch = os.path.join(
            local_snowfakery_output_base, str(batch_id)
        )
        if os.path.exists(local_snowfakery_output_batch):
            shutil.rmtree(local_snowfakery_output_batch)
        os.makedirs(local_snowfakery_output_batch, exist_ok=True)

        # The 'generate_output_data' function in notebook handles recipe creation and generation
        generation_successful = snowfakery_gen.generate_output_data(
            gemini_model,
            table_attributes,  # Pass current table_attributes
            local_snowfakery_output_batch,  # Pass local output dir for this batch
        )
        if not generation_successful:
            raise Exception("Snowfakery data generation process failed.")

        # 5. Post-process Generated Files
        print("\\n--- Post-processing generated files ---")
        # This function updates and returns table_attributes with num_records_generated and output_gcs_path
        table_attributes = file_processing_utils.file_post_processing(
            input_gcs_path,  # Pass original input_gcs_path for iteration reference
            table_attributes,  # Pass current table_attributes
            output_gcs_path,  # Base GCS path for final outputs (batch specific)
            local_snowfakery_output_batch,  # Local directory where generated files are
        )

        # 6. End Audit Log
        print("\\n--- Logging end entries to audit table ---")
        audit_utils.end_audit_log(
            bq_client_main, batch_id, input_gcs_path, table_attributes, header_gcs_path
        )
        print(f"Pipeline completed successfully for batch_id: {str(batch_id)}")

    finally:
        # Clean up local Snowfakery output directory for the current batch
        if "local_snowfakery_output_batch" in locals() and os.path.exists(
            local_snowfakery_output_batch
        ):
            try:
                shutil.rmtree(local_snowfakery_output_batch)
                print(f"Cleaned up local directory: {local_snowfakery_output_batch}")
            except Exception as cleanup_error:
                print(
                    f"Error cleaning up local directory {local_snowfakery_output_batch}: {cleanup_error}"
                )


if __name__ == "__main__":
    main()
