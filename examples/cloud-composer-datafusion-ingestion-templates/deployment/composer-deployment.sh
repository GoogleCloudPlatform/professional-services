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

echo "The current working directory: $PWD"
for dagdependency in composer/dag-dependencies/*.py
do
gcloud composer environments storage dags import \
--environment "$COMPOSER_INSTANCE_NAME" \
--location "$LOCATION" \
--source "$dagdependency" \
--destination dependencies
done

for dag in composer/dags/*.py
do
gcloud composer environments storage dags import \
--environment "$COMPOSER_INSTANCE_NAME" \
--location "$LOCATION" \
--source "$dag"
done

for param in $(find composer/dag-parameters -print | grep -i json)
do
dest="$(dirname "$param")"
dest="${dest//composer\/dag-parameters/params}"
gcloud composer environments storage dags import \
--environment "$COMPOSER_INSTANCE_NAME" \
--location "$LOCATION" \
--source "$param" \
--destination "$dest"
done

for hook in $(find composer/plugins/hooks -print | grep -i .py)
do
dest="$(dirname "$hook")"
dest="${dest//composer\/plugins\/hooks/hooks}"
gcloud composer environments storage plugins import \
--environment "$COMPOSER_INSTANCE_NAME" \
--location "$LOCATION" \
--source "$hook" \
--destination "$dest"
done

for operator in $(find composer/plugins/operators -print | grep -i .py)
do
dest="$(dirname "$operator")"
dest="${dest//composer\/plugins\/operators/operators}"
gcloud composer environments storage plugins import \
--environment "$COMPOSER_INSTANCE_NAME" \
--location "$LOCATION" \
--source "$operator" \
--destination "$dest"
done