#!/bin/bash

# Copyright 2021 Google LLC
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

root_dir="$(dirname "$(dirname "$(realpath "$0")")" )"

echo "root_dir=$root_dir"

sed -i "/\"cdf_instance_name\":/s/\(^[^:]*[:][ ]\).*$/\1\"$DATA_FUSION_INSTANCE_NAME\",/" "$root_dir"/composer/dag-parameters/env_param.json
sed -i "/\"gcp_project_id\":/s/\(^[^:]*[:][ ]\).*$/\1\"$PROJECT_ID\",/" "$root_dir"/composer/dag-parameters/env_param.json
sed -i "/\"location\":/s/\(^[^:]*[:][ ]\).*$/\1\"$LOCATION\",/" "$root_dir"/composer/dag-parameters/env_param.json
sed -i "/\"audit_dataset\":/s/\(^[^:]*[:][ ]\).*$/\1\"$AUDIT_DATASET\",/" "$root_dir"/composer/dag-parameters/env_param.json
sed -i "/\"composer_bucket\":/s/\(^[^:]*[:][ ]\).*$/\1\"$COMPOSER_BUCKET\",/" "$root_dir"/composer/dag-parameters/env_param.json
sed -i "/\"data_bucket\":/s/\(^[^:]*[:][ ]\).*$/\1\"$DATA_BUCKET\",/" "$root_dir"/composer/dag-parameters/env_param.json
sed -i "/\"archival_bucket\":/s/\(^[^:]*[:][ ]\).*$/\1\"$ARCHIVAL_BUCKET\",/" "$root_dir"/composer/dag-parameters/env_param.json
COMPOSER_DAG_FOLDER=$(gcloud composer environments describe "$COMPOSER_INSTANCE_NAME" --location "$LOCATION" | grep dagGcsPrefix)
COMPOSER_DAG_BUCKET=$(echo "$COMPOSER_DAG_FOLDER" | grep dagGcsPrefix | cut -d / -f 3)
sed -i "/\"composer_bucket\":/s/\(^[^:]*[:][ ]\).*$/\1\"$COMPOSER_DAG_BUCKET\",/" "$root_dir"/composer/dag-parameters/env_param.json