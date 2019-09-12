#!/usr/bin/bash

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script checks the format of various files in the tools/ subfolders
# based on Google open source style guidelines.
#
# The following languages are currently supported:
# - python (using yapf)

# temporary list of folders to exclude
EXCLUDE_FOLDERS=(
    tools/agile-machine-learning-api
    tools/apachebeam-throttling
    tools/asset-inventory
    tools/bigquery-query-plan-exporter
    tools/bigquery-zos-mainframe-connector
    tools/bqpipeline
    tools/bq-visualizer
    tools/cloudconnect
    tools/cloudera-parcel-gcsconnector
    tools/cloud-vision-utils
    tools/dataproc-edge-node
    tools/dns-sync
    tools/gce-google-keys-to-cmek
    tools/gce-quota-sync
    tools/gce-usage-log
    tools/gcp-arch-viz
    tools/gcp-ips
    tools/gcs-bucket-mover
    tools/gke-billing-export
    tools/gsuite-exporter
    tools/hive-bigquery
    tools/kunskap
    tools/labelmaker
    tools/maven-archetype-dataflow
    tools/ml-dataprep
    tools/netblock-monitor
    tools/site-verification-group-sync
    tools/terraform-module-update-scanner
)

for FOLDER in $(find tools -maxdepth 1 -mindepth 1 -type d);
do
    if  [[ ! ${EXCLUDE_FOLDERS[@]} =~ "$FOLDER" ]]
    then
        # Checking python files
        yapf --diff -r --style google $FOLDER/*.py $FOLDER/**/*.py > /dev/null
        if [[ $? -ne 0 ]]
        then
            echo "Some files need to be formatted by yapf in $FOLDER ($YAPF_STATUS):"
            yapf --diff -r --style google $FOLDER/*.py $FOLDER/**/*.py | grep original | awk '{print $2}'
            exit 1
        fi
    fi
done
