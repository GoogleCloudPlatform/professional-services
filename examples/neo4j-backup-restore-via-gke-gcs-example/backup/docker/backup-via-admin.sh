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
# Run backup via neo4j-admin
# Globals:
#   BACKUP_SET
#   REMOTE_BACKUPSET
#   NEO4J_ADMIN_SERVER_1
#   NEO4J_ADMIN_SERVER_2
#   NEO4J_ADMIN_SERVER_3
# Arguments:
#   None
#######################################

# Load the environment variables
. ..backup.env

# Validation of inputs upfront
if [[ -z "${REMOTE_BACKUPSET}" ]]; then
    echo "You must specify a REMOTE_BACKUPSET such as gs://my-backups/my-backup.tar.gz"
    exit 1
fi

echo "=============== Neo4j Backup ==============================="
echo "Beginning backup from Managed Graphdb Neo4j Staging to /backups/${BACKUP_SET}"
echo "To google storage bucket ${REMOTE_BACKUPSET}"
echo "============================================================"

echo "Creating Directory for current backup"
mkdir /backups/"${BACKUP_SET}"

neo4j-admin database backup \
    --compress=true \
    --from="${NEO4J_ADMIN_SERVER_1}","${NEO4J_ADMIN_SERVER_2}","${NEO4J_ADMIN_SERVER_3}" \
    --to-path=/backups/"${BACKUP_SET}" \
    --verbose
#   <DATABASE_NAME>/If not set it will default to neo4j    

echo "Access the directory"
chmod +x "/backups/${BACKUP_SET}"

echo "Backup size:"
du -hs "/backups/${BACKUP_SET}"

echo "Tarring -> /backups.tar"
tar -cvf "/backups/${BACKUP_SET}.tar" "/backups/${BACKUP_SET}" --remove-files

echo "Zipping -> /backups.tar.gz"
gzip -9 "/backups/${BACKUP_SET}.tar"

echo "Zipped backup size:"
du -hs "/backups/${BACKUP_SET}.tar.gz"

echo "Pushing /backups/${BACKUP_SET}.tar.gz -> ${REMOTE_BACKUPSET}"
gcloud storage cp backups/"${BACKUP_SET}".tar.gz "${REMOTE_BACKUPSET}"

exit $?