from datetime import timedelta, datetime
from airflow import DAG
from airflow.models import Variable
from airflow.contrib.operators.bigquery_operator import BigQueryOperator
from airflow.contrib.operators.bigquery_check_operator import BigQueryCheckOperator


# Config variables
dag_config = Variable.get("bigquery_github_trends_variables", deserialize_json=True)
BQ_CONN_ID = dag_config["bq_conn_id"]
BQ_PROJECT = dag_config["bq_project"]
BQ_DATASET = dag_config["bq_dataset"]

default_args = {
    'owner': 'airflow',
    'depends_on_past': True,
    'start_date': datetime(2018, 12, 1),
    'end_date': datetime(2018, 12, 5),
    'email': ['airflow@airflow.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# Set Schedule: Run pipeline once a day.
# Use cron to define exact time. Eg. 8:15am would be "15 08 * * *"
schedule_interval = "00 21 * * *"

# Define DAG: Set ID and assign default args and schedule interval
dag = DAG(
    'bigquery_github_trends',
    default_args=default_args,
    schedule_interval=schedule_interval
    )

# Task 1: check that the github archive data has a dated table created for that date
# To test this task, run this command:
# docker-compose -f docker-compose-gcloud.yml run --rm webserver airflow
# test bigquery_github_trends bq_check_githubarchive_day 2018-12-01
t1 = BigQueryCheckOperator(
        task_id='bq_check_githubarchive_day',
        sql='''
        #standardSQL
        SELECT
          table_id
        FROM
          `githubarchive.day.__TABLES_SUMMARY__`
        WHERE
          table_id = "{{ yesterday_ds_nodash }}"
        ''',
        use_legacy_sql=False,
        bigquery_conn_id=BQ_CONN_ID,
        dag=dag
    )

# Task 2: check that the hacker news table contains data for that date.
t2 = BigQueryCheckOperator(
        task_id='bq_check_hackernews_full',
        sql='''
        #standardSQL
        SELECT
          FORMAT_TIMESTAMP("%Y%m%d", timestamp ) AS date
        FROM
          `bigquery-public-data.hacker_news.full`
        WHERE
          type = 'story'
          AND FORMAT_TIMESTAMP("%Y%m%d", timestamp ) = "{{ yesterday_ds_nodash }}"
        LIMIT
          1
        ''',
        use_legacy_sql=False,
        bigquery_conn_id=BQ_CONN_ID,
        dag=dag
    )

# Task 3: create a github daily metrics partition table
t3 = BigQueryOperator(
        task_id='bq_write_to_github_daily_metrics',
        sql='''
        #standardSQL
        SELECT
          date,
          repo,
          SUM(IF(type='WatchEvent', 1, NULL)) AS stars,
          SUM(IF(type='ForkEvent',  1, NULL)) AS forks
        FROM (
          SELECT
            FORMAT_TIMESTAMP("%Y%m%d", created_at) AS date,
            actor.id as actor_id,
            repo.name as repo,
            type
          FROM
            `githubarchive.day.{{ yesterday_ds_nodash }}`
          WHERE type IN ('WatchEvent','ForkEvent')
        )
        GROUP BY
          date,
          repo
        ''',
        destination_dataset_table='{0}.{1}.github_daily_metrics${2}'.format(
            BQ_PROJECT, BQ_DATASET, '{{ yesterday_ds_nodash }}'
        ),
        write_disposition='WRITE_TRUNCATE',
        allow_large_results=True,
        use_legacy_sql=False,
        bigquery_conn_id=BQ_CONN_ID,
        dag=dag
    )

# Task 4: aggregate past github events to daily partition table
t4 = BigQueryOperator(
        task_id='bq_write_to_github_agg',
        sql='''
        #standardSQL
        SELECT
          "{2}" as date,
          repo,
          SUM(stars) as stars_last_28_days,
          SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{4}")
            AND TIMESTAMP("{3}") ,
            stars, null)) as stars_last_7_days,
          SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{3}")
            AND TIMESTAMP("{3}") ,
            stars, null)) as stars_last_1_day,
          SUM(forks) as forks_last_28_days,
          SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{4}")
            AND TIMESTAMP("{3}") ,
            forks, null)) as forks_last_7_days,
          SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{3}")
            AND TIMESTAMP("{3}") ,
            forks, null)) as forks_last_1_day
        FROM
          `{0}.{1}.github_daily_metrics`
        WHERE _PARTITIONTIME BETWEEN TIMESTAMP("{5}")
        AND TIMESTAMP("{3}")
        GROUP BY
          date,
          repo
        '''.format(BQ_PROJECT, BQ_DATASET,
            "{{ yesterday_ds_nodash }}", "{{ yesterday_ds }}",
            "{{ macros.ds_add(ds, -6) }}",
            "{{ macros.ds_add(ds, -27) }}"
            )
        ,
        destination_dataset_table='{0}.{1}.github_agg${2}'.format(
            BQ_PROJECT, BQ_DATASET, '{{ yesterday_ds_nodash }}'
        ),
        write_disposition='WRITE_TRUNCATE',
        allow_large_results=True,
        use_legacy_sql=False,
        bigquery_conn_id=BQ_CONN_ID,
        dag=dag
    )

# Task 5: aggregate hacker news data to a daily partition table
t5 = BigQueryOperator(
    task_id='bq_write_to_hackernews_agg',
    sql='''
    #standardSQL
    SELECT
      FORMAT_TIMESTAMP("%Y%m%d", timestamp) AS date,
      `by` AS submitter,
      id as story_id,
      REGEXP_EXTRACT(url, "(https?://github.com/[^/]*/[^/#?]*)") as url,
      SUM(score) as score
    FROM
      `bigquery-public-data.hacker_news.full`
    WHERE
      type = 'story'
      AND timestamp>'{{ yesterday_ds }}'
      AND timestamp<'{{ ds }}'
      AND url LIKE '%https://github.com%'
      AND url NOT LIKE '%github.com/blog/%'
    GROUP BY
      date,
      submitter,
      story_id,
      url
    ''',
    destination_dataset_table='{0}.{1}.hackernews_agg${2}'.format(
        BQ_PROJECT, BQ_DATASET, '{{ yesterday_ds_nodash }}'
    ),
    write_disposition='WRITE_TRUNCATE',
    allow_large_results=True,
    use_legacy_sql=False,
    bigquery_conn_id=BQ_CONN_ID,
    dag=dag
    )

# Task 6: join the aggregate tables
t6 = BigQueryOperator(
    task_id='bq_write_to_hackernews_github_agg',
    sql='''
    #standardSQL
    SELECT
    a.date as date,
    a.url as github_url,
    b.repo as github_repo,
    a.score as hn_score,
    a.story_id as hn_story_id,
    b.stars_last_28_days as stars_last_28_days,
    b.stars_last_7_days as stars_last_7_days,
    b.stars_last_1_day as stars_last_1_day,
    b.forks_last_28_days as forks_last_28_days,
    b.forks_last_7_days as forks_last_7_days,
    b.forks_last_1_day as forks_last_1_day
    FROM
    (SELECT
      *
    FROM
      `{0}.{1}.hackernews_agg`
      WHERE _PARTITIONTIME BETWEEN TIMESTAMP("{2}") AND TIMESTAMP("{2}")
      )as a
    LEFT JOIN
      (
      SELECT
      repo,
      CONCAT('https://github.com/', repo) as url,
      stars_last_28_days,
      stars_last_7_days,
      stars_last_1_day,
      forks_last_28_days,
      forks_last_7_days,
      forks_last_1_day
      FROM
      `{0}.{1}.github_agg`
      WHERE _PARTITIONTIME BETWEEN TIMESTAMP("{2}") AND TIMESTAMP("{2}")
      ) as b
    ON a.url = b.url
    '''.format(
            BQ_PROJECT, BQ_DATASET, "{{ yesterday_ds }}"
        ),
    destination_dataset_table='{0}.{1}.hackernews_github_agg${2}'.format(
        BQ_PROJECT, BQ_DATASET, '{{ yesterday_ds_nodash }}'
    ),
    write_disposition='WRITE_TRUNCATE',
    allow_large_results=True,
    use_legacy_sql=False,
    bigquery_conn_id=BQ_CONN_ID,
    dag=dag
    )

# Task 7: Check if partition data is written successfully
t7 = BigQueryCheckOperator(
    task_id='bq_check_hackernews_github_agg',
    sql='''
    #standardSQL
    SELECT
        COUNT(*) AS rows_in_partition
    FROM `{0}.{1}.hackernews_github_agg`
    WHERE _PARTITIONDATE = "{2}"
    '''.format(BQ_PROJECT, BQ_DATASET, '{{ yesterday_ds }}'
        ),
    use_legacy_sql=False,
    bigquery_conn_id=BQ_CONN_ID,
    dag=dag)

# Setting up Dependencies
t3.set_upstream(t1)
t4.set_upstream(t3)
t5.set_upstream(t2)
t6.set_upstream(t4)
t6.set_upstream(t5)
t7.set_upstream(t6)