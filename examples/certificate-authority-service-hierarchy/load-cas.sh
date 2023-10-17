#!/bin/bash

# Copyright 2023 Google LLC
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


if [ $# -eq 0 ]
then
    echo "Usage:"
    echo "./load-cas.sh <project id> <issuer location> <ca pool> <concurrency> <qps> <duration>"
    echo "./load-cas.sh my_project_id europe-west3 cas-pool 4 2 60s"
    echo ""
    exit 1
fi

PROJECT_ID="$1"
LOCATION="$2"
CA_POOL="$3"
CONCURRENCY="$4"
QPS="$5"
DURATION="$6"


TOKEN="$(gcloud auth print-access-token)"
export TOKEN
export LOGLEVEL=Info

#################################################################################

echo "Executing..."
echo "PROJECT_ID=${PROJECT_ID}"
echo "LOCATION=${LOCATION}"
echo "CA_POOL=${CA_POOL}"
echo "QPS=${QPS}"
echo "DURATION=${DURATION}"

# The following gcloud command gets executed via direct API call with Fortio
#
# gcloud privateca certificates create \
#   --issuer-location ${LOCATION} \
#   --issuer-pool ${CA_POOL} \
#   --generate-key \
#   --key-output-file .cert.key \
#   --cert-output-file .cert.crt \
#   --dns-san "example.com" \
#   --use-preset-profile "leaf_client_tls"

fortio load -c "${CONCURRENCY}" -qps "${QPS}" -t "${DURATION}" -loglevel "${LOGLEVEL}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -payload '{"config": {"publicKey": {"format": "PEM", "key": "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFyc1BSaHZQK3FOd3NEMktQQm1SUgpmRDBHNHRDZ3h5NmhBZk9rd0IvRmFLRE44QWFqMDJ6TFlnNzl0L0daUFFNUXVkcUNvdnNzTkxHUFFYd0JIRUxKCnI4TmlaaTBqUVM0QUVHbVB4bFdSRFVjbU9HNFE5ZUxiemVVeHM4dXIyb3E1S1lNRGtrRk1JN2w0U3BkU2h5ek4KdE5UMVloc0VCZFFYRHdyV1FROG1SZFhxbEJhT242d0g5czRlZ08xZTRYNTB3MnUzek0xa240Ny9ibjBoNjdNZQpaT29oTUhveTBSS3dOWUlzMkFieXBhSW9WbERMcFZjR1kvdUF4Umo4RGNnT3grbUhKeW1qNmFRa1V3cjFGeGJBCithT3hseEc3Qk9zSmNONjZPdjE3SHljREdhK2VDcEhCaEdQT2xWdlpmOVJZVHRPNmEvOUc3T3VHWlpzQkgvWk4KeVFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg=="}, "subjectConfig": {"subject": {}, "subjectAltName": {"dnsNames": ["example.com"]}}, "x509Config": {"caOptions": {"isCa": false}, "keyUsage": {"baseKeyUsage": {"digitalSignature": true, "keyEncipherment": true}, "extendedKeyUsage": {"clientAuth": true}}}}, "lifetime": "2592000s"}' \
    "https://privateca.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/caPools/${CA_POOL}/certificates?certificateId={uuid}"

