#!/bin/bash

# Copyright 2023 Google Inc. All Rights Reserved.
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

#######################################
# Download latest backup via sidecar container
# Globals:
#   BACKUP_NAME
# Arguments:
#   None
#######################################

export BACKUP_NAME=graph.db-backup

echo "Fetch the latest copy of backup"
response=$(gcloud storage ls --long gs://"<GCS_BUCKET>"|sort -k 2|tail -2|head -1 || true)
latest_backup=$(${response[2]})

echo "Make directory for Backups"
mkdir /data/backups && cd data/backups || return

echo "Latest Backup name"
echo "${latest_backup}"

echo "Download latest copy of backup"
gcloud storage cp "${latest_backup}" .

echo "Unzip Backup file"
backup_file=$(ls)
tar --force-local --overwrite -zxvf "${backup_file}"
chown -R 7474 backups

echo "Leave the gcloud container"
exit