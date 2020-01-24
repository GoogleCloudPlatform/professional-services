#!/bin/bash
# Copyright 2019 Google LLC. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreements with Google.

set -e
dataset=$1

shopt -s nullglob

#declare -a testCasesFolders=("test_1" "test_1_1" "test_2_1" "test_2_2" "test_3_1" "test_3_2" )

for dir in tests/test_*/; do
    folder=$(basename ${dir})
	rm -rf tests/$folder/commitments_load.json
	rm -rf tests/$folder/export_load.json
	rm -rf tests/$folder/expected_load.json
done

for dir in tests/test_*/; do
    folder=$(basename ${dir})
	bq rm -f -t ${dataset}.${folder}_export
	bq rm -f -t ${dataset}.${folder}_commitments
	bq rm -f -t ${dataset}.${folder}_expected
	bq rm -f -t ${dataset}.test_ouput_*
done