The Oracle BQ Converter Script does the following functionalities

1. The script reads the oracle ddl files from the specified gcs path (output path of the oracle_ddl_extraction script)
2. The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path


Below packages are need to run the script
google-cloud-bigquery-migration
google-cloud-bigquery
google-cloud-storage
google-api-core


Steps to run this script:

1.  Create the orcl-ddl-extraction-config.json file and place it in the gcs bucket. 

2. Create the additional metadata columns to the metadata_columns.json file and place it in the gcs bucket

3. Create the object_name_mapping.json file and place it in the gcs bucket. 
  
4. After completing the above steps, the script can be run as

         a) pip install -r requirements.txt
         b) python3 oracle_bq_converter.py <gcs_json_config_file_path> <project_name>    

5. Once done, verify that the converted ddl is placed in the specified gcs path




