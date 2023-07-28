# from airflow import DAG
# from airflow.contrib.operators.bigquery_operator import BigQueryCreateEmptyTableOperator
# from datetime import datetime
# from airflow.contrib.operators.bigquery_operator import BigQueryOperator
#
# default_args = {
#     'start_date': datetime(2023, 5, 20),
# }
#
# with DAG('my_dag', default_args=default_args, schedule_interval=None) as dag:
#     create_table = BigQueryCreateEmptyTableOperator(
#         task_id='create_table',
#         project_id='your_project_id',
#         dataset_id='your_dataset_id',
#         table_id='your_table_id',
#         schema_fields=[
#             {'name': 'column1', 'type': 'STRING', 'mode': 'NULLABLE'},
#             {'name': 'column2', 'type': 'INTEGER', 'mode': 'NULLABLE'},
#         ],
#         gcp_conn_id='google_cloud_default'
#     )
#
#     ## Task 4: aggregate past github events to daily partition table
#     t4 = BigQueryOperator(
#         task_id='bq_write_to_github_agg',
#         sql='''
#             #standardSQL
#             SELECT
#               "{2}" as date,
#               repo,
#               SUM(stars) as stars_last_28_days,
#               SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{4}")
#                 AND TIMESTAMP("{3}") ,
#                 stars, null)) as stars_last_7_days,
#               SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{3}")
#                 AND TIMESTAMP("{3}") ,
#                 stars, null)) as stars_last_1_day,
#               SUM(forks) as forks_last_28_days,
#               SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{4}")
#                 AND TIMESTAMP("{3}") ,
#                 forks, null)) as forks_last_7_days,
#               SUM(IF(_PARTITIONTIME BETWEEN TIMESTAMP("{3}")
#                 AND TIMESTAMP("{3}") ,
#                 forks, null)) as forks_last_1_day
#             FROM
#               `{0}.{1}.github_daily_metrics`
#             WHERE _PARTITIONTIME BETWEEN TIMESTAMP("{5}")
#             AND TIMESTAMP("{3}")
#             GROUP BY
#               date,
#               repo
#             '''.format(BQ_PROJECT, BQ_DATASET,
#                        "{{ yesterday_ds_nodash }}", "{{ yesterday_ds }}",
#                        "{{ macros.ds_add(ds, -6) }}",
#                        "{{ macros.ds_add(ds, -27) }}"
#                        )
#         ,
#         destination_dataset_table='{0}.{1}.github_agg${2}'.format(
#             BQ_PROJECT, BQ_DATASET, '{{ yesterday_ds_nodash }}'
#         ),
#         write_disposition='WRITE_TRUNCATE',
#         allow_large_results=True,
#         use_legacy_sql=False,
#         bigquery_conn_id=BQ_CONN_ID,
#         dag=dag
#     )
#     create_table
