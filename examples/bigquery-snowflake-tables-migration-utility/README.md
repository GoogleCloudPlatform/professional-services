The Snowflake DDL Migration Utility does the following functionalities:

The script connects to Snowflake Database through the snowflake-python connector
The script uses the get_ddl command to retrieve the table schema information
The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path
The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path
The script create the Bigquery Tables in the specified target dataset
The table structure will include source columns, metadata columns and paritioning and clustering info
The script archives the DDL files created by the scripts (snowflake_ddl_extraction.py, snowflake_bq_converter.py and archive_ddl.py)
The status of each table conversion is logged in the audit table in the target datset
The order of execution of the script is as follows

snowflake_ddl_extraction.py
snowflake_bq_converter.py
bq_table_creator.py
archive_ddl.py
