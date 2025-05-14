Synthetic Data Generation Pipeline: GCS to GCS
This project provides a robust pipeline for generating synthetic data based on sample data residing in Google Cloud Storage (GCS). It leverages Snowfakery for data generation and Google's Gemini model for intelligent schema detection and recipe creation. The pipeline includes pre-processing and post-processing steps, along with comprehensive audit logging capabilities.

Overview
The core functionality of this pipeline is to take input data from GCS, understand its structure (either through provided header files or AI-driven schema prediction), generate synthetic data that mimics the characteristics of the input data, and then store this synthetic data back into GCS. It also supports BigQuery as a data source.

Key Features
Flexible Data Source: Supports input data from both Google Cloud Storage (CSV files) and BigQuery tables.
AI-Powered Schema Handling:
If header files are provided in GCS, their schema is used directly.
If header files are not provided, the system uses Google's Gemini model to predict the schema, detect headers, and identify delimiters from the sample input files.
Synthetic Data Generation: Utilizes Snowfakery to generate synthetic data based on recipes. These recipes can be partly auto-generated with the help of the Gemini model by analyzing the input schema and sample data.
Pre-processing:
Extracts sample rows from input files.
Predicts if a header row is present.
Extracts custom headers if they follow a specific format ('HEADER...').
Predicts or reads schema (column names and types).
Appends column names to files if the original file lacks a header, creating staging files.
Detects the delimiter of the input files.
Post-processing:
Counts the number of generated records.
Converts the delimiter of the generated output files to match the input file's delimiter if they differ.
Removes column headers from the generated files if the original input did not have them.
Adds custom headers to the output files if they were present in the input.
Uploads the final processed synthetic data to a specified GCS output path.
Audit Logging: Captures detailed logs for each step of the process, including batch ID, input/output paths, schema details, record counts, and status. These logs are stored in a BigQuery table for traceability and monitoring.
Customizable Output: Allows users to specify the number of synthetic records to generate for each table.
Modular Design: The code is organized into logical modules for GCS operations, BigQuery operations, file processing, Snowfakery recipe generation, audit logging, and configuration.
Workflow
The data generation process is orchestrated by main.py and follows these general steps:

Initialization:

A unique batch_id is generated.
Google Cloud services (Vertex AI, BigQuery) are initialized.
Dynamic GCS paths for output and staging are defined using the batch_id.
Data Source Handling (if SOURCE_TYPE is "BigQuery"):

If the source is BigQuery, specified tables are exported as CSV files to a staging area in GCS. The paths to these CSVs then become the input_gcs_path for further processing.
File Pre-processing (file_processing_utils.py):

For each input file specified in config_vars.input_gcs_path:
Sample rows are extracted.
Gemini model predicts if a header row exists.
Gemini model attempts to extract any custom header.
Schema Determination:
If a corresponding header file is provided in config_vars.header_gcs_path, its content is used as the schema.
Otherwise, the Gemini model predicts the schema (column names and data types) based on the file name and sample rows.
Column names are extracted from the schema.
If the original file has no header, the extracted/predicted column names are appended to a new version of the file in a GCS staging path. Otherwise, the file is copied to staging as-is.
The delimiter of the input file is detected using the Gemini model.
All extracted attributes (header flag, custom header, schema, delimiter, staging path, etc.) are stored in the table_attributes dictionary.
Audit Logging - Start (audit_utils.py):

An initial entry for each table is logged to the BigQuery audit table with the status "In Progress". This entry includes details like batch ID, input paths, schema, and user-requested counts.
Synthetic Data Generation (snowfakery_gen.py):

Recipe Generation:
For each table, a Snowfakery recipe is generated. The Gemini model assists by creating a recipe draft based on the table's schema (from table_attributes) and sample records (from the staging GCS path). Prompts from prompts_collection.py guide this process.
The individual YAML recipes are combined.
Table relationships are inferred by Gemini (if multiple tables exist) to enhance the recipe.
The combined recipe is further refined (e.g., correcting object names, ensuring proper YAML syntax).
The user_counts from config_vars.py are used to set the number of records to generate for each object in the Snowfakery recipe.
Data Generation:
The final Snowfakery recipe is executed, generating synthetic data files (CSV by default) in a local temporary directory specific to the current batch_id.
File Post-processing (file_processing_utils.py):

For each generated local data file:
The number of generated data records (excluding header) is counted.
If the input file's delimiter (from table_attributes) was different from CSV's comma, the generated file's delimiter is converted.
If the original input file did not have a header (as per column_header_flag in table_attributes), the header row is removed from the generated file.
If a custom_header was extracted during pre-processing, it is added to the top of the generated file.
The processed file is uploaded from the local temporary directory to the final GCS output path (output_gcs_path defined in main.py). The path to this final GCS file is stored in table_attributes.
Audit Logging - End (audit_utils.py):

A final entry for each table is logged to the BigQuery audit table with the status "Completed" and the actual num_records_generated.
Cleanup:

The local temporary directory created for Snowfakery output is removed.
Prerequisites
The following Python libraries are required, as listed in requirements.txt:

google-cloud-aiplatform
snowfakery==3.6.3
gcsfs
pandas
google-cloud-storage
google-cloud-bigquery
PyYAML
google-api-core
Configuration (config_vars.py)
The pipeline's behavior is primarily controlled by the config_vars.py file. Key configuration options include:

PROJECT_ID: Your Google Cloud Project ID.
LOCATION: The Google Cloud region/location (e.g., "us-central1").
input_gcs_path: A dictionary mapping table names to their GCS input file paths.
Example: {"Dim_Customer": "gs://bucket/path/to/Dim_Customer.csv"}
header_gcs_path: An optional dictionary mapping table names to their corresponding header file paths in GCS. If a table has an entry here, its schema will be read from this file instead of being predicted by Gemini.
Example: {"Dim_Date": "gs://bucket/path/to/header_Dim_Date.csv"}
user_counts: A dictionary specifying the desired number of synthetic records to generate for each table.
Example: {"Dim_Customer": 100, "Fact_Transactions": 500}
gcs_bucket_name: The GCS bucket name used for storing output and staging files.
audit_table: The full BigQuery table ID for storing audit logs (e.g., your_project.your_dataset.audit_log_table).
SOURCE_TYPE: Specifies the source of the data. Currently supports "GCS". If you intend to use BigQuery as a source, this would be set to "BigQuery", and additional BigQuery-specific configurations (like input_bq_table_names, source_bq_project_id, source_bq_dataset, target_bq_project_id, target_bq_dataset) would be relevant.
LOCAL_OUTPUT_BASE_DIR: The base local directory where Snowfakery will temporarily write generated files before they are uploaded to GCS. A subfolder named with the batch_id will be created here.
Dynamic paths like output_gcs_path, staging_gcs_path, and staging_path_bigquery are constructed in main.py using the gcs_bucket_name, PROJECT_ID, and the generated batch_id.

File Descriptions
main.py: The main script that orchestrates the entire data generation pipeline.
config_vars.py: Contains all the necessary configurations for the pipeline, such as project ID, GCS paths, BigQuery table names, and user-defined record counts.
gcs_ops.py: Handles all Google Cloud Storage operations, including reading files, extracting sample rows, appending headers, and uploading files.
bq_ops.py: Manages operations related to Google BigQuery, such as exporting tables to GCS (if SOURCE_TYPE is "BigQuery") and potentially loading generated data back to BigQuery (though the current primary target is GCS).
file_processing_utils.py: Contains functions for pre-processing input files (header detection, schema prediction using Gemini, delimiter detection) and post-processing generated files (delimiter conversion, header manipulation).
snowfakery_gen.py: Responsible for generating Snowfakery recipes (with assistance from Gemini) and then running Snowfakery to produce synthetic data based on these recipes.
audit_utils.py: Manages the logging of audit trails to a specified BigQuery table, recording the start and end of processing for each table along with relevant metadata.
prompts_collection.py: Stores the various prompts used to interact with the Gemini model for tasks like delimiter prediction, header extraction, schema prediction, and Snowfakery recipe generation.
requirements.txt: Lists all the Python dependencies required to run the project. 
How to Run
Ensure all prerequisites listed in requirements.txt are installed in your Python environment.
Configure all necessary parameters in config_vars.py according to your GCP environment and data locations.
Execute the main script:
Bash

python main.py
The pipeline will then run through the workflow described above, logging its progress to the console and creating audit entries in the specified BigQuery table. Generated synthetic data will be placed in the GCS output location defined by output_gcs_path (which includes the batch_id).
Customization
Input Data: Modify input_gcs_path in config_vars.py to point to your source CSV files in GCS. If using BigQuery as a source, configure the relevant BigQuery settings and set SOURCE_TYPE="BigQuery".
Header Files: Provide paths to header files in header_gcs_path if you want to use predefined schemas instead of Gemini's prediction.
Output Volume: Adjust user_counts in config_vars.py to control the number of synthetic records generated for each table.
Gemini Prompts: The prompts used for interacting with the Gemini model are located in prompts_collection.py. These can be fine-tuned if specific modifications to the AI's behavior are needed for schema prediction or recipe generation.
Audit Table Schema: The audit logging functions in audit_utils.py assume a specific schema for the BigQuery audit table. Ensure your audit table matches this structure or modify the functions accordingly.
Snowfakery Features: For more advanced synthetic data needs, the recipe generation logic in snowfakery_gen.py can be extended to leverage more of Snowfakery's capabilities.