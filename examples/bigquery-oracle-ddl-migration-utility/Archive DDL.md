The Archive DDL Script archive the DDL files created by the scripts (oracle_ddl_extraction.py, oracle_bq_converter.py and archive_ddl.py) 
and place the files in the specified archive bucket.

Below packages are need to run the script
google-cloud-storage

Steps to run this script:

1.  Make Sure the pre-requsitie of the script (oracle_bq_converter.py) is met.
 
2. After completing the above steps, the script can be run using two methods:

    a) Using Composer:
          Trigger the dag Oracle_BQ_DDL_Migration

    b) Using VM:
         Place the file in a VM and execute the python script as below
         #Command to run the script
         #python3 archive_ddl.py <json_config_file_path> <project_name>    
         #eg) python3 archive_ddl.py gs://orcl-ddl-migration/orcl-ddl-extraction-config-replica.json helix-poc

5. Once done, verify that the DDL files are archived in the specified gcs path

