from gcs_ops import export_bigquery_to_gcs
import settings  # Imports from scd_project/config/settings.py
import scd_operations
import uuid

# Generate unique batch id for each execution
batch_id = uuid.uuid4()
print("bacth_id=" + str(batch_id))

# Name of the Google Cloud Storage bucket for storing intermediate and output data.
gcs_bucket_name = settings.GCS_BUCKET_NAME

gcs_input_path = f"gs://{gcs_bucket_name}/scd/{batch_id}/input.csv"
gcs_update_delete_output_path = (
    f"gs://{gcs_bucket_name}/scd/{batch_id}/output_update_delete.csv"
)
gcs_insert_output_path = f"gs://{gcs_bucket_name}/scd/{batch_id}/output_insert_scd.csv"

# Call the function with your variables
export_bigquery_to_gcs(
    settings.PROJECT_ID, settings.BQ_INPUT_TABLE_NAME, gcs_input_path
)


def run_scd_processing():
    """
    Main function to run the SCD generation processes.
    """
    print("Starting SCD Update/Delete Generation Process...")
    upd_del_status = scd_operations.scd_update_delete_generation(
        gcs_input_path=gcs_input_path,
        gcs_output_path=gcs_update_delete_output_path,
        primary_key_column=settings.PRIMARY_KEY_COLUMN,
        scd_column_list=settings.SCD_COLUMN_LIST,
        effective_from_date_column=settings.EFFECTIVE_FROM_DATE_COLUMN,
        effective_to_date_column=settings.EFFECTIVE_TO_DATE_COLUMN,
        active_flag_column=settings.ACTIVE_FLAG_COLUMN,
        unique_scd_keys_for_generation=settings.UNIQUE_SCD_KEYS_FOR_GENERATION,
        percentage_for_update_scd_generation=settings.PERCENTAGE_FOR_UPDATE_SCD_GENERATION,
    )
    print(f"SCD Update/Delete Generation Status: {upd_del_status}\n")

    print("Starting SCD Insert Generation Process...")
    inst_status = scd_operations.scd_insert_generation(
        gcs_input_path=gcs_input_path,  # Source for sampling new records
        gcs_output_path=gcs_insert_output_path,
        primary_key_column=settings.PRIMARY_KEY_COLUMN,
        scd_column_list=settings.SCD_COLUMN_LIST,
        effective_from_date_column=settings.EFFECTIVE_FROM_DATE_COLUMN,
        effective_to_date_column=settings.EFFECTIVE_TO_DATE_COLUMN,
        active_flag_column=settings.ACTIVE_FLAG_COLUMN,
        unique_scd_keys_for_generation=settings.UNIQUE_SCD_KEYS_FOR_GENERATION,
        number_of_insert_record_count=settings.NUMBER_OF_INSERT_RECORD_COUNT,
    )
    print(f"SCD Insert Generation Status: {inst_status}\n")


if __name__ == "__main__":
    run_scd_processing()
