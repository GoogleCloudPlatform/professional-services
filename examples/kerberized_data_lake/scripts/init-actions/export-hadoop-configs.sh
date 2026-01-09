#!/usr/bin/env bash
# Copyright 2020 Google Inc.
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
#
#
# This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

# name: export-hadoop-configs.sh
# description: store all hadoop, spark, presto config dirs to GCS staging bucket
# in a cluster named directory (overwritten by latest cluster of that name)
# and a cluster uuid named directory for historical / debugging purposes.
# This can be useful for loading these files as ConfigMaps in the Airflow
# deployment.
#

# enable debug through -x and omit sensitive areas by turning off (set +x)
set -xeuo pipefail

HADOOP_CONFIG_DIR="/etc/hadoop/conf"
SPARK_CONFIG_DIR="/etc/spark/conf"
HIVE_CONFIG_DIR="/etc/hive/conf"
HCATALOG_CONFIG_DIR="/etc/hive-hcatalog/conf"
PRESTO_CONFIG_DIR="/etc/presto/conf"
KERBEROS_CONFIG="/etc/krb5.conf"

ROLE="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"
CLUSTER_NAME="$(/usr/share/google/get_metadata_value attributes/dataproc-cluster-name)"
CLUSTER_UUID="$(/usr/share/google/get_metadata_value attributes/dataproc-cluster-uuid)"
STAGING_BUCKET="$(/usr/share/google/get_metadata_value attributes/dataproc-bucket)"

# log wrapper
function log_and_fail() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR $*" >&2
  return 1
}

# gcs copy
function g_cp_r() {
  CMD="gcloud storage cp --recursive ${1} ${2}"
  ${CMD} || log_and_fail "Unable to execute ${CMD}"
}


function export_all_configs(){
  local bucket="$1"
  local prefix="$2"
  g_cp_r $HADOOP_CONFIG_DIR "gs://$bucket/configs/$prefix/hadoop/"
  g_cp_r $SPARK_CONFIG_DIR "gs://$bucket/configs/$prefix/spark/"
  g_cp_r $HIVE_CONFIG_DIR "gs://$bucket/configs/$prefix/hive/"
  g_cp_r $HCATALOG_CONFIG_DIR "gs://$bucket/configs/$prefix/hive-hcatalog/"
  g_cp_r $KERBEROS_CONFIG "gs://$bucket/configs/$prefix/krb5.conf"

  # Export presto config if present
  if [ -d $PRESTO_CONFIG_DIR ]; then
    g_cp_r $PRESTO_CONFIG_DIR "gs://$bucket/$prefix/presto/"
  else
    echo "no presto config dir found, skipping."
  fi
}

if [[ "${ROLE}" == "Master"  ]]; then
  export_all_configs "$STAGING_BUCKET" "$CLUSTER_NAME"
  export_all_configs "$STAGING_BUCKET" "$CLUSTER_NAME/$CLUSTER_UUID"
fi
