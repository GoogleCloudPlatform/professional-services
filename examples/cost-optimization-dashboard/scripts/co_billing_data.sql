/*
  -- Copyright 2021 Google Inc. All Rights Reserved.

  -- Licensed under the Apache License, Version 2.0 (the "License");
  -- you may not use this file except in compliance with the License.
  -- You may obtain a copy of the License at

  --   http://www.apache.org/licenses/LICENSE-2.0

  -- Unless required by applicable law or agreed to in writing, software
  -- distributed under the License is distributed on an "AS IS" BASIS,
  -- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -- See the License for the specific language governing permissions and
  -- limitations under the License.
*/

/*
Query to extract daily and monthly billing data reports.
NOTE:
1. Assumes that the current project contains 'dashboard' dataset.
        Else, replace with correct name to create it elsewhere.
2. Replace `billing.<BILLING_EXPORT_TABLE>` with correct table name.
*/

WITH
  -- billing data
  billing_data AS (
  SELECT
    * EXCEPT(labels,
      system_labels)
  FROM
    `billing.<BILLING_EXPORT_TABLE>`
  WHERE
    service.description IN ( 'Compute Engine',
      'Cloud Storage',
      'BigQuery',
      'BigQuery Reservation API',
      'BigQuery Storage API'
      -- These are not part of MVP
      --,
      --'BigQuery BI Engine'
      --,
      --'BigQuery Data Transfer Service'
      )
    AND invoice.month IS NOT NULL ),
  -- monthly billing data
  monthly_billing_data AS (
  SELECT
    -- First full month of this is June 2018
    -- Every month has 28 day
    DATE(CAST(SUBSTR(invoice.month, 0, 4) AS INT64), CAST(SUBSTR(invoice.month, -2) AS INT64), 28) AS usage_date,
    invoice.month AS invoice_month,
    service.id AS service_id,
    service.description AS service_description,
    sku.id AS sku_id,
    sku.description AS sku_description,
    project.id AS project_id,
    project.name AS project_name,
    -- usage at the level of a country, region, or zone; or global for non location specific resources
    location.location AS usage_location,
    currency,
    usage.unit AS usage_unit,
    SUM(usage.amount) AS usage_amount_in_usage_units,
    usage.pricing_unit AS usage_pricing_unit,
    SUM(usage.amount_in_pricing_units) AS usage_amount_in_pricing_units,
    -- regular, tax, adjustment, or rounding error
    -- cost_type,
    (SUM(cost) + SUM(IFNULL((
          SELECT
            SUM(c.amount)
          FROM
            UNNEST(credits) c),
          0)) ) AS total_cost,
    ((SUM(CAST(cost * 1000000 AS int64)) + SUM(IFNULL((
            SELECT
              SUM(CAST(c.amount * 1000000 AS int64))
            FROM
              UNNEST(credits) c),
            0)) ) / 1000000 ) AS total_cost_exact,
    -- EXCEPT(labels, system_labels, credits)
    (CASE
      -- VCPU RAM
        WHEN usage.pricing_unit = 'gibibyte hour' THEN 'GB'
      -- VCPU Cores
        WHEN usage.pricing_unit = 'hour' THEN 'Count'
      -- PD Storage
      -- WHEN usage.pricing_unit = 'gibibyte month' THEN ROUND(SUM(usage.amount_in_pricing_units) * 30, 2)
      ELSE
      usage.pricing_unit
    END
      ) AS usage_calculated_unit,
    (CASE
      -- VCPU RAM
        WHEN usage.pricing_unit = 'gibibyte hour' THEN (SUM(usage.amount_in_pricing_units) / 24)
      -- VCPU Cores
        WHEN usage.pricing_unit = 'hour' THEN (SUM(usage.amount_in_pricing_units) / 24)
      -- PD Storage
      -- WHEN usage.pricing_unit = 'gibibyte month' THEN ROUND(SUM(usage.amount_in_pricing_units) * 30, 2)
      ELSE
      SUM(usage.amount_in_pricing_units)
    END
      ) AS usage_amount_in_calculated_units
  FROM
    billing_data
  GROUP BY
    invoice_month,
    service_id,
    service_description,
    sku_id,
    sku_description,
    project_id,
    project_name,
    usage_location,
    currency,
    usage_unit,
    usage_pricing_unit ),
  -- Daily billign data
  daily_billing_data AS (
  SELECT
    -- First full month of this is June 2018
    DATE(usage_end_time, 'UTC') AS usage_date,
    invoice.month AS invoice_month,
    service.id AS service_id,
    service.description AS service_description,
    sku.id AS sku_id,
    sku.description AS sku_description,
    project.id AS project_id,
    project.name AS project_name,
    -- usage at the level of a country, region, or zone; or global for non location specific resources
    location.location AS usage_location,
    currency,
    usage.unit AS usage_unit,
    SUM(usage.amount) AS usage_amount_in_usage_units,
    usage.pricing_unit AS usage_pricing_unit,
    SUM(usage.amount_in_pricing_units) AS usage_amount_in_pricing_units,
    -- regular, tax, adjustment, or rounding error
    -- cost_type,
    (SUM(cost) + SUM(IFNULL((
          SELECT
            SUM(c.amount)
          FROM
            UNNEST(credits) c),
          0)) ) AS total_cost,
    ((SUM(CAST(cost * 1000000 AS int64)) + SUM(IFNULL((
            SELECT
              SUM(CAST(c.amount * 1000000 AS int64))
            FROM
              UNNEST(credits) c),
            0)) ) / 1000000 ) AS total_cost_exact,
    -- EXCEPT(labels, system_labels, credits)
    (CASE
      -- VCPU RAM
        WHEN usage.pricing_unit = 'gibibyte hour' THEN 'GB'
      -- VCPU Cores
        WHEN usage.pricing_unit = 'hour' THEN 'Count'
      -- PD Storage
      -- WHEN usage.pricing_unit = 'gibibyte month' THEN ROUND(SUM(usage.amount_in_pricing_units) * 30, 2)
      ELSE
      usage.pricing_unit
    END
      ) AS usage_calculated_unit,
    (CASE
      -- VCPU RAM
        WHEN usage.pricing_unit = 'gibibyte hour' THEN (SUM(usage.amount_in_pricing_units) / 24)
      -- VCPU Cores
        WHEN usage.pricing_unit = 'hour' THEN (SUM(usage.amount_in_pricing_units) / 24)
      -- PD Storage
      -- WHEN usage.pricing_unit = 'gibibyte month' THEN ROUND(SUM(usage.amount_in_pricing_units) * 30, 2)
      ELSE
      SUM(usage.amount_in_pricing_units)
    END
      ) AS usage_amount_in_calculated_units
  FROM
    billing_data
  GROUP BY
    usage_date,
    invoice_month,
    service_id,
    service_description,
    sku_id,
    sku_description,
    project_id,
    project_name,
    usage_location,
    currency,
    usage_unit,
    usage_pricing_unit )

-- Combined Billing data
SELECT
  *
FROM (
  SELECT
    'Monthly' AS granularity,
    *
  FROM
    monthly_billing_data
  UNION ALL
  SELECT
    'Daily' AS granularity,
    *
  FROM
    daily_billing_data )
