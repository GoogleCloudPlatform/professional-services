SELECT
    dag_id,
    run_id,
    run_state,
    TIMESTAMP_DIFF(COALESCE(MAX(run_end_ts), CURRENT_TIMESTAMP()), MAX(run_start_ts), SECOND) as run_duration_sec,
    MAX(run_start_ts) as run_stat_time,
    MAX(run_end_ts) as run_end_time,
    COUNT(DISTINCT task_job_id) as total_tasks,
    MIN(TIMESTAMP_DIFF(COALESCE(task_end_ts, CURRENT_TIMESTAMP()),task_start_ts, SECOND)) as min_task_duration_sec,
    MAX(TIMESTAMP_DIFF(COALESCE(task_end_ts, CURRENT_TIMESTAMP()),task_start_ts, SECOND)) as max_task_duration_sec,
    AVG(TIMESTAMP_DIFF(COALESCE(task_end_ts, CURRENT_TIMESTAMP()),task_start_ts, SECOND)) as avg_task_duration_sec
FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 10
  AND dagrun_rk = 1
GROUP BY dag_id, run_id, run_state
ORDER BY dag_id DESC