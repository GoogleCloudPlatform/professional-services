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

{% raw %}
CREATE TEMP FUNCTION
  ratio(numerator float64, denominator float64)
  AS (IF(denominator = 0,
        0,
        numerator / denominator));

CREATE TEMP FUNCTION labels_to_sorted_string(labels ARRAY<STRUCT<key STRING, value STRING>>)
  RETURNS STRING
  LANGUAGE js
  AS '''
labels.sort(function(a, b) {{ return  ('' + a.key).localeCompare(b.key); }});
return '['
+
labels.reduce(
    (a, b) => {{
return (a===''?'': a + ',')+'{"key":"' + b.key + '","value":"' + b.value + '"}';
}},'')
+ ']'
''';
{% endraw %}
(
WITH
billing_export_table AS (
  SELECT
    b.*
  FROM
    `{{ params.billing_export_table_name }}` b
  WHERE
    CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) >= "2018-09-20"),

usage_data AS (
  SELECT
    billing_account_id,
    CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) AS usage_date,
    invoice.month AS invoice_month,
    sku.id AS sku_id,
    sku.description AS sku_description,
    location.region AS region,
    service.id AS service_id,
    service.description AS service_description,
    project.id AS project_id,
    project.name AS project_name,
    project.ancestry_numbers AS ancestry_numbers,
    labels_to_sorted_string(labels) as labels,
    usage.unit AS unit,
    cost,
    usage.amount AS usage_amount,
    credits,
    cost_type
  FROM
    billing_export_table
  WHERE
    service.description = "Compute Engine"
    AND (
      FALSE
      OR (LOWER(sku.description) LIKE "%instance%"
        OR LOWER(sku.description) LIKE "% intel %")
      OR LOWER(sku.description) LIKE "%memory optimized core%"
      OR LOWER(sku.description) LIKE "%memory optimized ram%"
      OR LOWER(sku.description) LIKE "%commitment%cpu%"
      OR LOWER(sku.description) LIKE "%commitment%ram%")
   -- Filter out Sole Tenancy skus that do not represent billable compute instance usage
  AND NOT
  ( FALSE
    -- the VMs that run on sole tenancy nodes are not actually billed. Just the sole tenant node is
    OR LOWER(sku.description) LIKE "%hosted on sole tenancy%"
    -- sole tenancy premium charge is not eligible instance usage
    OR LOWER(sku.description) LIKE "sole tenancy premium%"
  )
  -- Filter to time range when necessary columns (region) were released into Billing BQ Export
  AND CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) >= "2018-09-20"),

-- Create temporary table prices, in order to calculate unit price per (date, sku, region) tuple.
-- Export table only includes the credit dollar amount in the credit.amount field. We can get the credit
-- usage amount (e.g. core hours) by dividing credit.amount by unit price for that sku.
-- This assumes that the unit price for the usage is equal to the unit price for the associated
-- CUD credit. This should be correct, except in rare cases where unit price for that sku changed
-- during the day (i.e. a price drop, change in spending-based discount %)
-- It is necessary to do this in a separate table and join back into the main data set vs.
-- separately on each usage line because some line items have CUD credit but no associated
-- usage. We would not otherwise be able to calculate a unit price for these line items.
prices AS (
  SELECT
    usage_date,
    sku_id,
    region,
    -- calculate unit price per sku for each day. Catch line items with 0 usage to avoid divide by zero.
    -- using 1 assumes that there are no relevant (CUD related) skus with cost but 0 usage,
    -- which is correct for current billing data
    IF(SUM(usage_amount) = 0,
      0,
      SUM(cost) / SUM(usage_amount)) AS unit_price
  FROM
    usage_data
  GROUP BY 1,2,3),

-- sku_metadata temporary table captures information about skus, such as CUD eligibility,
-- whether the sku is vCPU or RAM, etc.
-- sku_metadata temporary table captures information about skus, such as CUD eligibility,
-- whether the sku is vCPU or RAM, etc.
sku_metadata AS (
  SELECT
    sku_id,
    -- parse sku_description to identify whether usage is CUD eligible, or if the
    -- line item is for a commitment charge
    CASE
      WHEN LOWER(sku_description) LIKE "%commitment%" THEN "CUD Commitment"
      WHEN ( LOWER(sku_description) LIKE "%preemptible%"
            OR LOWER(sku_description) LIKE "%micro%"
            OR LOWER(sku_description) LIKE "%small%"
            OR LOWER(sku_description) LIKE "%extended%" ) THEN "Ineligible Usage"
      WHEN ( (LOWER(sku_description) LIKE "%instance%"
            OR LOWER(sku_description) LIKE "% intel %")
            OR LOWER(sku_description) LIKE "%core%"
            OR LOWER(sku_description) LIKE "%ram%" ) THEN "Eligible Usage"
      ELSE NULL
      END AS usage_type,
    CASE
      WHEN ( LOWER(sku_description) LIKE "%megamem%"
            OR LOWER(sku_description) LIKE "%ultramem%"
            OR LOWER(sku_description) LIKE "%memory optimized%" ) THEN "Memory Optimized Usage"
      ELSE "Regular Usage"
      END AS cud_type,
    CASE
      WHEN LOWER(sku_description) LIKE "%americas%"
            OR LOWER(sku_description) LIKE "%los angeles%"
            OR LOWER(sku_description) LIKE "%sao paulo%"
            OR LOWER(sku_description) LIKE "%montreal%"
            OR LOWER(sku_description) LIKE "%virginia%" THEN "AMERICAS"
      WHEN LOWER(sku_description) LIKE "%emea%"
            OR LOWER(sku_description) LIKE "%netherlands%"
            OR LOWER(sku_description) LIKE "%frankfurt%"
            OR LOWER(sku_description) LIKE "%finland%"
            OR LOWER(sku_description) LIKE "%london%" THEN "EMEA"
      WHEN LOWER(sku_description) LIKE "%apac%"
            OR LOWER(sku_description) LIKE "%singapore%"
            OR LOWER(sku_description) LIKE "%japan%"
            OR LOWER(sku_description) LIKE "%hong kong%"
            OR LOWER(sku_description) LIKE "%mumbai%"
            OR LOWER(sku_description) LIKE "%sydney%" THEN "APAC"
      ELSE NULL
      END AS geo,
    -- for VM skus and commitments, "seconds" unit uniquely identifies vCPU usage
    -- and "byte-seconds" unit uniquely identifies RAM
    CASE
      WHEN ((LOWER(unit) LIKE "seconds") OR (LOWER(unit) LIKE "hour")) THEN "CPU"
      WHEN ((LOWER(unit) LIKE "byte-seconds") OR (LOWER(unit) LIKE "gibibyte hour"))THEN "RAM"
      ELSE NULL
      END AS unit_type,
    CASE
      WHEN ((LOWER(unit) LIKE "seconds") OR (LOWER(unit) LIKE "hour")) THEN "Avg. Concurrent vCPU"
      WHEN ((LOWER(unit) LIKE "byte-seconds") OR (LOWER(unit) LIKE "gibibyte hour")) THEN "Avg. Concurrent RAM GB"
      ELSE NULL
      END AS display_unit
  FROM
    usage_data
  GROUP BY 1,2,3,4,5,6),

  -- create temporary usage_credit_data table to separate out credits from usage into their own line items
  -- and associate necessary sku metadata with usage, commitment, and credit line items
  -- First usage query pulls out amount and dollar cost of Eligible Usage and Commitment charges
usage_credit_data AS (
(SELECT
  billing_account_id,
  usage_date,
  service_id,
  service_description,
  region,
  usage_type,
  cud_type,
  unit_type,
  unit,
  project_id,
  project_name,
  ancestry_numbers,
  labels,
  -- else part of the statement suppports test cases where the usage is hour or GiB hr
  IF((LOWER(unit) LIKE "seconds" OR LOWER(unit) LIKE "byte-seconds"),
    (CASE
      -- Divide by # seconds in a day to get to core*days == avg daily concurrent usage
      WHEN LOWER(unit_type) LIKE "cpu" THEN sum(usage_amount) / 86400
      -- Divide by # seconds in a day and # bytes in a GB to get to
      -- GB*days == avg daily concurrent RAM GB
      WHEN LOWER(unit_type) LIKE "ram" THEN sum(usage_amount) / (86400 * 1073741824)
      ELSE NULL
      END),
      (CASE
      WHEN LOWER(unit_type) LIKE "cpu" THEN sum(usage_amount)
      WHEN LOWER(unit_type) LIKE "ram" THEN sum(usage_amount)
      ELSE NULL
      END)) AS usage_amount,
   SUM(cost) AS cost,
   cost_type
  FROM
    usage_data AS u
JOIN
  sku_metadata
ON
  u.sku_id = sku_metadata.sku_id
WHERE
  usage_type IS NOT NULL
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,16)

UNION ALL
-- Second query pulls out CUD and SUD Credit usage and cost. This is done in a separate
-- SELECT and unioned because if we unnest the repeated field for credit types, we can
-- no longer correctly sum the usage in the first query.
(SELECT
  billing_account_id,
  usage_date,
  service_id,
  service_description,
  region,
  usage_type,
  cud_type,
  unit_type,
  unit,
  project_id,
  project_name,
  ancestry_numbers,
  labels,
  SUM(usage_amount) AS usage_amount,
  SUM(cost) AS cost,
  cost_type
FROM (
  SELECT
    u.billing_account_id,
    u.usage_date,
    service_id AS service_id,
    service_description AS service_description,
    u.region,
    CASE
      WHEN LOWER(cred.name) LIKE "%committed%" THEN 'CUD Credit'
      WHEN LOWER(cred.name) LIKE "%sustained%" THEN 'SUD Credit'
      ELSE NULL
      END AS usage_type,
    cud_type,
    unit_type,
    unit,
    project_id,
    project_name,
    ancestry_numbers,
    labels,
    unit_price,
    -- else part of the statement suppports test cases where the usage is hour or GiB hr
    IF(prices.unit_price IS NOT NULL,
      IF(prices.unit_price = 0,
        0,
        IF((LOWER(unit) LIKE "seconds" OR LOWER(unit) LIKE "byte-seconds"),
          (CASE
            WHEN LOWER(unit_type) = "cpu" THEN -1*SUM(cred.amount)/prices.unit_price / 86400
            -- Divide by # seconds in a day and # bytes in a GB to get to
            -- GB*days == avg daily concurrent RAM GB
            WHEN LOWER(unit_type) = "ram" THEN -1*SUM(cred.amount)/prices.unit_price / (86400 * 1073741824)
            ELSE NULL
            END),
          (CASE
            WHEN LOWER(unit_type) = "cpu" THEN -1*SUM(cred.amount)/prices.unit_price
            WHEN LOWER(unit_type) = "ram" THEN -1*SUM(cred.amount)/prices.unit_price
            ELSE NULL
            END))
          )
        ,0) AS usage_amount,
    SUM(cred.amount) AS cost,
    cost_type
  FROM
    usage_data AS u,
    UNNEST(credits) AS cred
  LEFT JOIN
    sku_metadata
  ON
    u.sku_id = sku_metadata.sku_id
  LEFT JOIN
    prices
  ON
    TRUE
    AND u.sku_id = prices.sku_id
    AND u.usage_date  = prices.usage_date
    AND u.region = prices.region
  WHERE
    LOWER(cred.name) LIKE "%committed%"
    OR LOWER(cred.name) LIKE "%sustained%"
  GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,17)
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,16))

SELECT
  billing_account_id,
  usage_date,
  service_id,
  service_description,
  region,
  project_id,
  project_name,
  ancestry_numbers,
  labels,
  cud_type,
  unit_type,
  cost_type,
  SUM(commitment_usage_amount) AS commitment_usage_amount,
  SUM(commitment_cost) AS commitment_cost,
  SUM(cud_credit_usage_amount) AS cud_credit_usage_amount,
  SUM(cud_credit_cost) AS cud_credit_cost,
  SUM(sud_credit_usage_amount) AS sud_credit_usage_amount,
  SUM(sud_credit_cost) AS sud_credit_cost,
  SUM(usage_amount) AS usage_amount,
  SUM(cost) AS cost
FROM (
  SELECT
    billing_account_id,
    usage_date,
    service_id,
    service_description,
    region,
    project_id,
    project_name,
    ancestry_numbers,
    labels,
    cud_type,
    unit_type,
    cost_type,
    (
    IF
      (usage_type LIKE "CUD Commitment",
        usage_amount,
        0)) AS commitment_usage_amount,
    (
    IF
      (usage_type LIKE "CUD Commitment",
        cost,
        0)) AS commitment_cost,
    (
    IF
      (usage_type LIKE "CUD Credit",
        usage_amount,
        0)) AS cud_credit_usage_amount,
    (
    IF
      (usage_type LIKE "CUD Credit",
        cost,
        0)) AS cud_credit_cost,
    (
    IF
      (usage_type LIKE "SUD Credit",
        usage_amount,
        0)) AS sud_credit_usage_amount,
    (
    IF
      (usage_type LIKE "SUD Credit",
        cost,
        0)) AS sud_credit_cost,
    (
    IF
      (usage_type LIKE "Eligible Usage",
        usage_amount,
        0)) AS usage_amount,
    (
    IF
      (usage_type LIKE "Eligible Usage",
        cost,
        0)) AS cost
  FROM
    usage_credit_data u
  GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20)
  WHERE unit_type IS NOT NULL AND cost_type IS NOT NULL AND cud_type IS NOT NULL
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12
)