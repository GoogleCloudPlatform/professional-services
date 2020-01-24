#/bin/bash
# Copyright 2019 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.

dataset=$1
export_table=$2
commitment_table=$3
data_dir=$4

rm -f tests/$data_dir/expected_output.json
rm -f tests/$data_dir/commitments_load.json
rm -f tests/$data_dir/export_load.json
rm -f tests/$data_dir/output.json
rm -f tests/$data_dir/output_cmp.json

cat tests/$data_dir/commitments.json | jq -rc . > tests/$data_dir/commitments_load.json
cat tests/$data_dir/export.json | jq -rc . > tests/$data_dir/export_load.json
cat tests/$data_dir/expected_billingexport_output.json | jq -rc . > tests/$data_dir/expected_output.json

bq load  --source_format NEWLINE_DELIMITED_JSON  ${dataset}.${export_table}  tests/${data_dir}/export_load.json  tests/billing_export_schema.json
echo "${dataset}.${export_table} table loaded ... "
bq load  --source_format NEWLINE_DELIMITED_JSON ${dataset}.${commitment_table}  tests/${data_dir}/commitments_load.json  tests/commitments_schema.json
echo "${dataset}.${commitment_table} table loaded ... "