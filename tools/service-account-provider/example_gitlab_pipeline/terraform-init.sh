#!/bin/bash
echo "Initing Terraform"

if [ -z "${scope}"]; then
    SCOPE="https%3A%2F%2Fwww%2Egoogleapis%2Ecom%2Fauth%2Fcloud%2Dplatform"
fi
if [ -z "${lifetime}"]; then
    LIFETIME="60"
fi

url="https://sapro.com/access?sa=${service_account}&scopes=${SCOPE}&lifetime=${LIFETIME}"
access=$(gcloud auth print-identity-token --quiet)
response=$(curl --silent --write-out "STATUS_CODE:%{http_code}" -H "Gitlab-Token: ${CI_JOB_JWT}" -H "Authorization: Bearer ${access}" ${url})
token=$(echo $response | sed -e 's/.*STATUS_CODE://')

if [ -n "$status_code" -a "$status_code" = '200' ]; then 
  echo "Succesfully retrieved token"
else
  echo "Failed retrieving token $status_code - $token"
  exit 1
fi

terraform init -backend-config="access_token=${token}"