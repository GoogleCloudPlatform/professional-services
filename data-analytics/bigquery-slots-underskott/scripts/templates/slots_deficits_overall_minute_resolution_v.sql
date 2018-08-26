SELECT
  minute_window AS minute_window,
  SUM(pending_units) AS pending_units,
  sum(active_units) AS active_units
FROM
  `${PROJECT_ID}.slots_deficits.slots_deficits_minute_resolution`
where pending_units > 0 or active_units >0
GROUP BY
  minute_window
ORDER BY
  minute_window
