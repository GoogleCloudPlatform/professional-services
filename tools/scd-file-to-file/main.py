import settings  # Imports from scd_project/config/settings.py
import scd_operations


def run_scd_processing():
    """
    Main function to run the SCD generation processes.
    """
    print("Starting SCD Update/Delete Generation Process...")
    upd_del_status = scd_operations.scd_update_delete_generation(
        gcs_input_path=settings.GCS_INPUT_PATH,
        gcs_output_path=settings.GCS_UPDATE_DELETE_OUTPUT_PATH,
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
        gcs_input_path=settings.GCS_INPUT_PATH,  # Source for sampling new records
        gcs_output_path=settings.GCS_INSERT_OUTPUT_PATH,
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
