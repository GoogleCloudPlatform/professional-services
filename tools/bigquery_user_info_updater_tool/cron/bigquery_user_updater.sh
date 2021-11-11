#!/usr/bin/env bash
# shellcheck disable=SC2154,SC2086
# TODO: cleanup to pass shellcheck
# See: https://github.com/GoogleCloudPlatform/professional-services/issues/471

script_path=opt/cron/bigquery_user_info_updater/update_user_info.py
#project_id=data-analytics-pocs
#schema_path=opt/cron/bigquery_user_info_updater/tests/test_schemas/test_schema.json
#dataset_id=identity_update_test
#final_table_id=final
#updates_table_id=updates
#temp_updates_table_id=temp
#user_id_field_name=userId
#ingest_timestamp_field_name=ingestTimestamp
now=$(date)
echo "$now: Calling update_user_info.py with parms:"
cmd=$(cat << EOF
python $script_path
  --project_id=$project_id
  --schema_path=$schema_path
  --dataset_id=$dataset_id
  --final_table_id=$final_table_id
  --updates_table_id=$updates_table_id
  --temp_updates_table_id=$temp_updates_table_id
  --user_id_field_name=$user_id_field_name
  --ingest_timestamp_field_name=$ingest_timestamp_field_name
EOF
)
echo "$cmd"
eval $cmd
