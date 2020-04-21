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

dataset=$2
table=$3
output_dir=$4

rm -rf "${output_dir}"/output.json
rm -rf "${output_dir}"/output_cmp.json


bq query --use_legacy_sql=false --format=prettyjson "CREATE TEMP FUNCTION labels_to_sorted_string(labels ARRAY<STRUCT<key STRING, value STRING>>)
  RETURNS STRING
  LANGUAGE js
  AS \"\"\"
  labels.sort(function(a, b) {{ return  ('' + a.key).localeCompare(b.key); }});
  return '['
  +
  labels.reduce(
  (a, b) => {{
     return (a===''?'': a + ',')+'{{\"key\":\"' + b.key + '\",\"value\":\"' + b.value + '\"}}';
  }},'')
  +
  ']'
  \"\"\";
  CREATE TEMP FUNCTION credit_to_sorted_string(credit ARRAY<STRUCT<name STRING, amount FLOAT64>>)
  RETURNS STRING
  LANGUAGE js
  AS \"\"\"
  credit.sort(function(a, b) {{ return  ('' + a.key).localeCompare(b.key); }});
  return '['
  +
  credit.reduce(
  (a, b) => {{
     return (a===''?'': a + ',')+'{{\"key\":\"' + b.key + '\",\"value\":\"' + b.value + '\"}}';
  }},'')
  +
  ']'
  \"\"\";
  SELECT
  billing_account_id,
  service.id AS service_id,
  service.description AS service_description,
  sku.id AS sku_id,
  sku.description AS sku_description,
  project.id AS project_id,
  project.name AS project_name,
  project.ancestry_numbers AS project_ancestry_numbers,
  usage_start_time,
  usage_end_time,
  location.location AS location_location,
  location.country AS location_country,
  location.region AS location_region,
  location.zone AS location_zone,
  cost,
  currency,
  usage.amount AS usage_amount,
  usage.unit AS usage_unit,
  usage.amount_in_pricing_units AS usage_amount_in_pricing_units,
  usage.pricing_unit AS usage_pricing_unit,
  cost_type,
  invoice.month AS invoice_month,
  project.labels AS project_labels,
  labels,
  credits
FROM
  ${dataset}.${table}
ORDER BY
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  labels_to_sorted_string(project_labels),
  labels_to_sorted_string(labels),
  credit_to_sorted_string(credits)" >> "${output_dir}"/output.json

echo "... Final Corrected Billing output table loaded ... "

< "${output_dir}"/output.json jq -rc . > "${output_dir}"/output_cmp.json
