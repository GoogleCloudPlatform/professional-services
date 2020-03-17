#!/bin/bash
# Copyright 2019 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euxo pipefail

HADOOP_VERSION=hadoop2-2.1.0

VM_CONNECTORS_HADOOP_DIR=/usr/lib/hadoop/lib
VM_CONNECTORS_DATAPROC_DIR=/usr/local/share/google/dataproc/lib

declare -A MIN_CONNECTOR_VERSIONS
MIN_CONNECTOR_VERSIONS=(
  ["bigquery"]="0.11.0"
  ["gcs"]="1.7.0")

# Starting from these versions connectors name changed:
# "...-<version>-hadoop2.jar" -> "...-hadoop2-<version>.jar"
declare -A NEW_NAME_MIN_CONNECTOR_VERSIONS
NEW_NAME_MIN_CONNECTOR_VERSIONS=(
  ["bigquery"]="0.13.5"
  ["gcs"]="1.9.5")

BIGQUERY_CONNECTOR_VERSION=$(/usr/share/google/get_metadata_value attributes/bigquery-connector-version || true)
GCS_CONNECTOR_VERSION=$(/usr/share/google/get_metadata_value attributes/gcs-connector-version || true)

UPDATED_GCS_CONNECTOR=false

is_worker() {
  local role
  role="$(/usr/share/google/get_metadata_value attributes/dataproc-role || true)"
  if [[ $role != Master ]]; then
    return 0
  fi
  return 1
}

min_version() {
  echo -e "$1\n$2" | sort -r -t'.' -n -k1,1 -k2,2 -k3,3 | tail -n1
}

validate_version() {
  local name=$1    # connector name: "bigquery" or "gcs"
  local version=$2 # connector version
  local min_valid_version=${MIN_CONNECTOR_VERSIONS[$name]}
  if [[ "$(min_version "$min_valid_version" "$version")" != "$min_valid_version" ]]; then
    echo "ERROR: $name-connector version should be greater than or equal to $min_valid_version, but was $version"
    return 1
  fi
}

update_connector() {
  local name=$1    # connector name: "bigquery" or "gcs"
  local version=$2 # connector version
  if [[ $version ]]; then
    if [[ $name == gcs ]]; then
      UPDATED_GCS_CONNECTOR=true
    fi

    # validate new connector version
    validate_version "$name" "$version"

    if [[ -d ${VM_CONNECTORS_DATAPROC_DIR} ]]; then
      local vm_connectors_dir=${VM_CONNECTORS_DATAPROC_DIR}
    else
      local vm_connectors_dir=${VM_CONNECTORS_HADOOP_DIR}
    fi

    # remove old connector
    rm -f "${vm_connectors_dir}/${name}-connector-"*

    # download new connector
    # connector name could be in one of 2 formats:
    # 1) gs://hadoop-lib/${name}/${name}-connector-hadoop2-${version}.jar
    # 2) gs://hadoop-lib/${name}/${name}-connector-${version}-hadoop2.jar
    local new_name_min_version=${NEW_NAME_MIN_CONNECTOR_VERSIONS[$name]}
    if [[ "$(min_version "$new_name_min_version" "$version")" == "$new_name_min_version" ]]; then
      local jar_name="${name}-connector-hadoop2-${version}.jar"
    else
      local jar_name="${name}-connector-${version}-hadoop2.jar"
    fi

    # UPDATED this line to correctly pull the GCS connector 
    gsutil cp "gs://gcs-connector-init_actions/gcs-connector-${HADOOP_VERSION}-shaded.jar" "${vm_connectors_dir}/"

    # Update or create version-less connector link
    ln -s -f "${vm_connectors_dir}/${jar_name}" "${vm_connectors_dir}/${name}-connector.jar"
  fi
}

if [[ -z $BIGQUERY_CONNECTOR_VERSION ]] && [[ -z $GCS_CONNECTOR_VERSION ]]; then
  echo "ERROR: None of connector versions are specified"
  exit 1
fi

# because connectors from 1.7 branch are not compatible with previous connectors
# versions (they have the same class relocation paths) we need to update both
# of them, even if only one connector version is set
if [[ -z $BIGQUERY_CONNECTOR_VERSION ]] && [[ $GCS_CONNECTOR_VERSION == "1.7.0" ]]; then
  BIGQUERY_CONNECTOR_VERSION="0.11.0"
fi
if [[ $BIGQUERY_CONNECTOR_VERSION == "0.11.0" ]] && [[ -z $GCS_CONNECTOR_VERSION ]]; then
  GCS_CONNECTOR_VERSION="1.7.0"
fi

update_connector "bigquery" "$BIGQUERY_CONNECTOR_VERSION"
update_connector "gcs" "$GCS_CONNECTOR_VERSION"

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
