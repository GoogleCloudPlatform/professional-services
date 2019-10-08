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
# Author: legranda@google.com
# Version 2.0 (20190928)

#!/bin/bash
echo "Usage:"
echo "List quotas for all projects: ./gce-quota-export.sh"
# We cannot use folder name as an input as folder names are not unique
echo "List quotas for all projects in folder: ./gce-quota-export [folder-id]"
echo ""

# -- Static variables to set --
folder="exports"
# This dataset should already exist
bigquery_dataset="DATASET_NAME"
# Table will be created if it doesn't exist, else data will be appended to it.
bigquery_table="TABLE_NAME"
# -----------------------------
timestamp="$(date "+%Y%m%d%H%M")"

mkdir -p $folder

if test $# -eq 0; then
projectlist="$(gcloud projects list  --format="value(projectId)")"
else
foldername="$(gcloud resource-manager folders describe $1 \
        --format="value(displayName)")"
echo "Listing quotas for folder '$foldername' ($1)"
projectlist="$(gcloud projects list --filter=" parent.id: '$1' "  \
        --format="value(projectId)")"
fi
for project in $projectlist
do
        echo "## Project: $project"
        filename=$folder/$project-$timestamp
        gcloud compute project-info describe --project $project         \
        --flatten="quotas[]"                                            \
        --format="csv(name, quotas.metric, quotas.usage, quotas.limit)" \
        > $filename

        # Adding timestamp to every line
        sed -i "1s/$/,timestamp/;/./!b;1!s/$/,$timestamp/" $filename
        echo "Quotas written to file $filename"
        bq load --source_format=CSV --autodetect \
        $bigquery_dataset.$bigquery_table $filename
done