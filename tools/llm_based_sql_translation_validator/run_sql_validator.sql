CREATE OR REPLACE PROCEDURE `<my-project>.gemini_sql_validator.run_sql_validator`(var_dataset_name STRING, var_connection_name STRING, var_source_database STRING, var_source_gcs_path STRING, var_target_gcs_path STRING)
BEGIN


--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure creates the object tables to read both the source and the target files from GCS.This procedure also creates the output tables to store the validation results.The Prompt is crafted in this procedure and would call a child procedure for the purpose of validation output generation.

--Pre-requiste: A seperate dataset needs to be created. Two Procedures run_sql_validator and call_llm needs to be created on that dataset. A Bigquery Connection of type Cloud Resource needs to be created in advance before execution of this procedure.

--Sample Input
/*
DECLARE var_connection_name STRING DEFAULT '<my-project>.us.gemini-sql-validator-connection';
DECLARE var_source_database STRING DEFAULT 'Teradata';
DECLARE var_source_gcs_path STRING DEFAULT 'gs://gemini-validator/td/*'; 
DECLARE var_target_gcs_path STRING DEFAULT 'gs://gemini-validator/bq/*';
*/

DECLARE var_Batch_Id STRING;
DECLARE var_Insert_Time TIMESTAMP;
DECLARE var_Model_Name STRING;
DECLARE Var_Prompt STRING;

SET @@dataset_id ="gemini_sql_validator";
SET var_model_name = "sql-validator-model";
SET var_Batch_Id = GENERATE_UUID();
SET var_Insert_Time=current_timestamp();


EXECUTE IMMEDIATE """
--Create the output table to store the validation results
CREATE TABLE IF NOT EXISTS """||var_dataset_name||""".validation_output
(
  Batch_Id STRING,
  Source_File STRING,
  Target_File STRING,
  Validation_Result STRING,
  Source_Database STRING,
  Target_Database STRING,
  Insert_Time TIMESTAMP
) """;


---Create view to retrieve the latest validation results for each file
EXECUTE IMMEDIATE """
CREATE VIEW IF NOT EXISTS """||var_dataset_name||""".validation_report as 
(
  select Batch_Id,Source_File,Target_File,Validation_Result,Source_Database,Target_Database,Insert_Time
  from  """||var_dataset_name||""".validation_output
  where (Insert_Time,Source_File) in ( select (max(Insert_Time),Source_File) from """||var_dataset_name||""".validation_output
  group by Source_File )
) """;

--Create the LLM Model to execute the validation
EXECUTE IMMEDIATE "CREATE MODEL IF NOT EXISTS `"||var_dataset_name||"."||var_Model_Name||"` REMOTE WITH CONNECTION `"||var_connection_name ||"` OPTIONS (ENDPOINT = 'gemini-pro')";

--Create the object table to read the source input files from GCS
EXECUTE IMMEDIATE "CREATE EXTERNAL TABLE IF NOT EXISTS "||var_dataset_name||".source_object_table WITH CONNECTION `"||var_connection_name||"` OPTIONS(object_metadata = 'SIMPLE',uris = ['"||var_source_gcs_path||"'],max_staleness=INTERVAL 1 DAY,metadata_cache_mode = 'MANUAL')";

--Create the object table to read the target input files from GCS
EXECUTE IMMEDIATE "CREATE EXTERNAL TABLE IF NOT EXISTS "||var_dataset_name||".target_object_table WITH CONNECTION `"||var_connection_name||"` OPTIONS(object_metadata = 'SIMPLE',uris = ['"||var_target_gcs_path||"'],max_staleness=INTERVAL 1 DAY,metadata_cache_mode = 'MANUAL')";

--Refresh both input and putput object tables to include newly added files in GCS
CALL BQ.REFRESH_EXTERNAL_METADATA_CACHE('gemini_sql_validator.source_object_table');
CALL BQ.REFRESH_EXTERNAL_METADATA_CACHE('gemini_sql_validator.target_object_table');

--Craft the prompt to send it to LLM
SET Var_Prompt="""
Identify and document all SQL differences between the below """||var_source_database||""" SQL and its equivalent BigQuery SQL.
Input:
"""||var_source_database||""" SQL:
Bigquery SQL:
Process:
Analyze the SQL statements.Deeply compare the syntax, functions, and data types used in both """||var_source_database||""" and BigQuery SQL.
Identify any inconsistencies or differences in the logic between the two statements.
Output:
For each identified difference, create a JSON object with clear explanation of the specific SQL difference and its potential impact.""" ;

--Iterate over each set of source and target file
FOR record in (
select 
src.data as var_Source_Data, 
tgt.data as var_Target_Data,
src.uri as var_Source_File,
tgt.uri as var_Target_File,
var_source_database as var_Source_database
from sql_validator.source_object_table src
inner join sql_validator.source_object_table tgt
on lower(SPLIT(src.uri,"/")[4])=lower(SPLIT(tgt.uri,"/")[4])
)
DO

--Call the child procedure for each set of files
CALL gemini_sql_validator.call_llm(var_dataset_name,var_Batch_Id,record.var_Source_File,record.var_Target_File,record.var_Source_database,var_Insert_Time,var_Model_Name,(record.var_Source_Data),(record.var_Target_Data),Var_Prompt);

END FOR;

END;