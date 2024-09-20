CREATE OR REPLACE PROCEDURE `DR_ADMIN.crr_history_load`(IN var_project_id STRING, IN var_execution_region_id STRING, IN var_reporting_flag BOOL, IN var_delay_in_mins INT64, OUT p_hist_load_batch_id STRING, OUT p_error_load_batch_id STRING, OUT p_out_status STRING)
BEGIN

--Copyright 2023 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure captures the promotion and the replication status of the CRR datasets and loads into the dr_replication_history table

  DECLARE var_primary_region STRING;
  DECLARE var_secondary_region STRING;
  DECLARE var_max_concurrent_backfills INT64 ;
  DECLARE var_promotion_flag BOOL;
  DECLARE var_crr_error_bucket_name STRING;
  
  DECLARE var_current_timestamp TIMESTAMP;
  DECLARE var_replication_alert_flag BOOL;

-- Validation of the procedure inputs
IF var_project_id is null or var_execution_region_id is null or var_reporting_flag is null or var_delay_in_mins is null THEN
 RAISE USING MESSAGE = 'One or more of the input argument is not fully populated';
END IF;

-- Get the current region information from the config table
SET (var_primary_region,var_secondary_region,var_max_concurrent_backfills,var_promotion_flag,var_crr_error_bucket_name) = (SELECT AS STRUCT lower(primary_region),lower(secondary_region), max_concurrent_backfills,dr_promotion_flag,crr_error_bucket_name FROM DR_ADMIN.dr_region_config );

-- Validation of the region config table entry
IF var_primary_region is null or var_secondary_region is null or var_max_concurrent_backfills is null or var_promotion_flag is null or var_crr_error_bucket_name is null THEN
 RAISE USING MESSAGE = 'Region Config Table is not fully populated';
END IF;

--Trigger the history load process if the execution region is same as the secondary region
IF lower(var_secondary_region) = lower(var_execution_region_id) THEN

--Retrieve the dataset metadata for the current project and region
EXECUTE IMMEDIATE """ CREATE OR REPLACE TEMP TABLE schemata_options as 
SELECT schema_name as dataset_name, option_name,option_value FROM `"""||var_project_id||".region-"||var_secondary_region||"""`.INFORMATION_SCHEMA.SCHEMATA_OPTIONS """ ;

--Retrieve the replication metadata for the current project and region
EXECUTE IMMEDIATE """ CREATE OR REPLACE TEMP TABLE schemata_replicas as 
SELECT  location,replica_primary_assignment_complete,schema_name,replica_primary_assigned,replication_time,creation_complete FROM `"""||var_project_id||".region-"||var_secondary_region||"""`.INFORMATION_SCHEMA.SCHEMATA_REPLICAS  """ ;

--Retrieve the replication history details for the current project
EXECUTE IMMEDIATE " CREATE OR REPLACE TEMP TABLE dr_replication_history as SELECT * FROM DR_ADMIN.dr_replication_history where project_id='"||var_project_id||"'";

--Get the list of all the datasets with the dr flag enabled
CREATE OR REPLACE TEMP TABLE schemata_options_labels as 
SELECT dataset_name
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(dr",.*?)\)'),"\"",""),")",""))[1] AS dr_flag
      , SAFE_CAST(SPLIT(REPLACE(REGEXP_EXTRACT(option_value, r'(dr_backfill_priority.*\d)'),"\"",""))[1] AS INT64) AS dr_priority
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(dr_functional_group.*?)\)'),"\"",""),")",""))[1] AS dr_functional_group
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(metadata_created_by.*?)\)'),"\"",""),")",""))[1] AS metadata_created_by
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(metadata_comment.*?)\)'),"\"",""),")",""))[1] AS metadata_comment
FROM schemata_options WHERE option_name = 'labels'
AND option_value like '%dr%' ;

--Create the dataset list along with the replica kms key details
CREATE OR REPLACE TEMP TABLE load_config_table as
SELECT var_project_id as project_id, dr_bd.dataset_name, coalesce(dr_priority,999999) as priority, dr_functional_group as functional_group,
 dr_rep.replica_kms_key as replica_kms_key ,CASE WHEN dr_flag like '%true%' THEN true ELSE  false END AS active_flag,metadata_created_by, metadata_comment
FROM ( SELECT dataset_name, dr_flag, dr_priority, dr_functional_group,metadata_created_by,metadata_comment FROM schemata_options_labels ) dr_bd
LEFT JOIN (SELECT dataset_name,option_value as replica_kms_key FROM schemata_options WHERE option_name = 'default_kms_key_name' ) dr_rep
on dr_bd.dataset_name = dr_rep.dataset_name ;

--Deactivate the datasets which is no longer part of crr solution
INSERT INTO load_config_table
SELECT hist.project_id, hist.dataset_name, hist.priority, hist.functional_group,hist.replica_kms_key,false as active_flag,hist.metadata_created_by, hist.metadata_comment 
 FROM (SELECT * FROM dr_replication_history qualify row_number() over (partition by dataset_name order by metadata_created_time desc ) =1) hist
 INNER JOIN (
SELECT DISTINCT dataset_name FROM dr_replication_history 
EXCEPT DISTINCT
SELECT dataset_name FROM load_config_table
) inactive
on hist.dataset_name = inactive.dataset_name;

--Capture the current time for the replication delay calculation
SET var_current_timestamp = CURRENT_TIMESTAMP();

--Load into the temp history table with the latest replication and promotion status
CREATE OR REPLACE TEMP TABLE dr_replication_history AS 
SELECT config.project_id,config.dataset_name,config.active_flag,config.priority, config.functional_group,config.replica_kms_key, 
CASE WHEN sc.creation_complete=false THEN 'In-Progress'
        WHEN sc.creation_complete=true THEN 'Completed'
        ELSE  null
   END AS initial_replication_status,
   CASE WHEN pr.replica_primary_assignment_complete=false THEN 'In-Progress'
        WHEN pr.replica_primary_assignment_complete =true THEN 'Completed'
        ELSE  null
   END AS current_promotion_status, 
    pr.location as current_primary_region,
   sc.location as current_secondary_region,
   sc.replication_time as last_replication_time,
   TIMESTAMP_DIFF(var_current_timestamp,sc.replication_time, MINUTE) as replication_delay, 
   false as replication_alert_flag,
  var_current_timestamp as metadata_created_time,
  config.metadata_created_by,
  config.metadata_comment,
 FROM load_config_table config
 LEFT JOIN (SELECT location,replica_primary_assignment_complete,schema_name FROM schemata_replicas pr where replica_primary_assigned=true) pr
 on config.dataset_name = pr.schema_name
 LEFT JOIN (SELECT replication_time,location,creation_complete,schema_name FROM schemata_replicas sc where replica_primary_assigned=false) sc
 on config.dataset_name = sc.schema_name
  order by config.priority ;

--Update the alert flag if it exceeds the delay in minutes
EXECUTE IMMEDIATE " UPDATE dr_replication_history SET replication_alert_flag = true WHERE coalesce(replication_delay,0) >= "||var_delay_in_mins;

--Load all datasets status to the reporting table when reporting flag is enabled
IF var_reporting_flag = true THEN

--Generate new batch id for the current load process
SET p_hist_load_batch_id = (select GENERATE_UUID() );

--Load into the history table with the latest replication and promotion status
INSERT INTO DR_ADMIN.dr_replication_history (batch_id,project_id,dataset_name,active_flag,priority,functional_group,replica_kms_key,initial_replication_status,current_promotion_status,current_primary_region,current_secondary_region,last_replication_time,replication_delay,replication_alert_flag,metadata_created_time,metadata_created_by,metadata_comment) 
SELECT p_hist_load_batch_id,project_id,dataset_name,active_flag,priority,functional_group,replica_kms_key,initial_replication_status,current_promotion_status,current_primary_region,current_secondary_region,last_replication_time,replication_delay,replication_alert_flag,metadata_created_time,metadata_created_by,metadata_comment FROM dr_replication_history;
END IF;

SET var_replication_alert_flag = (SELECT CASE WHEN alert_count > 0 THEN true else false END as var_replication_alert_flag from (SELECT count(*) as alert_count from dr_replication_history where replication_alert_flag = true));

--Load the replication delayed dataset when alert flag is true
IF var_replication_alert_flag = true and var_reporting_flag = false THEN

--Generate new batch id for the current load process
SET p_hist_load_batch_id = (select GENERATE_UUID() );

--Load into the history table with the latest replication and promotion status
INSERT INTO DR_ADMIN.dr_replication_history (batch_id,project_id,dataset_name,active_flag,priority,functional_group,replica_kms_key,initial_replication_status,current_promotion_status,current_primary_region,current_secondary_region,last_replication_time,replication_delay,replication_alert_flag,metadata_created_time,metadata_created_by,metadata_comment)  
SELECT p_hist_load_batch_id,project_id,dataset_name,active_flag,priority,functional_group,replica_kms_key,initial_replication_status,current_promotion_status,current_primary_region,current_secondary_region,last_replication_time,replication_delay,replication_alert_flag,metadata_created_time,metadata_created_by,metadata_comment FROM dr_replication_history where replication_alert_flag = true;
SET p_out_status  = "FAILED:Replication Delay";
END IF;

END IF;


EXCEPTION WHEN ERROR THEN
BEGIN
    DECLARE last_job_id STRING;
    DECLARE var_crr_error_bucket_name STRING;
    SET last_job_id = @@last_job_id;
    SET var_crr_error_bucket_name = (SELECT crr_error_bucket_name FROM DR_ADMIN.dr_region_config );
    SET p_error_load_batch_id = (select GENERATE_UUID() );

    EXPORT DATA
  OPTIONS (
    uri = CONCAT('gs://',var_crr_error_bucket_name,'/',var_project_id,'/reporting/',p_error_load_batch_id,'-error-*.csv'),
    format = 'CSV',
    overwrite = true,
    header = true,
    field_delimiter = ';')
AS (
  SELECT p_error_load_batch_id as batch_id,var_project_id as project_id,var_execution_region_id as execution_region_id, NULL as dataset_name,last_job_id as bq_job_id,'REPORTING' as crr_job_type,'DR_ADMIN.crr_history_load' as error_location,REPLACE(@@error.statement_text,'\n','') as error_statement,REPLACE(@@error.message,'\n','') as error_message,CURRENT_TIMESTAMP as metadata_created_time,NULL as metadata_comment
);
  SET p_out_status  = "FAILED:Execution Error";
END;

END;
