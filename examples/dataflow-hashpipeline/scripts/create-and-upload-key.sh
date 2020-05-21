#!/bin/bash

# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


PROJECT=$1

# Generate a 64 byte key, which is the max possible for Blake2b
openssl rand -base64 64 > scripts/key.b64

gcloud secrets versions add "${SECRET_NAME}" --data-file scripts/key.b64 --project "${PROJECT}"
