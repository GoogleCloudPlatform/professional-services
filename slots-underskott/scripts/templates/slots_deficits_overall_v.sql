SELECT
  time_window AS time_window,
  SUM(pending_units) AS pending_units,
  sum(active_units) AS active_units
FROM
  `${PROJECT_ID}.slots_deficits.slots_deficits`
where pending_units > 0 or active_units >0
GROUP BY
  time_window
ORDER BY
  time_window
