CREATE OR REPLACE PROCEDURE `<project_id>.DR_ADMIN.crr_init_auto_batch`(IN var_project_id STRING, IN var_execution_region_id STRING, OUT p_error_load_batch_id STRING, OUT p_out_status STRING)
BEGIN

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure initiates the creation of the replica for each of the CRR datasets. This Procedure will also initiates the deletion of the replica which is no longer part of the CRR Solution

DECLARE var_primary_region STRING;
DECLARE var_secondary_region STRING;
DECLARE var_promotion_flag BOOL;
DECLARE var_crr_error_bucket_name STRING;
DECLARE var_max_concurrent_backfills INT64;
DECLARE var_ref_backfill_size_in_gb INT64;
DECLARE var_error_count INT64;
DECLARE var_config_project_id STRING;

DECLARE sum_physical_bytes FLOAT64;
DECLARE temp_physical_bytes FLOAT64;
DECLARE total_retry_count INT64;
DECLARE retry_count INT64;


--Create temp table to capture the error details
CREATE OR REPLACE TEMP TABLE dr_error_details as (select * from DR_ADMIN.crr_error_details where 1=2);

--Generate batch id to capture any runtime error
SET p_error_load_batch_id = (select GENERATE_UUID() );

--Validation of the input arguments
IF var_project_id is null or var_execution_region_id is null THEN
 RAISE USING MESSAGE = 'One or more of the input argument is not fully populated';
END IF;

-- Get the current region information from the config table
SET (var_primary_region,var_secondary_region,var_promotion_flag,var_crr_error_bucket_name,var_ref_backfill_size_in_gb) = (SELECT AS STRUCT lower(primary_region),lower(secondary_region),dr_promotion_flag,crr_error_bucket_name,ref_backfill_size_in_gb FROM DR_ADMIN.dr_region_config );

-- Validation of the region config table entry
IF var_primary_region is null or var_secondary_region is null or var_promotion_flag is null or var_crr_error_bucket_name is null or var_ref_backfill_size_in_gb is null THEN
 RAISE USING MESSAGE = 'Region Config Table is not fully populated';
END IF;

--Discard the exeuction, if the execution region is different from the primary region
IF lower(var_primary_region) <> lower(var_execution_region_id) THEN
RAISE USING MESSAGE = 'Region Mismatch. This execution will be discarded';
END IF;

SET var_config_project_id = (select project_id from DR_ADMIN.replica_inscope_projects where lower(project_id) = lower(var_project_id));

-- Validate whether the project is in scope
IF var_config_project_id is null THEN
 RAISE USING MESSAGE = 'The Project is not in scope';
END IF;

--Trigger the replication process if the execution region is same as the primary region
IF lower(var_primary_region)=lower(var_execution_region_id) THEN

--Retrieve the dataset metadata for the current project and region
EXECUTE IMMEDIATE """ CREATE OR REPLACE TEMP TABLE schemata_options as 
SELECT schema_name as dataset_name, option_name,option_value FROM `"""||var_project_id||".region-"||var_primary_region||"""`.INFORMATION_SCHEMA.SCHEMATA_OPTIONS """;

--Retrieve the replication metadata for the current project and region
EXECUTE IMMEDIATE """ CREATE OR REPLACE TEMP TABLE schemata_replicas as 
SELECT  schema_name,replica_primary_assigned,creation_complete FROM `"""||var_project_id||".region-"||var_primary_region||"""`.INFORMATION_SCHEMA.SCHEMATA_REPLICAS  """ ;

--Retrieve the KMS key entry for the current project
EXECUTE IMMEDIATE "CREATE OR REPLACE TEMP TABLE replica_kms_key_config as SELECT dataset_name,"||UPPER(REPLACE(var_secondary_region,'-','_'))||"_KMS_key_path as kms_key FROM DR_ADMIN.replica_kms_key_config WHERE  project_id = '"||var_project_id||"'";

--Get the list of all the datasets with the dr flag enabled
CREATE OR REPLACE TEMP TABLE schemata_options_labels as 
SELECT dataset_name
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(dr",.*?)\)'),"\"",""),")",""))[1] AS dr_flag
      , SAFE_CAST(SPLIT(REPLACE(REGEXP_EXTRACT(option_value, r'(dr_backfill_priority.*\d)'),"\"",""))[1] AS INT64) AS dr_priority
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(dr_functional_group.*?)\)'),"\"",""),")",""))[1] AS dr_functional_group
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(metadata_created_by.*?)\)'),"\"",""),")",""))[1] AS metadata_created_by
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(metadata_comment.*?)\)'),"\"",""),")",""))[1] AS metadata_comment
FROM schemata_options WHERE  option_name = 'labels'
AND option_value like '%dr%' ;

--Board all the dr flag enabled dataset to the crr process
CREATE OR REPLACE TEMP TABLE dataset_boarding as
  SELECT dataset_name, coalesce(dr_priority,999999) as priority, coalesce(dr_functional_group,'null') as functional_group,CASE WHEN dr_flag like '%true%' THEN true else false end as active_flag,metadata_created_by,CURRENT_TIMESTAMP as metadata_created_time, metadata_comment
FROM schemata_options_labels;

--Retrieve the current replication status of the datasets
CREATE OR REPLACE TEMP TABLE dataset_current_status as
SELECT repl1.schema_name as dataset_name ,CASE WHEN rep2.schema_name is null THEN false else true end as active_flag FROM 
 (SELECT schema_name FROM schemata_replicas WHERE  replica_primary_assigned=true and creation_complete=true ) repl1
 LEFT JOIN  (SELECT schema_name FROM schemata_replicas WHERE  replica_primary_assigned=false and creation_complete=true ) rep2
 on repl1.schema_name = rep2.schema_name;


--Retrieve only the datasets which needs to be replicated and dropped
CREATE OR REPLACE TEMP TABLE dr_load_config as
SELECT var_project_id as project_id, dr_bd.dataset_name,dr_bd.functional_group,dr_bd.priority,kms_config.kms_key as replica_kms_key,dr_bd.active_flag, dr_bd.metadata_created_by,
dr_bd.metadata_created_time,dr_bd.metadata_comment
FROM (
SELECT dr_load.dataset_name,dr_load.functional_group,dr_load.priority,dr_load.active_flag, dr_load.metadata_created_by,
dr_load.metadata_created_time,dr_load.metadata_comment
 FROM (SELECT dr_bd.* , curr.dataset_name as curr_dataset_name FROM dataset_boarding dr_bd
LEFT JOIN  dataset_current_status curr
 ON dr_bd.dataset_name=curr.dataset_name and dr_bd.active_flag=curr.active_flag) dr_load
WHERE  curr_dataset_name is null
) dr_bd
LEFT JOIN ( SELECT dataset_name, kms_key FROM replica_kms_key_config ) kms_config
on dr_bd.dataset_name = kms_config.dataset_name;


--Getting the dataset physical bytes in GB's
EXECUTE IMMEDIATE "create or replace temp table temp1_table_storage as select project_id,table_schema,SUM(TOTAL_PHYSICAL_BYTES)/1024/1024 as total_physical_bytes from `"||var_project_id||".region-"||var_primary_region||"`.INFORMATION_SCHEMA.TABLE_STORAGE group by project_id,table_schema" ;

--Creating the active dataset(unreplicated) list with the storage info
create or replace temp table active_load_config as
SELECT a.project_id,a.dataset_name,a.replica_kms_key,a.priority,coalesce(total_physical_bytes,0) as total_physical_bytes ,row_number() over (partition by 1 order by a.priority,a.dataset_name) row_num FROM dr_load_config a
left join temp1_table_storage b
ON a.project_id = b.project_id and
a.dataset_name= b.table_schema
WHERE active_flag=true;


SET retry_count =1;
SET total_retry_count = (select count(1) from active_load_config );
SET sum_physical_bytes = 0.0;


--Batching Datasets till the total dataset size is var_ref_backfill_size_in_gb
WHILE retry_count <= total_retry_count and sum_physical_bytes < var_ref_backfill_size_in_gb DO 
begin

  SET temp_physical_bytes = (select total_physical_bytes from active_load_config where row_num = retry_count );
  SET sum_physical_bytes = sum_physical_bytes + temp_physical_bytes;
  SET retry_count = retry_count + 1;
end ;
end while;

SET var_max_concurrent_backfills = retry_count-1 ;

--Gathering all the unreplicated dataset based on the batch size calculated
FOR active in 
  ( 
SELECT project_id,dataset_name,replica_kms_key FROM active_load_config 
 WHERE  row_num <= var_max_concurrent_backfills order by row_num
)
  do 
  --Send each dataset to the create replication process
  CALL DR_ADMIN.crr_replicator(active.project_id,active.dataset_name,var_secondary_region,true,active.replica_kms_key,p_error_load_batch_id,p_out_status);
  SELECT active.dataset_name;

END FOR;

--Retrieve the datasets with the dr flag disabled
FOR inactive in 
  ( 
    --Retrieving the dataset only if the replica is exist
    SELECT project_id,dr_bd.dataset_name from (SELECT project_id,dataset_name,priority FROM dr_load_config WHERE  active_flag=false ) dr_bd
    inner join 
    (SELECT schema_name as dataset_name FROM schemata_replicas WHERE replica_primary_assigned=false and creation_complete=true ) curr_status
    ON dr_bd.dataset_name = curr_status.dataset_name
    order by dr_bd.priority,dr_bd.dataset_name 
)
  do 
  --Send each dataset to the drop replciation process
  CALL DR_ADMIN.crr_replicator(inactive.project_id,inactive.dataset_name,var_secondary_region,false,null,p_error_load_batch_id,p_out_status);
END FOR;

END IF;

SET var_error_count = (SELECT count(*) as err_count from dr_error_details);
IF var_error_count > 0 THEN
  EXPORT DATA
  OPTIONS (
   uri = CONCAT('gs://',var_crr_error_bucket_name,'/',var_project_id,'/replication/',p_error_load_batch_id,'-error-*.csv'),
    format = 'CSV',
    overwrite = true,
    header = true,
    field_delimiter = ';')
AS (
SELECT * from dr_error_details
);
  SET p_out_status  = "FAILED:Execution Error";
END IF;



EXCEPTION WHEN ERROR THEN
BEGIN
    DECLARE last_job_id STRING;
    DECLARE var_crr_error_bucket_name STRING;
    SET last_job_id = @@last_job_id;
    SET var_crr_error_bucket_name = (SELECT crr_error_bucket_name FROM DR_ADMIN.dr_region_config );
EXPORT DATA
  OPTIONS (
   uri = CONCAT('gs://',var_crr_error_bucket_name,'/',var_project_id,'/replication/',p_error_load_batch_id,'-error-*.csv'),
    format = 'CSV',
    overwrite = true,
    header = true,
    field_delimiter = ';')
AS (
SELECT p_error_load_batch_id as batch_id,var_project_id as project_id,var_execution_region_id as execution_region_id, NULL as dataset_name,last_job_id as bq_job_id,'REPLICATION' as crr_job_type,'DR_ADMIN.crr_init' as error_location,REPLACE(@@error.statement_text,'\n','') as error_statement,REPLACE(@@error.message,'\n','') as error_message,CURRENT_TIMESTAMP as metadata_created_time,NULL as metadata_comment
);
SET p_out_status  = "FAILED:Execution Error";

END;
END;


CREATE OR REPLACE PROCEDURE `<project_id>.DR_ADMIN.crr_replicator`(IN var_project_id STRING, IN var_dataset_name STRING, IN var_secondary_region STRING, IN var_active_flag BOOL, IN var_kms_key STRING, IN p_error_load_batch_id STRING, OUT p_out_status STRING)
BEGIN

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure creates the replica for each of the CRR datasets. This Procedure will also drop the replica which is no longer part of the CRR Solution

  DECLARE sql_statmnt STRING;

--Validation of the input arguments
IF var_project_id is null or var_dataset_name is null or var_secondary_region is null or var_active_flag is null or p_error_load_batch_id is null THEN
 RAISE USING MESSAGE = 'One or more of the input argument is not fully populated';
END IF;

--Verify that the dataset is in active state for crr process
IF var_active_flag = true THEN
  IF var_kms_key IS NOT NULL THEN
      --Create Replica with the KMS Key, if the KMS key is present
      SET sql_statmnt="ALTER SCHEMA `"||var_project_id||"`."||var_dataset_name||" ADD REPLICA IF NOT EXISTS `"||var_secondary_region||"` OPTIONS(location='"||var_secondary_region||"',replica_kms_key='"||var_kms_key||"');";
  ELSE
     --Create Replcia without the KMS Key, if the KMS key is absent
  SET sql_statmnt="ALTER SCHEMA `"||var_project_id||"`."||var_dataset_name||" ADD REPLICA IF NOT EXISTS `"||var_secondary_region||"` OPTIONS(location='"||var_secondary_region||"');";
  END IF;
ELSE
   --Drop the Replica if the dataset is not part of the crr process
  SET sql_statmnt="ALTER SCHEMA `"||var_project_id||"`."||var_dataset_name||" DROP REPLICA IF EXISTS `"||var_secondary_region||"`;";
END IF;

  SELECT sql_statmnt;
  EXECUTE IMMEDIATE sql_statmnt;

EXCEPTION WHEN ERROR THEN
BEGIN
    DECLARE last_job_id STRING;
    SET last_job_id = @@last_job_id;

    IF p_error_load_batch_id IS NULL THEN
      SET  p_error_load_batch_id= (select GENERATE_UUID() );
    END IF;
INSERT INTO  dr_error_details (batch_id,project_id,execution_region_id,dataset_name,bq_job_id,crr_job_type,error_location,error_statement,error_message,metadata_created_time,metadata_comment )
SELECT p_error_load_batch_id as batch_id,var_project_id as project_id,var_secondary_region as execution_region_id, var_dataset_name as dataset_name,last_job_id as bq_job_id,'REPLICATION' as crr_job_type,'DR_ADMIN.crr_replicator' as error_location,REPLACE(@@error.statement_text,'\n','') as error_statement,REPLACE(@@error.message,'\n','') as error_message,CURRENT_TIMESTAMP as metadata_created_time,NULL as metadata_comment;
  SET p_out_status  = "FAILED:Execution Error";
END;
END;
