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

# NOTE: generates a random pass key using openssl for demonstration purposes.
#  This statement can be replaced to lookup ${secret_name} from other service
#  (ie. vault, secret manager)
# Get random secret and store in encrypted local file
function g_encrypt_secret() {
  local kms_key_uri=$1
  local secret_file_encrypted=$2

  set +x
  local secret_pass
  secret_pass=$(openssl rand -base64 32)

  encrypt_to_file_with_kms_key "${secret_pass}" "${secret_file_encrypted}" "${kms_key_uri}"
  set -x
}

# Encrypts a secret and persists to local file with a KMS key
function encrypt_to_file_with_kms_key() {
  local secret=$1
  local encrypted_file=$2
  local kms_key_uri=$3

  echo "${secret}" | gcloud kms encrypt \
    --ciphertext-file - --plaintext-file - --key "${kms_key_uri}" \
    > "${encrypted_file}"
}

# GCS copy wrapper
function g_cp() {
  CMD="gsutil cp ${1} ${2}"
  ${CMD} || log_and_fail "Unable to execute ${CMD}"
}

function main() {
  local tmp_secrets_dir=".secrets"
  mkdir -p $tmp_secrets_dir

  for name in "$@";
  do
    local local_secret
    local_secret=".secrets/${name}.encrypted"
    g_encrypt_secret "${KMS_KEY_URI:?Must set KMS_KEY_URI as env var}" "${local_secret}"
    g_cp "${local_secret}" "gs://${SECRETS_BUCKET:?Must set SECRETS_BUCKET as an env var}/"
  done
  rm -r $tmp_secrets_dir
}

main "$@"
