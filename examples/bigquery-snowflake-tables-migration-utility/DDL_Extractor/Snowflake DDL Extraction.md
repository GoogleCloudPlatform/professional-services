The Snowflake DDL Extraction Script does the following functionalities:

The script connects to Snowflake Database through the snowflake-python connector 
The script uses the snowflake get_ddl command to retieve the table schema information
The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path
The status of each table conversion is logged in the audit table in the target datset.
Below packages are need to run the script: google-cloud-secret-manager google-cloud-bigquery google-cloud-storage google-api-core snowflake-connector-python 

Steps to run this script:

Create the sf-ddl-extraction-config.json file and place it in the gcs bucket.

Create the object_name_mapping.json file and place it in the gcs bucket.

Add the needed additional metadata columns to the metadata_columns.json file and place it in the gcs bucket

After completing the above steps, the script can be run as

 a) pip install -r requirements.txt  
 b) python3 sf_ddl_extraction.py <gcs_json_config_file_path> <project_name> <orc-instant-client-path>
Once done, verify that the extracted ddl is placed in the specified gcs path (sf-ddl)