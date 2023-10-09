SELECT
    run_state,
    COUNT(DISTINCT dag_id) as uniq_dags_count,
    COUNT(DISTINCT CONCAT(dag_id,"_",run_id)) as uniq_dagruns_count,
FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 2
GROUP BY run_state