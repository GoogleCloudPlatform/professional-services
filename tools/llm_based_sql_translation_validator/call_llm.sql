CREATE OR REPLACE PROCEDURE `<my-project>.gemini_sql_validator.call_llm`(var_dataset_name STRING, var_Batch_Id STRING, var_Source_File STRING, var_Target_File STRING, var_Source_database STRING, var_Insert_Time TIMESTAMP, var_Model_Name STRING, var_Source_Data BYTES, var_Target_Data BYTES, Var_Prompt STRING)
BEGIN

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure call the LLM to generate the validation output, by comparing both the input and output file.
--The result of the output will also be stored in the validation_output table

--inser the llm output to the validation output table
EXECUTE IMMEDIATE """
INSERT INTO """||var_dataset_name||""".validation_output (Batch_Id,Source_File,Target_File,Validation_Result,Source_Database,Target_Database,Insert_Time)
--call the llm with the prompt, input file, output file and return the response from the llm
SELECT '"""||var_Batch_Id||"""' as Batch_Id,'"""||var_Source_File||"""' as Source_File,'"""||var_Target_File||"""' as Target_File,
ml_generate_text_llm_result as Validation_Result,'"""||var_Source_database||"""' as Source_Database,
'Bigquery' as Target_Database,CAST('"""||var_Insert_Time||"""' AS TIMESTAMP) as Insert_Time
FROM
  ML.GENERATE_TEXT(
    MODEL  `"""||var_dataset_name||"""."""||var_Model_Name||"""`,
    (SELECT '''"""||Var_Prompt||"""\n"""||var_Source_database||""" SQL:"""||SAFE_CONVERT_BYTES_TO_STRING(var_Source_Data)||""",Bigquery SQL:"""||SAFE_CONVERT_BYTES_TO_STRING(var_Target_Data)||""" ''' AS prompt
),
    STRUCT(
      0.8 AS temperature,
      8192 AS max_output_tokens,
      0.95 AS top_p,
      1 as top_k,
      true as flatten_json_output));"""
;
EXCEPTION WHEN ERROR THEN
SELECT
    @@error.message,
    @@error.stack_trace,
    @@error.statement_text,
    @@error.formatted_stack_trace;
END;