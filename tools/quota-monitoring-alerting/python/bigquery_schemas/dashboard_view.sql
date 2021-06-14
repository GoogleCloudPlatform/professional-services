WITH
  latest AS (
  SELECT
    *
  FROM
    `$PROJECT.quota.metrics`
  WHERE
    timestamp = (
    SELECT
      MAX(timestamp)
    FROM
      `$PROJECT.quota.metrics`)),
  consumption AS (
  SELECT
    latest.* EXCEPT(metric_type, metric_value_types, metric_values)
  FROM
    latest )
SELECT
  *
FROM
  consumption
