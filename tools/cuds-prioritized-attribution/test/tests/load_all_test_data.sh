#!/bin/bash
# Copyright 2019 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.
# Input preparation. Run from the `test` folder.
# Script takes dataset name as argument and populates the BQ with the commitment data and billing data.

set -e
dataset=$1

#declare -a testCasesFolders=("test_1" "test_1_1" "test_2_1" "test_2_2" "test_3_1" "test_3_2")

shopt -s nullglob

for dir in tests/test_*/; do
        folder=$(basename ${dir})
        cat tests/$folder/commitments.json | jq -rc . > tests/$folder/commitments_load.json
        cat tests/$folder/export.json | jq -rc . > tests/$folder/export_load.json
        cat tests/$folder/expected_billingexport_output.json | jq -rc . > tests/$folder/expected_load.json
done

for dir in tests/test_*/; do
        folder=$(basename ${dir})
        echo "Loading ${folder}:export"
        bq rm -f ${dataset}.${folder}_export
        bq load  --source_format NEWLINE_DELIMITED_JSON  ${dataset}.${folder}_export  tests/${folder}/export_load.json  tests/billing_export_schema.json
        echo "Loading ${folder}:expected"
        bq rm -f ${dataset}.${folder}_expected
        bq load  --source_format NEWLINE_DELIMITED_JSON  ${dataset}.${folder}_expected  tests/${folder}/expected_load.json  tests/billing_export_schema.json
        echo "Loading ${folder}:commitments"
        bq rm -f ${dataset}.${folder}_commitments
        bq load  --source_format NEWLINE_DELIMITED_JSON ${dataset}.${folder}_commitments  tests/${folder}/commitments_load.json  tests/commitments_schema.json
done
