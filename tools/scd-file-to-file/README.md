SCD Type 2 Data Generation Utility
This Python utility automates the generation of Slowly Changing Dimension (SCD) Type 2 data, including updates, deletes, and inserts. It processes a source CSV file from Google Cloud Storage (GCS), applies SCD Type 2 logic based on user-defined parameters, and outputs the results to new CSV files in GCS.

Features
SCD Type 2 Updates: Identifies records for updates, sets the effective_to_date for the old record, and creates a new record with the updated information and a new effective_from_date.
SCD Type 2 Deletes (Logical): Marks records for deletion by setting their action_flag to 'D'.
SCD Type 2 Inserts: Generates new records with unique primary keys and populates SCD attributes like effective_from_date, effective_to_date (as null/NaT), and active_flag (as True).
Configurable Parameters: Allows users to specify input/output GCS paths, primary keys, SCD columns, date columns, and generation parameters (e.g., number of records for inserts, percentage for updates).
GCS Integration: Reads input data from and writes output data to Google Cloud Storage.
How it Works
The utility comprises two main operations:

Update and Delete Generation (scd_update_delete_generation):

Reads active records from the input GCS CSV file.
Splits a portion of these records for updates and the rest for logical deletes based on a configurable percentage.
For update records, it iterates through the specified SCD columns and modifies their values based on a sample of unique values from the source data. It sets the effective_to_date for these records to the current timestamp.
For delete records, it sets an action_flag to 'D'.
The processed update and delete records are then combined and uploaded to a specified GCS output path.
Insert Generation (scd_insert_generation):

Samples records from the source GCS CSV file to serve as a base for new inserts.
Generates a specified number of new records.
Assigns new unique primary keys (UUIDs) to these records.
Modifies the values in the specified SCD columns for these new records.
Sets the effective_from_date to the current timestamp, effective_to_date to NaT (Not a Time), and active_flag to True for these new records.
The newly generated insert records are uploaded to a specified GCS output path.
File Structure
scd-file-to-file/
├── main.py                  # Main script to orchestrate SCD operations
├── scd_operations.py        # Core logic for SCD update, delete, and insert generation
├── settings.py              # Configuration file for GCS paths, column names, and parameters
└── requirements.txt         # Python package dependencies
main.py: This script serves as the entry point for running the SCD generation processes. It imports configurations from settings.py and calls the relevant functions in scd_operations.py.
scd_operations.py: Contains the core functions scd_update_delete_generation and scd_insert_generation which handle the logic for creating SCD Type 2 update, delete, and insert records.
settings.py: This file stores all the necessary configurations such as GCS input and output paths, names of the primary key column, SCD columns, effective date columns, active flag column, and parameters for controlling the generation process (e.g., number of unique keys, percentage for updates, count for inserts).
requirements.txt: Lists the Python libraries required for the project to run. 
Prerequisites
The following Python libraries are required. They can be installed using pip:

Bash

pip install -r requirements.txt
The requirements.txt file includes: 

google-cloud-storage
pandas
numpy
fsspec
gcsfs
Ensure you have authenticated with Google Cloud and have the necessary permissions to read from the input GCS bucket and write to the output GCS bucket.

Configuration
All configurations are managed in the settings.py file. Before running the script, modify this file to specify:

GCS_INPUT_PATH: GCS path to the source CSV file.
GCS_UPDATE_DELETE_OUTPUT_PATH: GCS path where the generated update/delete CSV file will be saved.
GCS_INSERT_OUTPUT_PATH: GCS path where the generated insert CSV file will be saved.
PRIMARY_KEY_COLUMN: Name of the primary key column in your data.
SCD_COLUMN_LIST: Comma-separated string of column names to be treated as SCD columns.
EFFECTIVE_FROM_DATE_COLUMN: Name of the column for the effective start date.
EFFECTIVE_TO_DATE_COLUMN: Name of the column for the effective end date.
ACTIVE_FLAG_COLUMN: Name of the column indicating if a record is active.
UNIQUE_SCD_KEYS_FOR_GENERATION: Number of unique values to sample from each SCD column for generating changes.
PERCENTAGE_FOR_UPDATE_SCD_GENERATION: Percentage of records from the source to be considered for SCD updates (the rest are considered for deletes).
NUMBER_OF_INSERT_RECORD_COUNT: The number of new records to generate for inserts.
How to Run
To execute the SCD generation process, run the main.py script from the terminal within the scd-file-to-file directory:

Bash

python main.py
The script will:

Execute the SCD update and delete generation process.
Execute the SCD insert generation process.
Print status messages and the paths to the output files in GCS.
Input/Output
Input: A CSV file located at the GCS_INPUT_PATH specified in settings.py. This file should contain the source data for SCD processing and must include the columns defined in settings.py (primary key, SCD columns, etc.).
Output:
A CSV file containing records flagged for updates and deletes, saved to GCS_UPDATE_DELETE_OUTPUT_PATH.
A CSV file containing newly generated insert records, saved to GCS_INSERT_OUTPUT_PATH.
Key Functions
scd_operations.scd_update_delete_generation(...):
Reads data from GCS.
Identifies records for update based on PERCENTAGE_FOR_UPDATE_SCD_GENERATION.
Modifies SCD columns for update records and sets their effective_to_date.
Flags remaining records for deletion (sets action_flag to 'D').
Writes the combined update/delete data to GCS.
scd_operations.scd_insert_generation(...):
Samples from source data to create NUMBER_OF_INSERT_RECORD_COUNT new records.
Assigns new UUIDs as primary keys.
Modifies SCD columns for these new records.
Sets effective_from_date, effective_to_date (to NaT), and active_flag (to True).
Writes the new insert data to GCS.

Sources and related content
