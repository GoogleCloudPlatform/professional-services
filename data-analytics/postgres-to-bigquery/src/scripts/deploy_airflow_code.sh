#!/usr/bin/env bash
rm -rf $AIRFLOW_HOME/dags/
mkdir -p $AIRFLOW_HOME/dags/
gsutil -m cp gs://datawarehouse-pipeline/LoadToBigQuery/*.* $AIRFLOW_HOME/dags/
