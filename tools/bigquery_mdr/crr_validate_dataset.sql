CREATE OR REPLACE PROCEDURE `<project_id>.DR_ADMIN.crr_validate_dataset`(IN in_project_id STRING, IN in_execution_region STRING, IN in_gcs_bucket_name STRING, IN in_compare_flag BOOL)
BEGIN 

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This Procedure helps to valdiate the dataset record count between primary and secondary region
--This procedure will load table record count for each of the dataset configured with dr_flag label in the specified project
--This procedure is being created to easy the work of getting the record count for all the tables within the project

--Execution Method:(Please cleanup the gcs dataset_validator/<in_project_id> folder before execution)
--1. First, run it in the primary region with the compare flag set to false. This will generate the primary region gcs file.
--2. Second, run it in the secondary region with the compare flag set to false. This will generate the secodnary region gcs file
--3. Third,run it in the secondary region with the compare flag set to true.
--This will compare both the files and produce the result in the crr_dataset_validation table


-- DECLARE in_project_id STRING DEFAULT '<project_id>' ;
-- DECLARE in_execution_region STRING DEFAULT 'US-WEST1';
-- DECLARE in_gcs_bucket_name STRING DEFAULT 'crr_operations';
-- DECLARE in_compare_flag BOOL DEFAULT true;

DECLARE var_primary_region STRING;
DECLARE var_secondary_region STRING;
DECLARE var_config_project_id STRING;
DECLARE load_gcs_path ARRAY<STRING>;

-- Validation of the procedure inputs
IF in_project_id is null or in_execution_region is null or in_gcs_bucket_name is null or in_compare_flag is null THEN
 RAISE USING MESSAGE = 'One or more of the input argument is not fully populated';
END IF;

SET var_config_project_id = (select project_id from DR_ADMIN.replica_inscope_projects where lower(project_id) = lower(in_project_id));

-- Validate whether the project is in scope
IF var_config_project_id is null THEN
 RAISE USING MESSAGE = 'The Project is not in scope';
END IF;

-- Get the current region information FROM the region config table
SET (var_primary_region,var_secondary_region) = (SELECT AS STRUCT upper(primary_region),upper(secondary_region) FROM DR_ADMIN.dr_region_config );

-- Validation of the region config table entry
IF var_primary_region is null or var_secondary_region is null THEN
 RAISE USING MESSAGE = 'Region Config Table is not fully populated';
END IF;

IF in_compare_flag = FALSE THEN
--Getting the object record count 
EXECUTE IMMEDIATE "create or replace temp table temp1_table_storage as select project_id,table_schema,table_name,total_rows,creation_time,storage_last_modified_time from `"||in_project_id||".region-"||in_execution_region||"`.INFORMATION_SCHEMA.TABLE_STORAGE " ;

--Getting the list of all datasets
EXECUTE IMMEDIATE """ CREATE OR REPLACE TEMP TABLE schemata_options as 
SELECT schema_name as dataset_name, option_name,option_value FROM """||in_project_id||".`region-"||in_execution_region||"""`.INFORMATION_SCHEMA.SCHEMATA_OPTIONS """ ;

--Get the list of all the datasets with the dr flag enabled
CREATE OR REPLACE TEMP TABLE active_dataset as
  SELECT dataset_name,  coalesce(dr_priority,999999) as priority FROM ( 
SELECT dataset_name
      , SPLIT(REPLACE(REPLACE(REGEXP_EXTRACT(option_value, r'(dr",.*?)\)'),"\"",""),")",""))[1] AS dr_flag
      , SAFE_CAST(SPLIT(REPLACE(REGEXP_EXTRACT(option_value, r'(dr_backfill_priority.*\d)'),"\"",""))[1] AS INT64) AS dr_priority
FROM schemata_options
WHERE option_name = 'labels'
AND option_value like "%dr%" 
) where  dr_flag like '%true%' ;

create or replace temp table temp_table_storage as
select project_id,table_schema,table_name,total_rows,creation_time,storage_last_modified_time,upper(in_execution_region) as region_id
from temp1_table_storage st inner join active_dataset act on 
st.table_schema = act.dataset_name;

EXPORT DATA
  OPTIONS (
    uri = CONCAT('gs://',in_gcs_bucket_name,'/dataset_validator/',in_project_id,'/',upper(in_execution_region),'/dataset_count_*.csv'),
    format = 'CSV',
    overwrite = true,
    header = true,
    field_delimiter = ';')
AS (
      select project_id,table_schema,table_name,total_rows,creation_time,storage_last_modified_time,region_id from temp_table_storage
);


END IF;

IF in_compare_flag = TRUE THEN

CREATE TEMP TABLE temp_table_storage 
(
   project_id string,
   table_schema string,
   table_name string,
   total_rows int64,
   creation_time timestamp,
   storage_last_modified_time timestamp,
   region_id string

) ;

SET load_gcs_path=CAST([CONCAT("gs://",in_gcs_bucket_name,"/dataset_validator/",in_project_id,'/*.csv')] AS ARRAY<STRING>);

LOAD DATA INTO TEMP TABLE temp_table_storage (project_id string,table_schema string,table_name string,total_rows int64,creation_time timestamp,storage_last_modified_time timestamp, region_id string)
  FROM FILES(
    format='CSV',
    uris = (load_gcs_path),
    field_delimiter = ';',
    skip_leading_rows=1
  );

insert into `DR_ADMIN.crr_dataset_validation` (project_id,table_schema,table_name,primary_count,secondary_count,primary_region,secondary_region,primary_creation_time,primary_last_modified_time,secondary_creation_time,secondary_last_modified_time,status,count_difference,difference_percentage)
select a.project_id ,a.table_schema,a.table_name,a.total_rows as primary_count,
b.total_rows as secondary_count,a.region_id as primary_region, b.region_id as secondary_region,
a.creation_time as primary_creation_time, a.storage_last_modified_time as primary_last_modified_time,
b.creation_time as secondary_creation_time, b.storage_last_modified_time as secondary_last_modified_time,
case when a.total_rows=b.total_rows then 'success' else 'failed' end as status,
a.total_rows-b.total_rows as count_difference, 
case when a.total_rows = 0 then 0 else CAST(((a.total_rows-b.total_rows)/a.total_rows)*100 AS INT64) end as difference_percentage
from (select * from temp_table_storage where region_id = var_primary_region) a left join
(select * from temp_table_storage where region_id = var_secondary_region ) b
on a.project_id = b.project_id and
   a.table_schema = b.table_schema and
   a.table_name = b.table_name;

END IF;


END;