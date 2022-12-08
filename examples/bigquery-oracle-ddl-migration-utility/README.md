The Oracle DDL Migration Utility does the following functionalities:

1. The script connects to Oracle Database through the oracle-python connector (oracledb)
2. The script uses the oracle metadata table (all_tab_columns) to retieve the table schema information
3. The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path
4.The script reads the oracle ddl files from the specified gcs path (output path of the oracle_ddl_extraction script)
6. The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path
7. Reads the output sql file created by the oracle bq converter script 
8. The script create the Bigquery Tables in the specified target dataset. 
9. The table structure will include source columns, metadata columns and paritioning and clustering info
10. The final DDL which includes source columns, metadata columns and paritioning and clustering info is placed in the gcs path
11.The Archive DDL Script archive the DDL files created by the scripts (oracle_ddl_extraction.py, oracle_bq_converter.py and archive_ddl.py) 
and place the files in the specified archive bucket.
12.The status of each table conversion is logged in the audit table in the target datset.


The order of execution of the script is as follows

1. oracle_ddl_extraction.py
2. oracle_bq_converter.py
3. bq_table_creator.py
4. archive_ddl.py
