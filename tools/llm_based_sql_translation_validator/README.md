# LLM Based SQL Translation Validator

A LLM based utility tool to identify any translation errors between any database SQL with Bigquery SQL.

## Business Requirement:
1. To validate the output Bigquery SQL by comparing with the Legacy Source SQL
2. To be able to quickly identify any translation errors, right at the beginning of the migration.
3. To get a sense of translation accuracy
4. To provide a sense of confidence before query deployment.
5. To save time during the migration projects without going through data validation process.

## Asset Features:
1. This tool is built entirely using Bigquery SQL and doesnot need any infrastrutre to run the scripts.
2. This tool includes only two procedures and have iterate logic to validate all the files at one execution.
3. This tool also includes the DDL's to create the output Bigquery Tables to store the results.Hence no additional deployment scripts are needed.
4. This tool is generic and can be used to compare any SQL from any database to Bigquery SQL.

## Instructions to Run:
 1. Create a new dataset in the region of your choice eg) gemini_sql_validator
 2. Create a new bigquery connection type Cloud Resource in the same region eg)poc-env-aks-bq-admin.us.gemini-sql-validator-connection
 3. Create a cloud storage location to keep the input files eg) gs://gemini-validator/td/
 4. Place all the input files in the input cloud storage path
 5. Create a cloud storage location to store the output files eg) gs://gemini-validator/bq/
 6. Deploy the two stored procedure run_sql_validator and call_llm by executing run_sql_validator.sql and call_llm.sql in the same dataset
 3. Call the run_sql_validator stored procedure with the required input
 4. Sample run_sql_validator Procedure call is as below

        DECLARE var_dataset_name STRING DEFAULT 'gemini_sql_validator';
        DECLARE var_connection_name STRING DEFAULT '<my-project>.us.gemini-sql-validator-connection';
        DECLARE var_source_database STRING DEFAULT 'Teradata';
        DECLARE var_source_gcs_path STRING DEFAULT 'gs://gemini-validator/td/*'; 
        DECLARE var_target_gcs_path STRING DEFAULT 'gs://gemini-validator/bq/*';
        CALL `<my-project>.gemini_sql_validator.run_sql_validator`(var_dataset_name,var_connection_name, var_source_database, var_source_gcs_path, var_target_gcs_path);

5. See the output by quering the "validation_report" view.


