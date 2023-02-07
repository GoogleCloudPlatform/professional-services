#!/bin/bash
# Copyright 2020 Google Inc. All Rights Reserved.
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

# This file installs python packages, install gcsfuse then mount GCS buckets as a file system

set -exo pipefail

# Python Packages to Install 
PACKAGES="pendulum scipy markdown"

function err() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*" >&2
  exit 1
}

function run_with_retry() {
  local -r cmd=("$@")
  for ((i = 0; i < 10; i++)); do
    if "${cmd[@]}"; then
      return 0
    fi
    sleep 5
  done
  err "Failed to run command: ${cmd[*]}"
}

function install_pip() {
  if command -v pip >/dev/null; then
    echo "pip is already installed."
    return 0
  fi

  if command -v easy_install >/dev/null; then
    echo "Installing pip with easy_install..."
    run_with_retry easy_install pip
    return 0
  fi

  echo "Installing python-pip..."
  run_with_retry apt update
  run_with_retry apt install python-pip -y
}

function gcsfuse_install(){
  echo "Installing gcsfuse..."
  export GCSFUSE_REPO=gcsfuse-`lsb_release -c -s`
  echo "deb https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | sudo tee /etc/apt/sources.list.d/gcsfuse.list
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -

  sudo apt-get update
  sudo apt-get install gcsfuse -y

  sudo groupadd fuse
  sudo usermod -a -G fuse $USER
}

function gcsfuse_mount(){  
  # Mount a bucket by “gcsfuse <your-bucket-name> <your-path/to/mount>”
  mkdir path-1
  gcsfuse kristin-0105 path-1
  echo "GCS bucket succesfully mounted at the specificed path"
  
  # Mount a bucket by “gcsfuse <your-bucket-name> <your-path/to/mount>”
  mkdir path-2
  gcsfuse notebooks-staging-bucket-kk path-2
  echo "GCS bucket succesfully mounted at the specificed path"
}

function gcsfuse_check(){
  # Check the mounted storage bucket as persistent disk by “df -h”
  df -h 
}

function main() {
  run_with_retry pip install --upgrade ${PACKAGES}

  run_with_retry gcsfuse_install
  run_with_retry gcsfuse_mount
  run_with_retry gcsfuse_check
}

main