SELECT
  time_window AS time_window,
  SAFE_CONVERT_BYTES_TO_STRING(project_id) AS project,
  SUM(pending_units) AS pending_units,
  SUM(active_units) AS active_units
FROM
  `${PROJECT_ID}.slots_deficits.slots_deficits`
where pending_units > 0 or active_units >0
GROUP BY
  time_window,
  project
ORDER BY
  time_window
