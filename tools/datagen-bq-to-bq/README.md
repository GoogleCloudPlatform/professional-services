Synthetic Data Generation Pipeline (BigQuery to BigQuery)
This project provides a Python-based pipeline for generating synthetic data based on existing table structures and sample data in Google BigQuery. It leverages generative AI for tasks like schema inference and data generation recipe creation, Snowfakery for producing the synthetic data, and Google Cloud services (BigQuery, Google Cloud Storage) for data handling and orchestration. The pipeline also includes capabilities for pre-processing input data, post-processing generated data, and detailed audit logging.

Key Features
BigQuery Integration: Seamlessly reads data and schema from source BigQuery tables and loads generated synthetic data into target BigQuery tables. 
Generative AI-Powered: Utilizes generative models (e.g., Gemini) for:
Predicting schema (column names, data types) from sample data.
Identifying file properties like delimiters and header presence.
Generating Snowfakery recipes based on inferred schemas and sample data.
Synthetic Data Generation with Snowfakery: Employs Snowfakery to create realistic synthetic data based on dynamically generated recipes.
Data Pre-processing:
Extracts sample data from source files (exported from BigQuery or provided via GCS).
Predicts and handles column headers.
Detects file delimiters.
Prepares data for recipe generation by staging it in GCS, adding headers if necessary.
Data Post-processing:
Adjusts the delimiter of generated files to match input formats.
Removes or adds column headers as per original data structure.
Adds custom headers if specified.
Counts the number of generated records.
Uploads finalized synthetic data to a GCS output path.
Audit Logging: Records detailed information about each processing step, including batch ID, input/output paths, record counts, status, and timestamps into a designated BigQuery audit table.
Google Cloud Storage (GCS) Utilization: Uses GCS for staging intermediate data (e.g., exported BigQuery tables, pre-processed files) and storing final synthetic data outputs before loading to BigQuery. 
Customizable Configuration: Allows users to easily configure project settings, BigQuery details, GCS paths, table names, and desired record counts for synthetic data generation through a central configuration file (config_vars.py).
Workflow
The data generation process is orchestrated by main.py and follows these general steps:

Initialization:

A unique batch_id is generated for the run.
Google Cloud clients (BigQuery, Vertex AI) are initialized.
Dynamic GCS paths for output and staging are constructed using the batch_id.
Local directories for Snowfakery output are prepared.
Export BigQuery Data to GCS (Conditional):

If SOURCE_TYPE in config_vars.py is set to "BigQuery", specified source tables are exported from BigQuery to a staging area in GCS as CSV files.  The GCS paths of these exported files are tracked.
File Pre-processing (file_processing_utils.py):

For each input file (from GCS):
Sample rows are extracted.
A generative model predicts if a header row is present.
Custom headers (if any specific format exists) are extracted.
The schema (column names and data types) is predicted using a generative model.
Column names are extracted from the predicted schema.
If the original file doesn't have a header, the predicted column names are prepended to a new version of the file in a GCS staging location. Otherwise, the file is copied as is to the staging location.
The file delimiter is detected.
Attributes for each table (header flag, custom header, schema, delimiter, staging GCS path) are stored.
Start Audit Log (audit_utils.py):

An initial entry for each table being processed is logged to the BigQuery audit table, marking the status as "In Progress".
Generate Synthetic Data (snowfakery_gen.py):

Recipe Generation:
For each table, a Snowfakery recipe (YAML format) is generated. This involves:
Using a generative model (Gemini) with prompts from prompts_collection.py.
Providing the model with the inferred schema and sample data (from the staged GCS files).
The model generates a recipe, which may undergo correction steps (e.g., for YAML syntax, curly brace usage).
Table relationships are identified (using the generative model and combined schemas) to refine the recipes with appropriate primary/foreign key handling.
Data Generation:
The generated and refined YAML recipes are updated with user-defined record counts from config_vars.py.
Snowfakery's generate_data function is called with the updated recipes to produce synthetic data files (CSV) in a local batch-specific directory.
File Post-processing (file_processing_utils.py):

For each generated synthetic data file (locally):
The number of data records generated is counted.
The file's delimiter is converted to match the original input file's delimiter (if different from CSV's comma).
The column header is removed if the original source file did not have one.
A custom header (if extracted during pre-processing) is added to the top of the file.
The processed file is uploaded to the final GCS output path for that table and batch.
Table attributes are updated with the count of generated records and the final output GCS path.
Load Data to BigQuery (bq_ops.py):

For each table, the generated and post-processed synthetic data is loaded from its GCS output path into the corresponding target BigQuery table. 
The target table is created if it doesn't exist, using the schema of the original source table. 
Data is appended to the target table. 
End Audit Log (audit_utils.py):

A final entry for each table is logged to the BigQuery audit table, updating the status to "Completed" and recording the number of records generated.
Cleanup:

The local directory created for Snowfakery outputs for the current batch is removed.
Module Descriptions
main.py: The main script that orchestrates the entire synthetic data generation pipeline from start to finish.
config_vars.py: Contains all the necessary configuration variables for the project, such as GCP project IDs, BigQuery dataset and table names, GCS bucket names, and desired record counts for generation.
bq_ops.py: Handles all BigQuery related operations. This includes exporting tables from BigQuery to GCS, creating target tables if they don't exist (copying schema from source tables), and loading data from GCS into BigQuery tables. 
gcs_ops.py: Manages interactions with Google Cloud Storage. Functions include appending headers to files in GCS, retrieving filenames and sample rows from GCS files, uploading local files to GCS, and reading GCS files to determine properties like delimiters using a generative model.
file_processing_utils.py: Contains utilities for pre-processing input source files and post-processing the synthetically generated files.
Pre-processing involves: determining if a header exists, extracting custom headers, predicting schema, extracting column names, appending headers to files in GCS if needed, and detecting file delimiters.
Post-processing involves: counting generated records, converting delimiters, removing column headers if necessary, adding custom headers, and uploading the final files to GCS.
snowfakery_gen.py: Responsible for the core synthetic data generation. It uses generative AI (Gemini) along with prompts from prompts_collection.py to generate Snowfakery recipes based on table schemas and sample data. It then uses these recipes to invoke Snowfakery and produce the synthetic data files. It also handles relationship building between tables for more consistent data.
audit_utils.py: Manages logging audit trails to a specified BigQuery table. It logs the start and end of the processing for each table within a batch, including details like GCS paths, record counts, and status.
prompts_collection.py: A collection of prompt strings fed to the generative AI model (Gemini) for various tasks. These tasks include delimiter prediction, custom header extraction, schema prediction, Snowfakery recipe creation, YAML correction, relationship building, and object name correction in recipes.
requirements.txt: Lists all the Python package dependencies required to run the project, such as google-cloud-aiplatform, snowfakery, pandas, etc.
Customization Options
The primary way to customize the pipeline is by modifying the config_vars.py file. Key parameters include:

PROJECT_ID: Your Google Cloud Project ID.
LOCATION: The GCP region for services like Vertex AI.
target_bq_project_id: Project ID for the target BigQuery dataset.
target_bq_dataset: Dataset name in BigQuery where synthetic data will be loaded.
source_bq_project_id: Project ID for the source BigQuery dataset (if SOURCE_TYPE is "BigQuery").
source_bq_dataset: Dataset name in BigQuery from which source data/schema is read.
audit_table: Full path to the BigQuery table used for audit logging (e.g., project.dataset.table).
input_bq_table_names: A comma-separated string of full BigQuery table names to be used as sources (e.g., project.dataset.table1,project.dataset.table2).
user_counts: A Python dictionary mapping table names (short names, e.g., "Dim_Account") to the desired number of synthetic records to generate for that table.
gcs_bucket_name: The name of the GCS bucket to be used for staging and output files.
SOURCE_TYPE: Specifies the source of the data. Can be "BigQuery" (to export from BQ) or potentially "GCS" (if files are already in GCS, though the current main.py primarily details the BQ export flow).
LOCAL_OUTPUT_BASE_DIR: The base local directory where Snowfakery will generate output files before they are post-processed and uploaded to GCS.
Setup and Usage
Prerequisites:

Python 3.x installed.
Access to a Google Cloud Platform project with the following APIs enabled:
BigQuery API
Google Cloud Storage API
Vertex AI API
Appropriate IAM permissions for the service account or user running the scripts to access BigQuery, GCS, and Vertex AI.
Google Cloud SDK configured (gcloud auth application-default login).
Installation:

Clone the repository or download the code files.
Install the required Python packages:
Bash

pip install -r requirements.txt
Configuration:

Modify config_vars.py with your specific GCP project details, BigQuery source/target information, GCS bucket name, table names, and desired synthetic record counts.
Ensure the BigQuery audit table specified in config_vars.py exists with the expected schema (see audit_utils.py for fields like batch_id, table_name, status, etc.).
Running the Pipeline:

Execute the main script:
Bash

python main.py
The script will output progress information to the console.
Upon completion, synthetic data will be loaded into the target BigQuery tables, and audit logs will be updated. 
Notes
The pipeline heavily relies on generative AI for tasks like schema inference and recipe generation. The quality of these generated artifacts depends on the model's capabilities and the clarity/quality of the input sample data and prompts.
Snowfakery recipes are generated dynamically. While efforts are made to correct and refine them, complex schemas or relationships might require manual adjustments to the generated recipes for optimal results.
Ensure that the GCS bucket and BigQuery datasets are in locations that minimize egress/ingress costs if they differ.
The prompts_collection.py file is crucial for the AI's behavior. Tweaking these prompts can significantly alter the outcomes of schema prediction, recipe generation, etc.