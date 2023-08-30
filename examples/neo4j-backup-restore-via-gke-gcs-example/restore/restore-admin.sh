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
# Execute Restore admin command
# Globals:
#   None
# Arguments:
#   None
#######################################

echo "Set backup as the working directory"
cd data/backups/backups||return

echo "Get the latest backup name"
backup_dir=$(ls)
cd "${backup_dir}" || true
backup_artifact=$(ls)

echo "Run Restore using the backup Artifact"
neo4j-admin database restore --from-path="${backup_artifact}" --expand-commands "<DATABASE_NAME>"

exit