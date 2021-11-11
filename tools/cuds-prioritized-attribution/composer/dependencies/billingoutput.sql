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


CREATE TEMP FUNCTION string_to_label_array(lables_str STRING)
RETURNS ARRAY<STRUCT<key STRING, value STRING>>
LANGUAGE js
  AS '''
return JSON.parse(lables_str);
''';

CREATE TEMP FUNCTION
  commitmentSKUToNegationSKU(sku_desc STRING)
  RETURNS STRING AS ( IF(REGEXP_CONTAINS(sku_desc, r"[cC]ommitment v[0-9]: [a-zA-Z]+ in [a-zA-Z0-9\\-]+ for [0-9]+ [_a-zA-Z]+"),
      CONCAT(
        --prefix
        "Reattribution_Negation_CUD_",
        --number
        REGEXP_EXTRACT(sku_desc, r"[cC]ommitment v[0-9]: [a-zA-Z]+ in [a-zA-Z0-9\\-]+ for ([0-9]+) [_a-zA-Z]+"),
        --timeframe
        REGEXP_EXTRACT(sku_desc, r"[cC]ommitment v[0-9]: [a-zA-Z]+ in [a-zA-Z0-9\\-]+ for [0-9]+ ([_a-zA-Z]+)"), "_",
        --UPPER(type)
        UPPER(REGEXP_EXTRACT(sku_desc, r"[cC]ommitment v[0-9]: ([a-zA-Z]+) in [a-zA-Z0-9\\-]+ for [0-9]+ [_a-zA-Z]+")), "_COST_",
        --region
        REGEXP_EXTRACT(sku_desc, r"[cC]ommitment v[0-9]: [a-zA-Z]+ in ([a-zA-Z0-9\\-]+) for [0-9]+ [_a-zA-Z]+") ),
      NULL));

CREATE TEMP FUNCTION
  regionMapping(gcp_region STRING)
  RETURNS STRING AS (
    CASE
      WHEN gcp_region IS NULL THEN NULL
      WHEN gcp_region LIKE "us-%"
    OR gcp_region LIKE "northamerica%"
    OR gcp_region LIKE "southamerica%" THEN "Americas"
      WHEN gcp_region LIKE "europe-%" THEN "EMEA"
      WHEN gcp_region LIKE "australia-%"
    OR gcp_region LIKE "asia-%" THEN"APAC" END);

CREATE TEMP FUNCTION
   ratio(numerator float64, denominator float64)
  as (IF(denominator = 0,
        0,
        numerator / denominator));

(
  WITH
  billing_export_table AS (
    SELECT
      *
    FROM
      `{{ params.billing_export_table_name }}`
    WHERE
      CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) >= "2018-09-20"),

  correct_cud_costs AS (
    SELECT
      billing_account_id AS billing_account_id,
      STRUCT ( service_id AS id,
      service_description AS description) AS service,
      STRUCT (CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram",
                "RAM_COST",
                "CORE_COST"), "_", regionMapping(region)) AS id,
              CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram",
                "RAM_COST",
                "CORE_COST"), "_", regionMapping(region)) AS description) AS sku,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      STRUCT (project_id AS id,
              project_name AS name,
              ARRAY<STRUCT<key STRING,
              value STRING>> [] AS labels,
              ancestry_numbers AS ancestry_numbers) AS project,
      string_to_label_array(d.labels) as labels,
      ARRAY<STRUCT<key STRING,value STRING>> [] AS system_labels,
      STRUCT ( "" AS location,
                "" AS country,
              region AS region,
              "" AS zone ) AS location,
      CURRENT_TIMESTAMP() AS export_time,
      P_alloc_commitment_cost_{{ params.cud_cost_attribution_option }} AS cost,
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT ( 0.0 AS amount,
              IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "gibibyte hour") AS unit,
      0.0 AS amount_in_pricing_units,
      IF(LOWER(unit_type) LIKE "ram", "seconds", "hour") AS pricing_unit ) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64,
      full_name STRING,
      id STRING,
      type STRING>> [] AS credits,
      STRUCT ( FORMAT_DATE("%Y%m", usage_date) AS month) AS invoice,
      cost_type
    FROM
      `{{ params.project_id }}.{{ params.corrected_dataset_id }}.{{ params.distribute_commitments_table }}` d
    WHERE
      {{ params.enable_cud_cost_attribution }}
      AND P_alloc_commitment_cost_{{ params.cud_cost_attribution_option }} <> 0
  ),

  correct_cud_credits AS (
    SELECT
      billing_account_id AS billing_account_id,
      STRUCT ( service_id AS id,
      service_description AS description) AS service,
      STRUCT ( CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram","RAM",
                "CORE"), "_CREDIT_", regionMapping(region)) AS id,
              CONCAT("Reattribution_Addition_CUD_", IF(LOWER(unit_type) LIKE "ram","RAM",
                "CORE"), "_CREDIT_", regionMapping(region)) AS description) AS sku,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      STRUCT ( project_id AS id,
                project_name AS name,
                ARRAY<STRUCT<key STRING,value STRING>> [] AS labels,
                ancestry_numbers AS ancestry_numbers) AS project,
      string_to_label_array(d.labels) as labels,
      ARRAY<STRUCT<key STRING,value STRING>> [] AS system_labels,
      STRUCT ( region AS location,
                "" AS country,
                region AS region,
                "" AS zone ) AS location,
      CURRENT_TIMESTAMP() AS export_time,
      0.0 AS cost,
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT ( 0.0 AS amount,
                IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "seconds") AS unit,
                0.0 AS amount_in_pricing_units,
                IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "seconds") AS pricing_unit
              ) AS usage,
      ARRAY<STRUCT<name STRING,
                  amount FLOAT64,
                  full_name STRING,
                  id STRING,
                  type STRING>>[(IF(LOWER(unit_type) LIKE "ram",
                                      "Committed Usage Discount: RAM",
                                      "Committed Usage Discount: CPU"),
                                      P_alloc_cud_credit_cost,
                                      "",
                                      "",
                                      ""
                                    )] AS credits,
      STRUCT ( FORMAT_DATE("%Y%m", usage_date) AS month) AS invoice,
      cost_type
    FROM
      `{{ params.project_id }}.{{ params.corrected_dataset_id }}.{{ params.distribute_commitments_table }}` d
      WHERE
    P_alloc_cud_credit_cost <> 0

  ),
  cancelled_credits AS (
    SELECT
      billing_account_id,
      service AS service,
      sku,
      usage_start_time,
      usage_end_time,
      project AS project,
      labels,
      system_labels,
      location AS location,
      export_time,
      0.0 AS cost,
      currency,
      currency_conversion_rate,
      STRUCT( 0.0 AS amount,
      usage.unit AS unit,
      0.0 AS amount_in_pricing_units,
      usage.pricing_unit AS pricing_unit) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64,
      full_name STRING,
      id STRING,
      type STRING>> [(cs.name,
        -1*cs.amount,
        "",
        "",
        "")] AS credits,
      invoice,
      cost_type
    FROM
      billing_export_table,
      UNNEST(credits) AS cs
    WHERE
      service.description = "Compute Engine"
    AND (
      FALSE
      OR (LOWER(sku.description) LIKE "%instance%"
        OR LOWER(sku.description) LIKE "% intel %")
      OR LOWER(sku.description) LIKE "%memory optimized core%"
      OR LOWER(sku.description) LIKE "%memory optimized ram%"
      OR LOWER(sku.description) LIKE "%commitment%")
   -- Filter out Sole Tenancy skus that do not represent billable compute instance usage
  AND NOT
  ( FALSE
    -- the VMs that run on sole tenancy nodes are not actually billed. Just the sole tenant node is
    OR LOWER(sku.description) LIKE "%hosted on sole tenancy%"
    -- sole tenancy premium charge is not eligible instance usage
    OR LOWER(sku.description) LIKE "sole tenancy premium%"
  )
  and  (LOWER(cs.name) LIKE "%committed%" OR LOWER(cs.name) LIKE "%sustained%")
  ),

  cancelled_cud_costs AS (
  SELECT
    billing_account_id,
    service AS service,
    STRUCT ( commitmentSKUToNegationSKU(sku.description ) AS id,
              commitmentSKUToNegationSKU(sku.description) AS description
            ) AS sku,
    usage_start_time,
    usage_end_time,
    project AS project,
    labels,
    system_labels,
    location AS location,
    export_time,
    -1.0*cost AS cost,
    currency,
    currency_conversion_rate,
    STRUCT( 0.0 AS amount,
            usage.unit AS unit,
            0.0 AS amount_in_pricing_units,
            usage.pricing_unit AS pricing_unit) AS usage,
    ARRAY<STRUCT<name STRING,
      amount FLOAT64,
      full_name STRING,
      id STRING,
      type STRING>> [] AS credits,
    invoice,
    cost_type
  FROM
    billing_export_table
  WHERE
    {{ params.enable_cud_cost_attribution }}
  AND service.description = "Compute Engine"
  AND LOWER(sku.description) LIKE "%commitment%"
  AND cost <> 0
  ),

  correct_sud_credits AS (
    SELECT
      billing_account_id AS billing_account_id,
      STRUCT ( service_id AS id,
        service_description AS description) AS service,
      STRUCT ( "Reattribution_Addition_SUD_CREDIT" AS id,
        "Reattribution_Addition_SUD_CREDIT" AS description) AS sku,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_start_time,
      TIMESTAMP_ADD(TIMESTAMP(usage_date), INTERVAL ((3600*23)+3599) SECOND) AS usage_end_time,
      STRUCT ( project_id AS id,
        project_name AS name,
        ARRAY<STRUCT<key STRING,
        value STRING>> [] AS labels,
        ancestry_numbers AS ancestry_numbers)
         AS project,
      string_to_label_array(d.labels) as labels,
      ARRAY<STRUCT<key STRING,
      value STRING>> [] AS system_labels,
      STRUCT ( "" AS location,
        "" AS country,
        region AS region,
        "" AS zone ) AS location,
      CURRENT_TIMESTAMP() AS export_time,
      0.0 AS cost,
      "USD" AS currency,
      1.0 AS currency_conversion_rate,
      STRUCT ( 0.0 AS amount,
                IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "seconds") AS unit,
                0.0 AS amount_in_pricing_units,
                IF(LOWER(unit_type) LIKE "ram", "byte-seconds", "seconds") AS pricing_unit
              ) AS usage,
      ARRAY<STRUCT<name STRING,
      amount FLOAT64,
      full_name STRING,
      id STRING,
      type STRING>> [("Sustained Usage Discount",
        P_alloc_sud_credit_cost, "", "", "")] AS credits,
      STRUCT ( FORMAT_DATE("%Y%m", usage_date) AS month) AS invoice,
      cost_type
    FROM
      `{{ params.project_id }}.{{ params.corrected_dataset_id }}.{{ params.distribute_commitments_table }}` d
    WHERE
      P_alloc_sud_credit_cost <> 0)

 SELECT
    *
  FROM
  correct_sud_credits

  UNION ALL

 SELECT
    *
  FROM
  correct_cud_credits

  UNION ALL

  SELECT
    *
  FROM
  cancelled_credits

  UNION ALL

  SELECT
    *
  FROM
  correct_cud_costs

  UNION ALL

  SELECT
    *
  FROM
  cancelled_cud_costs

  UNION ALL

  SELECT
  *
  FROM
  `{{ params.billing_export_table_name }}`
)
