#!/bin/bash
echo "Apply Terraform"

if [[ -z "${SCOPE}" ]]; then
    SCOPE="https%3A%2F%2Fwww%2Egoogleapis%2Ecom%2Fauth%2Fcloud%2Dplatform"
fi
if [[ -z "${LIFETIME}" ]]; then
    LIFETIME="60"
fi
if [[ -z "${service_account}" ]]; then
    service_account="default_service_account@xyz.iam.gserviceaccount.com"
fi


url="https://sapro.com/access?sa=${service_account}&scopes=${SCOPE}&lifetime=${LIFETIME}"
access=$(gcloud auth print-identity-token --quiet)
response=$(curl --silent --write-out "STATUS_CODE:%{http_code}" -H "Gitlab-Token: ${CI_JOB_JWT}" -H "Authorization: Bearer ${access}" "${url}")
TF_VAR_ACCESS_TOKEN_RESPONSE=${response/STATUS_CODE:*/}
export TF_VAR_ACCESS_TOKEN=$TF_VAR_ACCESS_TOKEN_RESPONSE
status_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*STATUS_CODE://')

if [[ -n "$status_code" ]] && [[ "$status_code" = '200' ]]; then 
  echo "Succesfully retrieved token"
else
  echo "Failed retrieving token for ${service_account} _${status_code}_ - ${TF_VAR_ACCESS_TOKEN}"
  exit 1
fi

terraform apply -auto-approve tfplan.plan