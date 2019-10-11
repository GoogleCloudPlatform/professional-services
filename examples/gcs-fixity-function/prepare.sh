#!/usr/bin/env bash

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

PROJECT_ID=$(gcloud config get-value project)
bq show fixity_data > /dev/null

# Create datasets
if [ $? -eq 0 ]
then
  echo "fixity_data dataset already created" >&2
else
  bq --location=US mk -d \
  --description "Fixity metadata" \
  fixity_data
fi
bq show fixity > /dev/null
if [ $? -eq 0 ]
then
  echo "fixity dataset already created" >&2
else
  bq --location=US mk -d \
  --description "Fixity metadata views" \
  fixity
fi

# Create table for records
bq show fixity_data.records > /dev/null
if [ $? -eq 0 ]
then
  echo "fixity table already created" >&2
else
  bq mk --table \
  --description "Table for fixity records" \
  fixity_data.records \
  ./scripts/schema.json
fi

# Create views
bq show fixity.current_manifest > /dev/null
if [ $? -eq 0 ]
then
  echo "current manifest view already created" >&2
else
  MANIFEST_VIEW=$(sed "s/PROJECT_ID/$PROJECT_ID/g" ./scripts/current-manifest.sql)
  bq mk \
  --use_legacy_sql=false \
  --description "View showing current manifest of files" \
  --view "$MANIFEST_VIEW" \
  fixity.current_manifest
fi
bq show fixity.file_operations > /dev/null
if [ $? -eq 0 ]
then
  echo "file operations view already created" >&2
else
  OPERATIONS_VIEW=$(sed "s/PROJECT_ID/$PROJECT_ID/g" ./scripts/file-operations.sql)
  bq mk \
  --use_legacy_sql=false \
  --description "View showing list of all file operations" \
  --view "$OPERATIONS_VIEW" \
  fixity.file_operations
fi