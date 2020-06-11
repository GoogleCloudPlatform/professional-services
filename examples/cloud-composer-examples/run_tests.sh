#!/bin/bash

# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

PATH=$PATH:/usr/local/airflow/google-cloud-sdk/bin
GCLOUD="gcloud -q"
export AIRFLOW_HOME=/tmp/airflow

function setup_local_airflow() {
  mkdir -p $AIRFLOW_HOME
  echo "setting up local aiflow"
  airflow version
  echo "initialize airflow database."
  airflow initdb
  echo "setting up plugins."
  rsync -r plugins $AIRFLOW_HOME

  echo "setting up sql."
  SQL_PREFIX=$AIRFLOW_HOME/dags/sql
  mkdir -p $SQL_PREFIX
  rsync -r -d ../bigquery/sql $SQL_PREFIX

  echo "generating fernet key."
  FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; \
  print(Fernet.generate_key().decode('utf-8'))")
  export FERNET_KEY

  get_conns

  echo "uploading connections."
  for conn_id in $AIRFLOW_CONN_LIST; do
    set_local_conn "$conn_id"
  done

  # Import Airflow Variables to local Airflow.
  echo "import airflow vaiables."
  airflow variables --import config/AirflowVariables.json
  echo "imported airflow vaiables:"
  airflow variables --export /tmp/AirflowVariables.json.exported
  cat /tmp/AirflowVariables.json.exported


  echo "setting up DAGs."
  rsync -r dags $AIRFLOW_HOME
}

# Get current Cloud Composer custom connections.
function get_conns() {
  AIRFLOW_CONN_LIST=$($GCLOUD composer environments run "$COMPOSER_ENV_NAME" \
    connections -- --list 2>&1 | grep "?\s" | awk '{ FS = "?"}; {print $2}' | \
    tr -d ' ' | sed -e "s/'//g" | grep -v '_default$' | \
    grep -v 'local_mysql' | tail -n +3 | grep -v "\.\.\.")
  export AIRFLOW_CONN_LIST

}

# Upload custom connetions to local Airflow.
# $1 conn_id
function set_local_conn() {
  echo "uploading connection: $conn_id."
  #TODO remove assumption that custom connections are http.
  airflow connections --add --conn_id "$1" --conn_type http || \
  echo "Upload $1 to local Airflow failed"
}

# Run DAG validation tests.
function run_tests() {
  python3 -m unittest discover tests
}

function clean_up() {
  echo "cleaning up AIRFLOW_HOME"
  rm -rf $AIRFLOW_HOME
  unset AIRFLOW_HOME
  rm -rf airflow-env
}

# Might be necessary if we chose another image.
function install_venv() {
  python3 -m virtualenv airflow-env
  chmod +x airflow-env/bin/activate
  source airflow-env/bin/activate
  pip install -r requirements.txt
}

install_venv
setup_local_airflow
run_tests
TEST_STATUS=$?
clean_up
exit $TEST_STATUS
