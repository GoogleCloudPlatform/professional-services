#!/bin/bash
# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Installs any of the Cloud Storage, Hadoop BigQuery and/or Spark BigQuery connectors
# onto a Cloud Dataproc cluster.

set -euxo pipefail

# Update $HADOOP_VERSION
HADOOP_VERSION=hadoop2-2.2.0

readonly VM_CONNECTORS_HADOOP_DIR=/usr/lib/hadoop/lib
readonly VM_CONNECTORS_DATAPROC_DIR=/usr/local/share/google/dataproc/lib

declare -A MIN_CONNECTOR_VERSIONS
MIN_CONNECTOR_VERSIONS=(
  ["bigquery"]="0.12.0"
  ["gcs"]="1.8.0"
  ["spark-bigquery"]="0.12.0-beta")

readonly BIGQUERY_CONNECTOR_VERSION=$(/usr/share/google/get_metadata_value attributes/bigquery-connector-version || true)
readonly GCS_CONNECTOR_VERSION=$(/usr/share/google/get_metadata_value attributes/gcs-connector-version || true)
readonly SPARK_BIGQUERY_CONNECTOR_VERSION=$(/usr/share/google/get_metadata_value attributes/spark-bigquery-connector-version || true)

readonly BIGQUERY_CONNECTOR_URL=$(/usr/share/google/get_metadata_value attributes/bigquery-connector-url || true)
readonly GCS_CONNECTOR_URL=$(/usr/share/google/get_metadata_value attributes/gcs-connector-url || true)
readonly SPARK_BIGQUERY_CONNECTOR_URL=$(/usr/share/google/get_metadata_value attributes/spark-bigquery-connector-url || true)

UPDATED_GCS_CONNECTOR=false

is_worker() {
  local role
  role="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"
  if [[ $role != Master ]]; then
    return 0
  fi
  return 1
}

min_version() {
  echo -e "$1"'\n'"$2" | sort -r -t'.' -n -k1,1 -k2,2 -k3,3 | tail -n1
}

get_connector_url() {
  # Connector names have changed as of certain versions.
  #
  # bigquery + gcs connectors:
  #   bigquery-connector version < 0.13.5 / gcs-connector version < 1.9.5:
  #   gs://hadoop-lib/${name}/${name}-connector-${version}-hadoop2.jar
  #
  #   bigquery-connector version >= 0.13.5 / gcs-connector version >= 1.9.5:
  #   gs://hadoop-lib/${name}/${name}-connector-hadoop2-${version}.jar
  #
  # spark-bigquery-connector:
  #   gs://spark-lib/bigquery/${name}-with-dependencies_${scala_version}-${version}.jar
  local -r name=$1
  local -r version=$2

  if [[ $name == spark-bigquery ]]; then
    # DATAPROC_VERSION is an environment variable set on the cluster.
    # We will use this to determine the appropriate connector to use
    # based on the scala version.
    if [[ $(min_version "$DATAPROC_VERSION" 1.5) != 1.5 ]]; then
      local -r scala_version=2.11
    else
      local -r scala_version=2.12
    fi

    local -r jar_name="spark-bigquery-with-dependencies_${scala_version}-${version}.jar"

    echo "gs://spark-lib/bigquery/${jar_name}"
    return
  fi

  if [[ $name == gcs && $(min_version "$version" 1.9.5) != 1.9.5 ]] ||
    [[ $name == bigquery && $(min_version "$version" 0.13.5) != 0.13.5 ]]; then
    local -r jar_name="${name}-connector-${version}-hadoop2.jar"
  else
    local -r jar_name="${name}-connector-hadoop2-${version}.jar"
  fi

  echo "gs://hadoop-lib/${name}/${jar_name}"
}

validate_version() {
  local name=$1    # connector name: "bigquery", "gcs" or "spark-bigquery"
  local version=$2 # connector version
  local min_valid_version=${MIN_CONNECTOR_VERSIONS[$name]}
  if [[ "$(min_version "$min_valid_version" "$version")" != "$min_valid_version" ]]; then
    echo "ERROR: ${name}-connector version should be greater than or equal to $min_valid_version, but was $version"
    return 1
  fi
}

update_connector_url() {
  local -r name=$1
  local -r url=$2

  if [[ $name == gcs ]]; then
    UPDATED_GCS_CONNECTOR=true
  fi

  if [[ -d ${VM_CONNECTORS_DATAPROC_DIR} ]]; then
    local vm_connectors_dir=${VM_CONNECTORS_DATAPROC_DIR}
  else
    local vm_connectors_dir=${VM_CONNECTORS_HADOOP_DIR}
  fi

  # Remove old connector if exists
  if [[ $name == spark-bigquery ]]; then
    find "${vm_connectors_dir}/" -name "${name}*.jar" -delete
  else
    find "${vm_connectors_dir}/" -name "${name}-connector-*.jar" -delete
  fi

  # UPDATED this line to pull correct GCS connector
  gsutil cp "gs://gcs-connector-init_actions/gcs-connector-${HADOOP_VERSION}-shaded.jar" "${vm_connectors_dir}/"

  local -r jar_name=${url##*/}

  # Update or create version-less connector link
  ln -s -f "${vm_connectors_dir}/${jar_name}" "${vm_connectors_dir}/${name}-connector.jar"
}

update_connector_version() {
  local -r name=$1    # connector name: "bigquery", "gcs" or "spark-bigquery"
  local -r version=$2 # connector version

  # validate new connector version
  validate_version "$name" "$version"

  local -r connector_url=$(get_connector_url "$name" "$version")

  update_connector_url "$name" "$connector_url"
}

update_connector() {
  local -r name=$1
  local -r version=$2
  local -r url=$3

  if [[ -n $version && -n $url ]]; then
    echo "ERROR: Both, connector version and URL are specified for the same connector"
    exit 1
  fi

  if [[ -n $version ]]; then
    update_connector_version "$name" "$version"
  fi

  if [[ -n $url ]]; then
    update_connector_url "$name" "$url"
  fi
}

if [[ -z $BIGQUERY_CONNECTOR_VERSION && -z $BIGQUERY_CONNECTOR_URL ]] &&
  [[ -z $GCS_CONNECTOR_VERSION && -z $GCS_CONNECTOR_URL ]] &&
  [[ -z $SPARK_BIGQUERY_CONNECTOR_VERSION && -z $SPARK_BIGQUERY_CONNECTOR_URL ]]; then
  echo "ERROR: None of connector versions or URLs are specified"
  exit 1
fi

update_connector "bigquery" "$BIGQUERY_CONNECTOR_VERSION" "$BIGQUERY_CONNECTOR_URL"
update_connector "gcs" "$GCS_CONNECTOR_VERSION" "$GCS_CONNECTOR_URL"
update_connector "spark-bigquery" "$SPARK_BIGQUERY_CONNECTOR_VERSION" "$SPARK_BIGQUERY_CONNECTOR_URL"

if [[ $UPDATED_GCS_CONNECTOR != true ]]; then
  echo "GCS connector wasn't updated - no need to restart any services"
  exit 0
fi

# Restart YARN NodeManager service on worker nodes so they can pick up updated GCS connector
if is_worker; then
  systemctl kill -s KILL hadoop-yarn-nodemanager
fi

# Restarts Dataproc Agent after successful initialization
# WARNING: this function relies on undocumented and not officially supported Dataproc Agent
# "sentinel" files to determine successful Agent initialization and not guaranteed
# to work in the future. Use at your own risk!
restart_dataproc_agent() {
  # Because Dataproc Agent should be restarted after initialization, we need to wait until
  # it will create a sentinel file that signals initialization competition (success or failure)
  while [[ ! -f /var/lib/google/dataproc/has_run_before ]]; do
    sleep 1
  done
  # If Dataproc Agent didn't create a sentinel file that signals initialization
  # failure then it means that initialization succeded and it should be restarted
  if [[ ! -f /var/lib/google/dataproc/has_failed_before ]]; then
    systemctl kill -s KILL google-dataproc-agent
  fi
}
export -f restart_dataproc_agent

# Schedule asynchronous Dataproc Agent restart so it will use updated connectors.
# It could not be restarted sycnhronously because Dataproc Agent should be restarted
# after its initialization, including init actions execution, has been completed.
bash -c restart_dataproc_agent &
disown