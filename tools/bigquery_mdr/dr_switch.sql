CREATE OR REPLACE PROCEDURE `<project_id>.DR_ADMIN.dr_switch`(IN var_project_id STRING, IN var_execution_region_id STRING, OUT p_error_load_batch_id STRING, OUT p_out_status STRING)
BEGIN 

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure initiates the promotion of the reservation from one region to the another region

  DECLARE var_primary_region STRING;
  DECLARE var_secondary_region STRING;
  DECLARE var_max_concurrent_backfills INT64 ;
  DECLARE var_promotion_flag BOOL;
  DECLARE var_crr_error_bucket_name STRING;
  DECLARE dr_batch_id STRING;

--Generate batch id for capturing the error
SET p_error_load_batch_id = (select GENERATE_UUID() );


-- Validation of the procedure inputs
IF var_project_id is null or var_execution_region_id is null THEN
 RAISE USING MESSAGE = 'One or more of the input argument is not fully populated';
END IF;

-- Get the current region information FROM the config table
SET (var_primary_region,var_secondary_region,var_max_concurrent_backfills,var_promotion_flag,var_crr_error_bucket_name) = (SELECT AS STRUCT lower(primary_region),lower(secondary_region), max_concurrent_backfills,dr_promotion_flag,crr_error_bucket_name FROM DR_ADMIN.dr_region_config);

-- Validation of the region config table entry
IF var_primary_region is null or var_secondary_region is null or var_max_concurrent_backfills is null or var_promotion_flag is null or var_crr_error_bucket_name is null THEN
 RAISE USING MESSAGE = 'Region Config Table is not fully populated';
END IF;

--Stop the DR Switch Process if the promotion flag is false
IF var_promotion_flag = false THEN
 RAISE USING MESSAGE = 'Promotion Flag is not set';
END IF;

--Discard the exeuction, if the execution region is different from the secondary region
IF lower(var_secondary_region) <> lower(var_execution_region_id) THEN
RAISE USING MESSAGE = 'Region Mismatch. This execution will be discarded';
END IF;

--Create temp table to capture the error details
CREATE OR REPLACE TEMP TABLE dr_error_details as (select * from DR_ADMIN.crr_error_details where 1=2);

--Start the DR Process if the promotion flag is true
IF var_promotion_flag = true THEN 

--Trigger the DR process if the execution region is same as the secondary region
IF lower(var_secondary_region) = lower(var_execution_region_id) THEN
FOR failover in (
SELECT  AS STRUCT failover.reservation_name as reservation_name , failover.reservation_project as reservation_project
FROM `DR_ADMIN.dr_region_config` ,
UNNEST(failover) AS failover)
DO
EXECUTE IMMEDIATE "ALTER RESERVATION `"||failover.reservation_project||"."||"region-"||var_secondary_region||"."||failover.reservation_name||"` SET OPTIONS (is_primary = TRUE)";
END FOR;

INSERT INTO DR_ADMIN.dr_execution_log (dr_batch_id,step_id,project_id,procedure_name,status,ref_error_batch_id,from_region,to_region,metadata_created_time)
values (dr_batch_id,1,var_project_id,'dr_switch','SUCCESS',NULL,upper(var_primary_region),upper(var_secondary_region),CURRENT_TIMESTAMP());

END IF;
END IF;

EXCEPTION WHEN ERROR THEN
BEGIN
    DECLARE last_job_id STRING;
    DECLARE var_primary_region STRING;
    DECLARE var_secondary_region STRING;
    DECLARE var_crr_error_bucket_name STRING;
    DECLARE dr_batch_id STRING;
    SET last_job_id = @@last_job_id;
SET (var_primary_region,var_secondary_region,var_crr_error_bucket_name) = (select AS STRUCT lower(primary_region),lower(secondary_region),crr_error_bucket_name FROM DR_ADMIN.dr_region_config);
SET dr_batch_id = (select dr_batch_id from DR_ADMIN.dr_execution_status where step_id =1 limit 1 );

  EXPORT DATA
  OPTIONS (
   uri = CONCAT('gs://',var_crr_error_bucket_name,'/',coalesce(var_project_id,'null'),'/promotion/',p_error_load_batch_id,'-error-2-*.csv'),
    format = 'CSV',
    overwrite = true,
    header = true,
    field_delimiter = ';')
AS (
SELECT p_error_load_batch_id as batch_id,var_project_id as project_id,var_execution_region_id as execution_region_id, NULL as dataset_name,last_job_id as bq_job_id,'PROMOTION' as crr_job_type,'DR_ADMIN.dr_switch' as error_location,REPLACE(@@error.statement_text,'\n','') as error_statement,REPLACE(@@error.message,'\n','') as error_message,CURRENT_TIMESTAMP as metadata_created_time,NULL as metadata_comment
);

IF lower(var_secondary_region) = lower(var_execution_region_id) THEN
INSERT INTO DR_ADMIN.dr_execution_log (dr_batch_id,step_id,project_id,procedure_name,status,ref_error_batch_id,from_region,to_region,metadata_created_time)
values (dr_batch_id,1,var_project_id,'dr_switch','FAILED',p_error_load_batch_id,upper(var_primary_region),upper(var_secondary_region),CURRENT_TIMESTAMP());
END IF;

SET p_out_status  = "FAILED:Execution Error";
RAISE USING MESSAGE = @@error.message;
END;

END;