
The Oracle DDL Extraction Script does the following functionalities:

1. The script connects to Oracle Database through the oracle-python connector (oracledb)
2. The script uses the oracle metadata table (all_tab_columns) to retieve the table schema information
3. The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path
4. 4. The status of each table conversion is logged in the audit table in the target datset.


Below packages are need to run the script:
google-cloud-secret-manager
google-cloud-bigquery
google-cloud-storage
google-api-core
oracledb
instantclient_21_7 (oracle-instant-client via manual download)


Steps to run this script:

1.  Create the orcl-ddl-extraction-config.json file and place it in the gcs bucket. 

2. Create the object_name_mapping.json file and place it in the gcs bucket.

3. Add the needed additional metadata columns to the metadata_columns.json file and place it in the gcs bucket

4. After completing the above steps, the script can be run as

        a) pip install -r requirements.txt  
        b) python3 oracle_ddl_extraction.py <gcs_json_config_file_path> <project_name> <orc-instant-client-path>

5. Once done, verify that the extracted ddl is placed in the specified gcs path (oracle_ddl)

