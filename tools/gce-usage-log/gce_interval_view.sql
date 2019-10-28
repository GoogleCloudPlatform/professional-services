WITH
  timestamp_interval_table AS (
  SELECT
    instance_id,
    GENERATE_TIMESTAMP_ARRAY(TIMESTAMP_TRUNC(inserted, _TIME_INTERVAL_UNIT_),
      TIMESTAMP_TRUNC(IFNULL(deleted,
          CURRENT_TIMESTAMP()), _TIME_INTERVAL_UNIT_),
      INTERVAL _TIME_INTERVAL_AMOUNT_ _TIME_INTERVAL_UNIT_) AS custom_interval_array
  FROM
    `_PROJECT_.gce_usage_log._gce_usage_log`)
SELECT
  timestamp_interval_table.instance_id,
  custom_interval,
  preemptible,
  project_id,
  zone,
  machine_type,
  cores,
  memory_mb,
  pd_standard_size_gb,
  pd_ssd_size_gb,
  tags,
  labels
FROM
  timestamp_interval_table,
  UNNEST(custom_interval_array) AS custom_interval
JOIN
  `_PROJECT_.gce_usage_log._gce_usage_log` usage_view
ON
  usage_view.instance_id = timestamp_interval_table.instance_id
ORDER BY custom_interval ASC
