The BQ Table Creator Script does the following functionalities

1. Reads the output sql file created by the oracle bq converter script 
2. The script create the Bigquery Tables in the specified target dataset. 
3. The table structure will include source columns, metadata columns and paritioning and clustering info
3. The final DDL which includes source columns, metadata columns and paritioning and clustering info is placed in the gcs path

Below packages are need to run the script
google-cloud-bigquery
google-cloud-storage
google-api-core


Steps to run this script:

1.  Make Sure the pre-requsitie of the script (oracle_bq_converter.py) is met.
 
2. After completing the above steps, the script can be run as

         a) pip install -r requirements.txt
		 b) python3 bq_table_creator.py <gcs_json_config_file_path> <project_name>    

3. Once done, verify that the bigquery tables are created in the specified dataset and the final DDL is placed in the specified gcs path

