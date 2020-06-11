/*
 * Script: bigquery_billing_export.sql
 * Author: freedomofnet
 * Description:
 * This SQL script transforms the billing export table to anonymize user data
 * and included a linear projection for daily running cost. The output table
 * powers the Cloud Billing Dashboard
 * (https://cloud.google.com/billing/docs/how-to/visualize-data).
 */

WITH
-- Generate dates in the current month.
current_month_dates AS (
  SELECT gen_date
  FROM
    UNNEST(
      GENERATE_DATE_ARRAY(
        DATE_TRUNC(CURRENT_DATE(), MONTH),
        DATE_SUB(DATE_TRUNC(
          DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH), MONTH),
        INTERVAL 1 DAY),
      INTERVAL 1 DAY)
    ) AS gen_date),

-- Calculate daily cost per generated date
daily_cost AS (
  SELECT
    dates.gen_date,
    SUM(billing.cost) AS cost
  FROM current_month_dates AS dates
  LEFT JOIN `billing.gcp_billing_export_v1*` AS billing -- Update the table name to the correct one.
    ON EXTRACT(DATE FROM BILLING._PARTITIONTIME) = dates.gen_date
  GROUP BY 1
  ORDER BY 1),

-- Calculate average daily cost in a month
avg_daily_cost AS (
  SELECT
    AVG(daily_cost.cost) AS cost
  FROM daily_cost),

-- Calculate projected_running_cost
projected_cost AS (
SELECT
  daily_cost.gen_date AS date,
  daily_cost.cost AS daily_cost,
  avg_daily_cost.cost AS avg_daily_cost,
  (DATE_DIFF(daily_cost.gen_date, DATE_TRUNC(CURRENT_DATE, MONTH), DAY) + 1) *
    avg_daily_cost.cost AS projected_running_cost
FROM daily_cost
CROSS JOIN avg_daily_cost)


SELECT
  projected_cost.*,
  -- Anonymize data
  TO_BASE64(MD5(billing_account_id)) AS billing_account_id,
  STRUCT(
    TO_BASE64(MD5(project.id)) AS id,
    TO_BASE64(MD5(project.name)) AS name,
    TO_BASE64(MD5(project.ancestry_numbers)) AS ancestry_numbers,
    project.labels AS labels
  ) AS project,
  billing.* EXCEPT(billing_account_id, project)
  -- End anonymize data, for production simiply replace above code with billing.*
FROM `billing.gcp_billing_export_v1*` AS billing -- Update the table name to the correct one.
LEFT JOIN projected_cost
  ON EXTRACT(DATE FROM billing._PARTITIONTIME) = projected_cost.date;
