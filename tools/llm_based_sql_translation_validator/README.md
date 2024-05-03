# LLM Based SQL Translation Validator

A LLM based utility tool to identify any translation errors between any database SQL with Bigquery SQL.

## Business Requirement
1. To validate the output Bigquery SQL by comparing with the Legacy Source SQL
2. To be able to quickly identify any translation errors, right at the beginning of the migration.
3. To get a sense of translation accuracy
4. To provide a sense of confidence before query deployment.
5. To save time during the migration projects without going through data validation process.

## Asset Features
1. This tool is built entirely using Bigquery SQL and doesnot need any infrastrutre to run the scripts.
2. This tool includes only two procedures and have iterate logic to validate all the files at one execution.
3. This tool also includes the DDL's to create the output Bigquery Tables to store the results.Hence no additional deployment scripts are needed.
4. This tool is generic and can be used to compare any SQL from any database to Bigquery SQL.

## Instructions to Run
 1. Create a new dataset
 2. Create a new bigquery connection of type Cloud Resource
 3. Call the run_sql_validator stored procedure with the required input
 4. Sample Procedure call is as below

        DECLARE var_Dataset_name STRING DEFAULT 'gemini_sql_validator';
        DECLARE var_connection_name STRING DEFAULT 'bq-data-project.us.gemini-sql-validator-connection';
        DECLARE var_source_database STRING DEFAULT 'Teradata';
        DECLARE var_source_gcs_path STRING DEFAULT 'gs://gemini-sql-validator/td/*'; 
        DECLARE var_target_gcs_path STRING DEFAULT 'gs://gemini-sql-validator/bq/*';
        CALL `dataset_name.run_sql_validator`(var_connection_name, var_source_database, var_source_gcs_path, var_target_gcs_path, var_Dataset_name); 

where var_Dataset_name is the dataset created in step1 and var_connection_name is the connection created in step2.

5. See the output by quering the "validation_report" view.


