#!/bin/sh
#!/usr/bin/env bash
script_path=opt/cron/bigquery_user_info_updater/update_user_info.py
project_id=data-analytics-pocs 
schema_path=opt/cron/bigquery_user_info_updater/tests/test_schemas/test_schema.json 
dataset_id=identity_update_test 
final_table_id=final
updates_table_id=updates
temp_updates_table_id=temp 
user_id_field_name=userId 
ingest_timestamp_field_name=ingestTimestamp
now=$(date)
echo "$now: Calling update_user_info.py with parms:"
echo "\tpython $script_path"
echo "\t--project_id=$project_id "
echo "\t--schema_path=$schema_path "
echo "\t--dataset_id=$dataset_id "
echo "\t--final_table_id=$final_table_id"
echo "\t--updates_table_id=$updates_table_id"
echo "\t--temp_updates_table_id=$temp_updates_table_id "
echo "\t--user_id_field_name=$user_id_field_name"
echo "\t--ingest_timestamp_field_name=$ingest_timestamp_field_name"
python opt/cron/bigquery_user_info_updater/update_user_info.py \
--project_id=$project_id \
--schema_path=$schema_path \
--dataset_id=$dataset_id \
--final_table_id=$final_table_id \
--updates_table_id=$updates_table_id \
--temp_updates_table_id=$temp_updates_table_id \
--user_id_field_name=$user_id_field_name \
--ingest_timestamp_field_name=$ingest_timestamp_field_name