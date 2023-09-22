SELECT
    DATE(run_start_ts) as run_start_date,
    COUNT(DISTINCT dag_id) as uniq_dags_count,
    COUNT(DISTINCT CONCAT(dag_id,"_",run_id)) as uniq_dagruns_count
FROM `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}`
WHERE DATE(run_start_ts, "Asia/Kolkata") >= CURRENT_DATE("Asia/Kolkata") - 10
  AND dagrun_rk = 1
GROUP BY run_start_date
ORDER BY run_start_date DESC