#!/bin/bash
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# run as root

info() {
  TS=$(date +'%Y-%m-%dT%H:%M:%S%z')
  echo "[${TS}]: ${@}" | tee -a /var/log/configure.log
}

if [ $# -gt 0 ]; then
  TARGET_CLUSTER=$1
else
  TARGET_CLUSTER=$(/usr/share/google/get_metadata_value attributes/target-dataproc-cluster)
fi

if [ $# -gt 1 ]; then
  CONFIG_DIR=$2
  [ -d "$CONFIG_DIR" ] || mkdir -p "$CONFIG_DIR"
fi

[ ! -z "$TARGET_CLUSTER" ] || exit 1

TARGET_MASTER="${TARGET_CLUSTER}-m"

while read f; do
  TEMPLATE="${f}.template"
  if [ -f "${TEMPLATE}" ]; then
    if [ ! -z "${CONFIG_DIR}" ]; then
      TPL=$(basename "${f}")
      TARGET="${CONFIG_DIR}/${TPL}"
    else
      TARGET="$f"
    fi
    info "Configuring $TARGET_MASTER in $TARGET from $TEMPLATE"
    sed -e "s|{{ DATAPROC_MASTER }}|${TARGET_MASTER}|g" "${TEMPLATE}" > "${TARGET}"
  fi
done < /usr/share/google/config-files
