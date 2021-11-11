#!/usr/bin/env bash
# Copyright 2020 Google LLC
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

set -e

# Run tests on CI. Assumes working directory is hive-bigquery.
./prerequisites/prerequisites.sh

virtualenv env

# Shellcheck cannot lint env/bin/activate because it's created by virtualenv.
# shellcheck disable=SC1091
source env/bin/activate

pip3 install -e .
pip3 install pytest
pytest .
