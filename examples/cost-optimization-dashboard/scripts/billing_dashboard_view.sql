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
-- Update <PROJECT> and <BILLING_EXPORT_TABLE>.
-- Use this query as a Datastudio 'Custom Query'.
*/

WITH
  -- Selective billing data from billing export
  billing_data AS (
  SELECT
    billing_account_id,
    service,
    sku,
    usage_start_time,
    usage_end_time,
    STRUCT( coalesce(
      IF
        (service.description='Support',
          'Support',
          project.id),
        "Unknown") AS id,
      project.name,
      project.ancestry_numbers) AS project,
    project.labels AS project_labels,
    labels AS resource_labels,
    system_labels,
    location,
    cost,
    credits,
    currency,
    currency_conversion_rate,
    usage,
    invoice,
    cost_type
  FROM
    `<PROJECT>.billing.<BILLING_EXPORT_TABLE>`
  WHERE
    usage_start_time >= PARSE_TIMESTAMP('%Y%m%d', @DS_START_DATE)
    AND usage_end_time <= PARSE_TIMESTAMP('%Y%m%d', @DS_END_DATE)),
  -- Costs data
  costs AS (
  SELECT
    ' Gross' AS cost_metric_type,
    cost,
    0 AS credit_amount,
    billing_data.* EXCEPT(credits, cost)
  FROM
    billing_data ),
  -- Credits data
  credits AS (
  SELECT
    c.name AS cost_metric_type,
    0 AS cost,
    c.amount AS credit_amount,
    billing_data.* EXCEPT(credits,
      cost)
  FROM
    billing_data
  JOIN
    UNNEST(credits) c
  WHERE
    c.name IS NOT NULL )
-- Query costs and credits
SELECT
  costs.*
FROM
  costs
UNION ALL
SELECT
  credits.*
FROM
  credits
