CREATE OR REPLACE PROCEDURE `DR_ADMIN.crr_load_kms_key_process`(IN var_project_id STRING, IN var_execution_region_id STRING, IN US_CENTRAL1_KMS_KEY STRING, IN US_WEST1_KMS_KEY STRING, IN gcs_bucket_name STRING, IN load_flag BOOL)
BEGIN 

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure will load the default primary and the secondary kms key to replica_kms_key_config table.
--This procedure will load for each of the dataset configured with dr_flag label set to true as well as 
--data_classification is highly-confidential in the specified project.
--This procedure is being created to easy the work of loading the replica_kms_key_config table

--Execution Method:
--1. First, run it in the primary region with the load flag set to false. This will generate the gcs file.
--2. Next,run it in the secondary region with the load flag set to true. This will load the gcs file to the replica_kms_key_config table.

  DECLARE var_primary_region STRING;
  DECLARE var_secondary_region STRING;
  DECLARE var_config_project_id STRING;
  DECLARE var_insert_time TIMESTAMP;
  DECLARE load_gcs_path ARRAY<STRING>;
  
-- Validation of the procedure inputs
IF var_project_id is null or var_execution_region_id is null OR US_CENTRAL1_KMS_KEY is null or US_WEST1_KMS_KEY is null or gcs_bucket_name is null or load_flag is null THEN
 RAISE USING MESSAGE = 'One or more of the input argument is not fully populated';
END IF;

SET var_config_project_id = (select project_id from DR_ADMIN.replica_inscope_projects where lower(project_id) = lower(var_project_id));

-- Validate whether the project is in scope
IF var_config_project_id is null THEN
 RAISE USING MESSAGE = 'The Project is not in scope';
END IF;

-- Get the current region information FROM the region config table
SET (var_primary_region,var_secondary_region) = (SELECT AS STRUCT lower(primary_region),lower(secondary_region) FROM DR_ADMIN.dr_region_config );

-- Validation of the region config table entry
IF var_primary_region is null or var_secondary_region is null THEN
 RAISE USING MESSAGE = 'Region Config Table is not fully populated';
END IF;

--When load flag  is false, the procedure will produce the gcs file for kms key config table
IF load_flag = false THEN
--Discard the exeuction, if the execution region is different from the primary region
IF lower(var_primary_region) <> lower(var_execution_region_id) THEN
RAISE USING MESSAGE = 'Region Mismatch. This execution will be discarded';
END IF;
END IF;

--When load flag  is true, the procedure will load the gcs file to the kms key config table
IF load_flag = true THEN
--Discard the exeuction, if the execution region is different from the secondary region
IF lower(var_secondary_region) <> lower(var_execution_region_id) THEN
RAISE USING MESSAGE = 'Region Mismatch. This execution will be discarded';
END IF;
END IF;

IF load_flag = false THEN
--Retrieve the dataset metadata for the current project and region
EXECUTE IMMEDIATE """ CREATE OR REPLACE TEMP TABLE schemata_options as 
SELECT schema_name as dataset_name, option_name,option_value FROM """||var_project_id||".`region-"||var_primary_region||"""`.INFORMATION_SCHEMA.SCHEMATA_OPTIONS """ ;

--Get the list of all the datasets with the dr flag enabled
CREATE OR REPLACE TEMP TABLE active_dataset_temp as
  SELECT dataset_name,  coalesce(dr_priority,999999) as priority FROM ( 
SELECT dataset_name
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(dr",.*?)\)'),"\"",""),")",""))[1] AS dr_flag
      , SAFE_CAST(SPLIT(REPLACE(REGEXP_EXTRACT(option_value, r'(dr_backfill_priority.*\d)'),"\"",""))[1] AS INT64) AS dr_priority
FROM schemata_options
WHERE option_name = 'labels'
AND option_value like "%dr%" 
) where  dr_flag like '%true%' ;





CREATE OR REPLACE TEMP TABLE active_dataset as
select dataset_name,priority from (
SELECT ds1.dataset_name, ds1.priority,ds3.dataset_name as kms_dataset_name
from active_dataset_temp ds1
left join DR_ADMIN.replica_kms_key_config ds3
on ds1.dataset_name = ds3.dataset_name
and ds3.project_id = var_project_id
) where kms_dataset_name is null;



create or replace temp table temp_replica_kms_key_config as (select * from DR_ADMIN.replica_kms_key_config where false);
SET var_insert_time = CURRENT_TIMESTAMP();

FOR active in 
  (SELECT dataset_name FROM active_dataset order by priority)
  do 
  --Insert the kms key config for each active dataset
    insert into temp_replica_kms_key_config (project_id,dataset_name,US_CENTRAL1_KMS_key_path,US_WEST1_KMS_key_path,metadata_created_time) values (var_project_id,active.dataset_name,US_CENTRAL1_KMS_KEY,US_WEST1_KMS_KEY,var_insert_time);
END FOR;

--Export the kms key config  to the gcs bucket
EXPORT DATA
  OPTIONS (
    uri = CONCAT('gs://',gcs_bucket_name,'/kms_key_config/',var_project_id,'/',var_insert_time,'/*.csv'),
    format = 'CSV',
    overwrite = true,
    header = true,
    field_delimiter = ';')
AS (
     select project_id,dataset_name,US_CENTRAL1_KMS_key_path,US_WEST1_KMS_key_path,metadata_created_time from temp_replica_kms_key_config
);

END IF;

IF load_flag = true THEN
create or replace temp table temp_replica_kms_key_config as (select * from DR_ADMIN.replica_kms_key_config where false);
--Load the kms key config to the replica_kms_key_config table
SET load_gcs_path=CAST([CONCAT("gs://",gcs_bucket_name,"/kms_key_config/",var_project_id,"/*")] AS ARRAY<STRING>);

LOAD DATA INTO TEMP TABLE temp_replica_kms_key_config (project_id STRING,dataset_name STRING,US_CENTRAL1_KMS_key_path STRING,US_WEST1_KMS_key_path STRING,metadata_created_time TIMESTAMP)
  FROM FILES(
    format='CSV',
    uris = (load_gcs_path),
    field_delimiter = ';',
    skip_leading_rows=1
  );
insert into DR_ADMIN.replica_kms_key_config (project_id,dataset_name,US_CENTRAL1_KMS_key_path,US_WEST1_KMS_key_path,metadata_created_time)
select project_id,dataset_name,US_CENTRAL1_KMS_key_path,US_WEST1_KMS_key_path,metadata_created_time from temp_replica_kms_key_config where dataset_name not in (select dataset_name from DR_ADMIN.replica_kms_key_config where project_id= var_project_id) and project_id= var_project_id and metadata_created_time =(select max(metadata_created_time) from temp_replica_kms_key_config) ;

END IF;
END;