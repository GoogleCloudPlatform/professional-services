# Configuration settings for the SCD processing application

# Google Cloud Storage Paths
GCS_INPUT_PATH = "gs://data-generation-usecases/adk/input.csv"
GCS_UPDATE_DELETE_OUTPUT_PATH = (
    "gs://data-generation-usecases/adk/output_update_delete.csv"
)
GCS_INSERT_OUTPUT_PATH = "gs://data-generation-usecases/scd/adk/output_insert_scd.csv"

# Column Names
PRIMARY_KEY_COLUMN = "customer_id"
SCD_COLUMN_LIST = "city,preferred_payment_method"  # Comma-separated
EFFECTIVE_FROM_DATE_COLUMN = "effective_from_date"
EFFECTIVE_TO_DATE_COLUMN = "effective_to_date"
ACTIVE_FLAG_COLUMN = "active_flag"

# SCD Generation Parameters
UNIQUE_SCD_KEYS_FOR_GENERATION = 8
PERCENTAGE_FOR_UPDATE_SCD_GENERATION = 0.7
NUMBER_OF_INSERT_RECORD_COUNT = 26
