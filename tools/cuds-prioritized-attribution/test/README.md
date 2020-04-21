Purpose:
========
Test the queries in main.py for different test scenarios of billing export and commitments data in "tests" folder.
At the end separate output tables are created for different scenarios. The expected data are also loaded into separate
Bigquery tables and actual output tables data are compared against expected.
It uses python's "pytest" framework.

For each test case, the test case write should manually validate the output and examine and run the following query to export the data

bq query --use_legacy_sql=false --format=prettyjson "SELECT
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
  <<dataset>>.<<table_name>>
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
  credit_to_sorted_string(credits)" >> expected_billingexport_output.json


Test Scripts:
=============
Test script name: test_file_based_comparision.py

This script loads data into Bigquery dataset as specified in property file and runs the query. It has the test logic and then test cases get generated automatically based on test data. Each test case is run with the logic and "assert" statement compares the actual output with expected data.

Property File : pytest.properties

This is to export the environment variables that ../source/main.py is expecting

How to run:
===========
`export GOOGLE_APPLICATION_CREDENTIALS=<<service_account>>`

Run the command from `py.test` from `test` directory

`py.test test_file_based_comparision.py`

