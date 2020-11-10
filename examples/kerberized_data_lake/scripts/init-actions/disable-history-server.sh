#!/usr/bin/env bash

# Copyright 2020 Google Inc.
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
#
#
# This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

set -euxo pipefail
role="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"
SPARK_HISTORY_SERVER_PATH=/etc/init.d/spark-history-server
MR_HISTORY_SERVER_PATH=/etc/init.d/hadoop-mapreduce-historyserver

if [[ "${role}" == "Master" && -f ${SPARK_HISTORY_SERVER_PATH} ]]; then

  systemctl stop spark-history-server
fi

if [[ "${role}" == "Master" && -f ${MR_HISTORY_SERVER_PATH} ]]; then

  systemctl stop hadoop-mapreduce-historyserver
fi
