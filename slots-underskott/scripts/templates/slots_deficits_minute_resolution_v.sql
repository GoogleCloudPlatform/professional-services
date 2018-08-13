SELECT
  SAFE_CONVERT_BYTES_TO_STRING(project_id) AS project_id,
  SAFE_CONVERT_BYTES_TO_STRING(job_id) AS job_id,
  DATETIME_TRUNC(DATETIME(time_window),
    MINUTE) AS minute_window,
  MAX(pending_units) as pending_units,
  MAX(active_units) as active_units
FROM
  `${PROJECT_ID}.slots_deficits.slots_deficits`
GROUP BY
  minute_window,
  project_id,
  job_id
