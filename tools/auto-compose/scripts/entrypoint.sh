#!/usr/bin/env bash

gcloud config set project $PROJECT_ID
export DAG_LOCATION=`gcloud composer environments describe $COMPOSER --location=$LOCATION --format="json" | python3 -c "import sys, json; print(json.load(sys.stdin)['config']['dagGcsPrefix'])"`
export AIRFLOW_URL=`gcloud composer environments describe $COMPOSER --location=$LOCATION --format="json" | python3 -c "import sys, json; print(json.load(sys.stdin)['config']['airflowUri'])"`

PY_FILE=$(basename "$YAML" .yml).py

echo $PY_FILE

cat > /root/$PY_FILE << EOL
from airflow import DAG
import dagfactory

config_file = "/home/airflow/gcs/dags/$FILENAME"
example_dag_factory = dagfactory.DagFactory(config_file)

example_dag_factory.generate_dags(globals())

EOL

echo -e "\e[32mCopying dags to cloud composer"
gsutil -m cp -r ../dagfactory $DAG_LOCATION
gsutil cp /root/$PY_FILE $DAG_LOCATION
gsutil cp /root/$FILENAME $DAG_LOCATION

echo -e "\033[0;31mPlease open " $AIRFLOW_URL " to see the dags"

