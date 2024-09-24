CREATE OR REPLACE PROCEDURE `<project_id>.DR_ADMIN.initial_replication_time_estimator(IN in_project_id STRING, IN in_execution_region STRING, IN opt_Speed_in_GBS INT64, IN opt_Buffer_Percentage INT64, OUT out_total_size_in_gb FLOAT64, OUT out_total_hours FLOAT64, OUT out_total_days FLOAT64)
BEGIN 

--Copyright 2024 Google. This software is provided as-is, 
--without warranty or representation for any use or purpose. 
--Your use of it is subject to your agreement with Google.

--Purpose: This helps to calcualte the approximate number of days/hours,the CRR feature will take for the initial replication of the datasets to complete for a given project

--Example Procedure Invocation 
/*. 
DECLARE in_project_id STRING DEFAULT '<project_id>';
DECLARE in_execution_region STRING DEFAULT 'US';
DECLARE opt_Speed_in_GBS INT64 DEFAULT NULL;
DECLARE opt_Buffer_Percentage INT64 DEFAULT NULL;
DECLARE out_total_size_in_gb FLOAT64 DEFAULT NULL;
DECLARE out_total_hours FLOAT64 DEFAULT NULL;
DECLARE out_total_days FLOAT64 DEFAULT NULL;
CALL `poc-env-aks-bq-admin.DR_ADMIN.initial_replication_time_estimator`(in_project_id, in_execution_region, opt_Speed_in_GBS, opt_Buffer_Percentage, out_total_size_in_gb, out_total_hours,out_total_days);
select out_total_size_in_gb as Total_Size_In_GB ,out_total_hours as Total_Hours,out_total_days as Total_Days;
*/

DECLARE out_total_days_temp FLOAT64;

--Validation of the project id nullability
IF in_project_id is NULL THEN
RAISE USING MESSAGE = 'Invalid Project Id';
END IF;

--Validation of the execution region nullability
IF in_execution_region is NULL THEN
RAISE USING MESSAGE ='Invalid Execution Region';
END IF;

--Default Speed is 1GB/s 
IF opt_Speed_in_GBS IS NULL THEN
  SET opt_Speed_in_GBS =1;
END IF;

--Default buffer is 20%
IF opt_Buffer_Percentage IS NULL THEN
  SET opt_Buffer_Percentage = 20;
END IF;

--Retrieve the dataset metadata for the current project and region
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


--Getting the total size in GB per project
EXECUTE IMMEDIATE "SELECT SUM(TOTAL_PHYSICAL_BYTES)/1024/1024/1024 FROM `"||in_project_id||".region-"||in_execution_region||"`.INFORMATION_SCHEMA.TABLE_STORAGE A INNER JOIN active_dataset B ON A.TABLE_SCHEMA = B.dataset_name " INTO out_total_size_in_gb;


--Calcuating the total number of days for initial replication completion
SET out_total_days_temp  = out_total_size_in_gb/(opt_Speed_in_GBS*60*60*24);

--Calculating the total number of days with the buffer percentage
SET out_total_days = out_total_days_temp+((opt_Buffer_Percentage/100)*out_total_days_temp);

SET out_total_hours = out_total_days*24;

END;