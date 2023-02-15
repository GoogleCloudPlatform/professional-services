# Airflow Metadata Export

This repo contains an example Airflow DAG Factory that exports data from a list of airflow tables into a BigQuery location.

The goal of this example is to provide a common pattern to export data to BigQuery for auditing and reporting purposes.

## DAG Factory Overview

A DAG factory to create DAGs that you can deploy into Airflow to periodically export metadata to a specified BigQuery location.

Note: DAG start_times are staggered to reduce composer environment load. By default it will execute all table export between 00:00 and 00:30 UTC.

At a high-level the factory will create Cloud Composer DAGs that perform the following steps for each table:

1. Query the PostgreSQL DB containing the Airflow metadata table.
2. Output the results in CSV format to Google Cloud Storage location.
3. Confirm that Google Cloud Storage location is non-empty.
4. Load CSV files into BigQuery table.
5. Confirm that the BigQuery table is non-empty.
6. Clean up the CSV files in the Google Cloud Storage location.


## Tables Exported

Refer to [the latest version of the metadata db schema.](https://airflow.apache.org/docs/apache-airflow/2.4.0/database-erd-ref.html )

As of Airflow 2.4.0 and the time of creation, the DAG factory will create a DAG for each table in this list:

ab_permission, ab_permission_view, ab_permission_view_role, ab_register_user, ab_role, ab_user, ab_user_role, ab_view_menu, alembic_version, callback_request, connection, dag, dag_code, dag_pickle, dag_run, dag_tag, import_error, job, log, log_template, rendered_task_instance_fields, sensor_instance, serialized_dag, session, sla_miss, slot_pool, task_fail, task_instance, task_map, task_reschedule, trigger, variable, xcom


## Usage

1. Update the global variables. `BQ_PROJECT`, `BQ_DATASET`, `GCS_BUCKET`, `GCS_OBJECT_PATH`

2. `WRITE_DISPOSITON` is set to `WRITE_TRUNCATE` the BigQuery location by default. This means that any data removed from Airflow metadata DB via UI or cleanup processes will also be removed from BigQuery location. If you change to `WRITE_APPEND` you'll need to manage duplicate data in another process.
   
3. Modify the SOURCE_TABLES list to fit your airflow version and your desired tables to export. Currently set to tables for Airflow 2.4.0

4. Put the file in your Google Cloud Storage bucket and allow Cloud Composer to parse the DAGs.