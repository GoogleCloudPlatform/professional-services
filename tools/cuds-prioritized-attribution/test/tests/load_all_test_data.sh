#!/bin/bash
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e
dataset=$1

shopt -s nullglob

for dir in tests/test_*/; do
        folder="$(basename "${dir}")"
        < tests/"${folder}"/commitments.json jq -rc . > tests/"${folder}"/commitments_load.json
        < tests/"${folder}"/export.json jq -rc . > tests/"${folder}"/export_load.json
        < tests/"${folder}"/expected_billingexport_output.json jq -rc . > tests/"${folder}"/expected_load.json
done

for dir in tests/test_*/; do
        folder="$(basename "${dir}")"
        echo "Loading ${folder}:export"
        bq rm -f "${dataset}"."${folder}"_export
        bq load  --source_format NEWLINE_DELIMITED_JSON  "${dataset}"."${folder}"_export  tests/"${folder}"/export_load.json  tests/billing_export_schema.json
        echo "Loading ${folder}:expected"
        bq rm -f "${dataset}"."${folder}"_expected
        bq load  --source_format NEWLINE_DELIMITED_JSON  "${dataset}"."${folder}"_expected  tests/"${folder}"/expected_load.json  tests/billing_export_schema.json
        echo "Loading ${folder}:commitments"
        bq rm -f "${dataset}"."${folder}"_commitments
        bq load  --source_format NEWLINE_DELIMITED_JSON "${dataset}"."${folder}"_commitments  tests/"${folder}"/commitments_load.json  tests/commitments_schema.json
done
