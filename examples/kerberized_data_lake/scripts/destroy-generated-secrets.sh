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

# DISCLAIMER:
# THIS SCRIPT IS NOT INTENDED FOR PRODUCTION USE.
# This script just makes dummy random passwords and ecrypts them
# with Google Cloud KMS. This is just a means to bootstrapping some kerberos
# principals for a mock data lake for testing / demo purposes.

# Expects Environment Variables
# KMS_KEY_URI - to use for encrypting secrets
# SECRETS_BUCKET - GCS bucket to upload encrypted secrets

set -xeuo pipefail
# Log wrapper
function log_and_fail() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR $*" >&2
  return 1
}


# GCS copy wrapper
function g_rm() {
  CMD="gsutil rm ${1}"
  ${CMD} || log_and_fail "Unable to execute ${CMD}"
}

function main() {
  for name in "$@";
  do
    local secret_name
    secret_name="${name}.encrypted"
    g_rm "gs://${SECRETS_BUCKET:?Must set SECRETS_BUCKET as an env var}/${secret_name}"
  done
}

main "$@"
