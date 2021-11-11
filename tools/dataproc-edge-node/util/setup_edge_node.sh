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

# Run as root on Dataproc master node after dataproc-startup-script

function err() {
  TS=$(date +'%Y-%m-%dT%H:%M:%S%z')
  echo "[${TS}]: ${@}" >&2
  return 1
}

function info() {
  TS=$(date +'%Y-%m-%dT%H:%M:%S%z')
  echo "[${TS}]: ${@}"
}

function wait_for_startup() {
  for ((i = 0; i < 60; i++)); do
  	grep -E -q 'All done$' /var/log/dataproc-startup-script.log 2>/dev/null
  	e=$?
    [ $e -eq 0 ] && return 0
    sleep 30
    info "Waiting for dataproc-startup-script..."
  done
  err "Timed out waiting for dataproc-startup-script"
}

wait_for_startup || exit 1

cat <<EOF>> /etc/inputrc
"\e[A": history-search-backward
"\e[B": history-search-forward
set show-all-if-ambiguous on
set completion-ignore-case on
EOF

set -e
set -x

cd /usr/share/google
BUCKET=$(/usr/share/google/get_metadata_value attributes/config-bucket)
FILES="config-files configure.sh create-templates.sh disable-services.sh"
for f in $FILES; do
  gsutil cp "gs://${BUCKET}/${f}" .
done
chmod +x configure.sh create-templates.sh disable-services.sh

# Install configuration startup service
SERVICE_URI="gs://${BUCKET}/google-edgenode-configure.service"
gsutil cp "${SERVICE_URI}" /etc/systemd/system/
systemctl daemon-reload
systemctl enable google-edgenode-configure

# Disable services that are unnecessary on edge nodes
/usr/share/google/disable-services.sh

# Create configuration templates
/usr/share/google/create-templates.sh

# Shutdown instance for image capture
shutdown -h now
