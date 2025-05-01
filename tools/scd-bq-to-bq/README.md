SCD Type 2 Data Processor for BigQuery
Overview
This project implements a Slowly Changing Dimension (SCD) Type 2 data processing pipeline. It extracts data from a source BigQuery table, stages it in Google Cloud Storage (GCS), and then processes this data to generate records for inserts, updates, and deletes, adhering to SCD Type 2 principles. The processed records are outputted as CSV files in GCS, ready to be loaded into a target BigQuery table.

Features
SCD Type 2 Implementation: Generates records to manage historical data changes.
Handles Inserts: Identifies and prepares new records for insertion.
Handles Updates: Identifies changes in existing records and creates new versions for updated records, expiring the old ones.
Handles Deletes: Marks records for logical deletion or end-dates their validity.
BigQuery Integration: Reads data from a specified BigQuery table.
Google Cloud Storage Staging: Uses GCS as an intermediate staging layer for data processing.
Configurable: Key parameters such as project ID, table names, column names, and processing logic are configurable through a settings file.
Workflow
The data processing workflow is as follows:

Initialization: A unique batch ID is generated for each execution run to track the process.
Data Extraction: Data is exported from the source BigQuery table specified in the settings.py file to a CSV file in a designated GCS bucket. This serves as the input for subsequent SCD processing steps.
SCD Update and Delete Generation:
The input CSV data from GCS is read.
The script identifies records that require updates based on changes in specified SCD columns and also identifies records for deletion.
New versions of updated records are created with appropriate effective date changes, and existing records are marked with an end date.
Records flagged for deletion are processed accordingly (e.g., by setting an active_flag to false or updating effective_to_date).
The generated update and delete records are written to a new CSV file in GCS.
SCD Insert Generation:
The input CSV data from GCS (or a sample from it) is used to generate new insert records.
New primary keys are generated for these insert records.
The generated insert records are written to a separate CSV file in GCS.
Setup and Installation
Prerequisites
Python 3.x
Google Cloud SDK installed and configured with appropriate authentication and permissions for:
Google BigQuery (read from source table, potentially write to target table - though this part is not in the current scripts)
Google Cloud Storage (read and write access to the specified bucket)
Required Python packages as listed in requirements.txt. 
Installation
Clone the repository or download the codebase.
Navigate to the project directory.
Install the necessary Python packages:
Bash

pip install -r requirements.txt
Configuration
All configurations are managed in the scd bq-to-bq/settings.py file. You need to update this file with your specific Google Cloud Project details, BigQuery table names, GCS bucket information, and column mappings.

Key configuration variables in settings.py:

PROJECT_ID: Your Google Cloud Project ID.
GCS_BUCKET_NAME: The GCS bucket used for staging and output files.
BQ_INPUT_TABLE_NAME: The fully qualified name of your source BigQuery table (e.g., your_project.your_dataset.your_table).
PRIMARY_KEY_COLUMN: The name of the primary key column in your source table.
SCD_COLUMN_LIST: A comma-separated string of column names that should be tracked for changes (SCD Type 2 columns).
EFFECTIVE_FROM_DATE_COLUMN: The column name for storing the start date of a record's validity.
EFFECTIVE_TO_DATE_COLUMN: The column name for storing the end date of a record's validity.
ACTIVE_FLAG_COLUMN: The column name for indicating if a record is currently active.
UNIQUE_SCD_KEYS_FOR_GENERATION: Number of unique values from SCD columns to use when generating example update/insert data.
PERCENTAGE_FOR_UPDATE_SCD_GENERATION: Percentage of active records from the source to be considered for generating update/delete operations.
NUMBER_OF_INSERT_RECORD_COUNT: The number of new insert records to generate.
Usage
To run the SCD processing pipeline, execute the main.py script from the project's root directory:

Bash

python scd bq-to-bq/main.py
The script will:

Print the generated batch_id.
Export the BigQuery table to GCS.
Run the SCD update/delete generation process and print its status.
Run the SCD insert generation process and print its status.
Output CSV files containing the generated insert, update, and delete records will be placed in the GCS bucket under a path structured with the batch_id:

gs://<GCS_BUCKET_NAME>/scd/<batch_id>/input.csv (staging file from BigQuery)
gs://<GCS_BUCKET_NAME>/scd/<batch_id>/output_update_delete.csv
gs://<GCS_BUCKET_NAME>/scd/<batch_id>/output_insert_scd.csv
Code Structure
The project is organized into the following Python files:

scd bq-to-bq/main.py: The entry point of the application. It orchestrates the overall SCD processing workflow by calling functions from gcs_ops.py and scd_operations.py.
scd bq-to-bq/scd_operations.py: Contains the core logic for generating SCD Type 2 records. It includes functions for:
scd_update_delete_generation: Processes the input data to create records for updates and deletions.
scd_insert_generation: Generates new records for insertion.
scd bq-to-bq/gcs_ops.py: Provides utility functions for Google Cloud Storage operations, specifically export_bigquery_to_gcs which exports a BigQuery table to a CSV file in GCS.
scd bq-to-bq/settings.py: A configuration file holding all the necessary parameters like project IDs, table names, column mappings, and SCD processing parameters.
scd bq-to-bq/requirements.txt: Lists all the Python package dependencies for the project