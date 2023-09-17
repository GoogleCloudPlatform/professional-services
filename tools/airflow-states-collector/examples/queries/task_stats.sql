SELECT
    dag_id,
    run_id,
    run_state,
    task_id,
    task_state,
    task_operator,
    TIMESTAMP_DIFF(COALESCE(MAX(task_end_ts), CURRENT_TIMESTAMP()),MAX(task_start_ts), SECOND) as task_duration,
    MAX(task_start_ts) as task_start_time,
    MAX(task_updated_ts) as task_updated_time,
    MAX(task_end_ts) as task_end_time
FROM `nikunjbhartia-test-clients.airflow.airflow-v2-metrics-view`
WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 10
  AND dagrun_rk = 1
GROUP BY dag_id, run_id, run_state, task_id, task_state, task_operator