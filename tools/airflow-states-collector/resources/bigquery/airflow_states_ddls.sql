
CREATE OR REPLACE TABLE `{{ PROJECT }}.{{ DATASET }}.{{ TABLE_NAME }}` (
  dag_id STRING,
  run_id STRING,
  run_state STRING,
  run_start_ts TIMESTAMP,
  run_end_ts TIMESTAMP,
  updated_tasks ARRAY<STRUCT<id STRING, job_id STRING, operator STRING, state STRING, start_ts TIMESTAMP, end_ts TIMESTAMP, updated_ts TIMESTAMP>>,
  created_at TIMESTAMP
)
PARTITION BY DATE(run_start_ts)
CLUSTER BY dag_id, run_id
OPTIONS(
    partition_expiration_days={{ EXPIRY_DAYS }}
);


CREATE OR REPLACE VIEW `{{ PROJECT }}.{{ DATASET }}.{{ VIEW_NAME }}` AS
SELECT *  EXCEPT(task_rk)
FROM (
    SELECT
      dag_id,
      run_id,
      run_state,
      run_start_ts,
      run_end_ts,
      t.id as task_id,
      t.job_id as task_job_id,
      t.operator as task_operator,
      t.state as task_state,
      t.start_ts as task_start_ts,
      t.end_ts as task_end_ts,
      t.updated_ts as task_updated_ts,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY dag_id, run_id, t.job_id ORDER BY COALESCE(t.end_ts, t.start_ts, run_end_ts, run_start_ts, created_at) DESC) as task_rk,
      ROW_NUMBER() OVER (PARTITION BY dag_id, run_id  ORDER BY COALESCE(t.end_ts, t.start_ts) DESC) as dagrun_rk
  FROM `{{ PROJECT }}.{{ DATASET }}.{{ TABLE_NAME }}`, UNNEST(updated_tasks) as t)
WHERE task_rk = 1 ;