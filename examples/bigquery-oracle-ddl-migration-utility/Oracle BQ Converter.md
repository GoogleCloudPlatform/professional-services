The Oracle BQ Converter Script does the following functionalities

1. The script reads the oracle ddl files from the specified gcs path (output path of the oracle_ddl_extraction script)
2. The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path


Below packages are need to run the script
google-cloud-bigquery-migration==0.4.0
google-cloud-bigquery
google-cloud-storage
google-api-core


Steps to run this script:

1.  Create the orcl-ddl-extraction-config[-replica or -cdc ].json file and place it in the gcs bucket. 
      (For reference: gs://orcl-ddl-migration/orcl-ddl-extraction-config-replica.json)

2. Create the additional metadata columns to the metadata_columns[ replica or _cdc ].json file and place it in the gcs bucket
      (For reference gs://orcl-ddl-migration/config/metadata_columns_replica.json)

3. Create the object_name_mapping.json file and place it in the gcs bucket. 
      (For reference gs://orcl-ddl-migration/config/object_name_mapping.json)
 
4. After completing the above steps, the script can be run using two methods:

    a) Using Composer:
          Trigger the dag Oracle_BQ_DDL_Migration

    b) Using VM:
         Place the file in a VM and execute the python script as below
         #Command to run the script
         #python3 oracle_bq_converter.py <json_config_file_path> <project_name>    
         #eg) python3 oracle_bq_converter.py gs://orcl-ddl-migration/orcl-ddl-extraction-config-replica.json helix-poc
5. Once done, verify that the converted ddl is placed in the specified gcs path




