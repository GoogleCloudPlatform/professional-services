#!/bin/sh
echo "Planning Terraform"

if [ -z "${SCOPES}" ]; then
    SCOPES="https%3A%2F%2Fwww%2Egoogleapis%2Ecom%2Fauth%2Fcloud%2Dplatform"
fi
if [ -z "${LIFETIME}" ]; then
    LIFETIME="60"
fi

STATUS_CODE=500
url="https://sapro.com/access?sa=${SERVICE_ACCOUNT}&scopes=$SCOPES&lifetime=${LIFETIME}"
access=$(gcloud auth print-identity-token --quiet)
response=$(curl --silent --write-out "STATUS_CODE:%{http_code}" -H "Gitlab-Token: ${CI_JOB_JWT}" -H "Authorization: Bearer ${access}" "${url}")
token=$(echo $response | sed -e 's/.*STATUS_CODE://')

if [ -n "$STATUS_CODE" ] && [ "$STATUS_CODE" = '200' ]; then
  echo "Succesfully retrieved token"
else
  echo "Failed retrieving token $STATUS_CODE - $token"
  exit 1
fi

terraform plan -var "access_token=${token}" -out tfplan.plan