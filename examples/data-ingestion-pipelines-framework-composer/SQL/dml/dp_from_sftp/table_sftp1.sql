CREATE OR REPLACE TABLE `{BQ_Project_Id}.{BQ_Dataset_Raw}.{base_file_name}_ext` OPTIONS (
  expiration_timestamp = TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
)AS SELECT * FROM `{BQ_Project_Id}.{BQ_Dataset_Raw}.{folder_or_table_name}` WHERE 1 = 0;



LOAD DATA OVERWRITE `{BQ_Project_Id}.{BQ_Dataset_Raw}.{base_file_name}_ext`
(
col1		STRING,
col2		STRING
)
FROM FILES (
  format = 'CSV',
  quote="'",
  uris = ['{file_uri}']
  );
  


INSERT INTO `{BQ_Project_Id}.{BQ_Dataset_Raw}.{folder_or_table_name}`
SELECT *,
 '{base_file_name}' AS inputfilename,
 TIMESTAMP "{data_interval_end}" AS processing_dttm
FROM `{BQ_Project_Id}.{BQ_Dataset_Raw}.{base_file_name}_ext`;

DROP TABLE `{BQ_Project_Id}.{BQ_Dataset_Raw}.{base_file_name}_ext`;