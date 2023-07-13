The Archive DDL Script archive the DDL files created by the scripts (generic_ddl_extraction.py, generic_bq_converter.py and archive_ddl.py) 
and place the files in the specified archive bucket.

Below packages are need to run the script:
google-cloud-storage

Steps to run this script:

1.  Make Sure the pre-requsitie of the script (generic_bq_converter.py) is met
 
2. After completing the above steps, the script can be run as

         a) pip install -r requirements.txt
         b) python3 archive_ddl.py <gcs_json_config_file_path> <project_name>    

3. Once done, verify that the DDL files are archived in the specified gcs path

