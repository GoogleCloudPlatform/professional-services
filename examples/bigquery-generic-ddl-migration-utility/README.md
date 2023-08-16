The Generic DDL Migration Utility does the following functionalities:

1. The script connects to Generic Database (Oracle, Snowflake, MSSQL, Vertica, Neteeza).
2. The script uses the metadata table (all_tab_columns) to retrieve the table schema information.
3. The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path.
4. The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path.
5. The script create the Bigquery Tables in the specified target dataset. 
6. The table structure will include source columns, metadata columns and paritioning and clustering info.
7. The script archives the DDL files created by the scripts (generic_ddl_extraction.py, generic_bq_converter.py and archive_ddl.py).
8. The status of each table conversion is logged in the audit table in the target datset.


The order of execution of the script is as follows along with the command mentioned below:

1. DDL_Extractor -> generic_ddl_extraction.py
    command: python3  generic_ddl_extractions.py --dbtype <dbtype_name> --secret_name <secret_name> --gcs_config_path <gcs_config_path> --project_id <project_id>
2. DDL_Converter -> generic_bq_converter.py
    command: python3 generic_bq_converter.py --gcs_config_path <gcs_json_config_file_path> --project_id <project_name> --db_type <db_type>
3. BQ_Table_Creator -> bq_table_creator.py
    command: python3 bq_table_creator.py --gcs_config_path <gcs_json_config_file_path> --project_id <project_name>
4. DDL_Archiver -> archive_ddl.py
    command: python3 archive_ddl.py --gcs_config_path <gcs_json_config_file_path> --project_id <project_name>

## Business Requirements

To create a common repository for metadata extraction for each of the source databases, so that there is a standard way to retrieve this information and also avoid any duplication efforts from different engagements.

## Asset Feature

The utility that will connect to each of the legacy databases and extract the Table Metadata by reading from different internal system tables, formatting the information and producing the final Table Metadata to be migrated to GCP.
