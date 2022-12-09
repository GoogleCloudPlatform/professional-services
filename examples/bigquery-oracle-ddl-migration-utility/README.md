The Oracle DDL Migration Utility does the following functionalities:

1. The script connects to Oracle Database through the oracle-python connector (oracledb).
2. The script uses the oracle metadata table (all_tab_columns) to retrieve the table schema information.
3. The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path.
4. The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path.
5. The script create the Bigquery Tables in the specified target dataset. 
6. The table structure will include source columns, metadata columns and paritioning and clustering info.
7. The script archives the DDL files created by the scripts (oracle_ddl_extraction.py, oracle_bq_converter.py and archive_ddl.py).
8. The status of each table conversion is logged in the audit table in the target datset.


The order of execution of the script is as follows

1. oracle_ddl_extraction.py
2. oracle_bq_converter.py
3. bq_table_creator.py
4. archive_ddl.py

