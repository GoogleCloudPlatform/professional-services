WITH
  dagtask_ptile_duration_across_runs AS (
    SELECT
      dag_id,
      task_id,
      PERCENTILE_CONT(TIMESTAMP_DIFF(task_end_ts, task_start_ts, SECOND), 0.5) OVER(PARTITION BY dag_id, task_id) as p50_task_duration_sec,
      PERCENTILE_CONT(TIMESTAMP_DIFF(task_end_ts, task_start_ts, SECOND), 0.8) OVER(PARTITION BY dag_id, task_id) as p80_task_duration_sec,
      PERCENTILE_CONT(TIMESTAMP_DIFF(task_end_ts, task_start_ts, SECOND), 1) OVER(PARTITION BY dag_id, task_id) as max_task_duration_sec
    FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
    WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 10
      AND task_end_ts IS NOT NULL
      AND task_start_ts IS NOT NULL
    QUALIFY ROW_NUMBER() OVER(PARTITION BY dag_id, task_id) = 1
  )
SELECT
  CASE
    WHEN task_duration_sec < p50_task_duration_sec THEN "[1] <P50"
    WHEN task_duration_sec BETWEEN p50_task_duration_sec AND p80_task_duration_sec THEN "[2] P50-P80"
    WHEN task_duration_sec BETWEEN p80_task_duration_sec AND max_task_duration_sec THEN "[3] >P80"
    WHEN task_duration_sec is NULL OR task_duration_sec > max_task_duration_sec THEN "[4] >Max OR NULL"
  END as task_duration_category,
  stats_view.*
FROM (
  SELECT
    TIMESTAMP_DIFF(COALESCE(task_end_ts, CURRENT_TIMESTAMP()),task_start_ts, SECOND) as task_duration_sec,
    task_state,
    dag_id,
    run_id,
    run_start_ts,
    task_id,
    task_operator
    task_job_id,
    task_start_ts,
    task_updated_ts,
    task_end_ts
  FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
  WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 10
    AND dagrun_rk = 1
    AND task_end_ts IS NULL) as stats_view
LEFT JOIN dagtask_ptile_duration_across_runs as ptiles
        ON stats_view.dag_id = ptiles.dag_id
        AND stats_view.task_id = ptiles.task_id
ORDER BY task_duration_category DESC