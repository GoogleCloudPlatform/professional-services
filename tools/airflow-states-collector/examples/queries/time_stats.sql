SELECT
    MAX(run_end_ts) as last_dagrun_end_time,
    MAX(run_start_ts) as last_dagrun_start_time,
    MAX(COALESCE(task_updated_ts, task_end_ts)) as last_task_updated_time,
    TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(run_end_ts), SECOND) as sec_elapsed_since_last_run_end,
    TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(run_start_ts), SECOND) as sec_elapsed_since_last_run_start,
    TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(COALESCE(task_updated_ts, task_end_ts)), SECOND) as sec_elapsed_since_last_task_update,
FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 2
