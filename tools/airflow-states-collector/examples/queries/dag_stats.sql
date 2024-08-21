SELECT
    dag_id,
    COUNT(DISTINCT CONCAT(dag_id, "_", run_id)) as total_dagruns,
    SUM(
            CASE
                WHEN run_state = "success" THEN 1
                ELSE 0
                END
        ) as total_succesful_runs,
    SUM(
            CASE
                WHEN run_state = "failed" THEN 1
                ELSE 0
                END
        ) as total_failed_runs,
    MIN(TIMESTAMP_DIFF(COALESCE(run_end_ts, CURRENT_TIMESTAMP()), run_start_ts, SECOND)) as min_run_duration_sec,
    MAX(TIMESTAMP_DIFF(COALESCE(run_end_ts, CURRENT_TIMESTAMP()), run_start_ts, SECOND)) as max_run_duration_sec,
    AVG(TIMESTAMP_DIFF(COALESCE(run_end_ts, CURRENT_TIMESTAMP()), run_start_ts, SECOND)) as avg_run_duration_sec,
    MAX(run_start_ts) as max_run_start_time,
    MAX(run_end_ts) as max_run_end_time
FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 10
  AND dagrun_rk = 1
GROUP BY dag_id
ORDER BY total_dagruns DESC