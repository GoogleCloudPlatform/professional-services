#!/usr/bin/env bash

# Copyright 2022 Google LLC
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

function try_and_delete {
    gcloud functions describe "$1" &> /dev/null;
    if [ $? -eq 1 ]; then
        echo "Function $1 doesn't exist" >&2
    else
        gcloud functions delete "$1"
    fi
}

try_and_delete fixity-"${BUCKET_NAME}"-deletes

try_and_delete fixity-"${BUCKET_NAME}"-updates

try_and_delete fixity-"${BUCKET_NAME}"-manual 
