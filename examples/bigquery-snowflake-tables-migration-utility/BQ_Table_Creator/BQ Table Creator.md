The BQ Table Creator Script does the following functionalities

Reads the output sql file created by the snowflake bq converter script
The script create the Bigquery Tables in the specified target dataset.
The table structure will include source columns, metadata columns and paritioning and clustering info
The final DDL which includes source columns, metadata columns and paritioning and clustering info is placed in the gcs path
Below packages are need to run the script google-cloud-bigquery google-cloud-storage google-api-core

Steps to run this script:

Make Sure the pre-requsitie of the script (snwoflake_bq_converter.py) is met.

After completing the above steps, the script can be run as

  a) pip install -r requirements.txt
  b) python3 bq_table_creator.py <gcs_json_config_file_path> <project_name>    
Once done, verify that the bigquery tables are created in the specified dataset and the final DDL is placed in the specified gcs path