#!/bin/sh
#$1 PROJECT_NUMBER
#$2 POOL_ID
#$3 PROVIDER_ID
#$4 SERVICE_ACCOUNT_EMAIL

PAYLOAD=$(cat <<EOF
{
"audience": "//iam.googleapis.com/projects/$1/locations/global/workloadIdentityPools/$2/providers/$3",
"grantType": "urn:ietf:params:oauth:grant-type:token-exchange",
"requestedTokenType": "urn:ietf:params:oauth:token-type:access_token",
"scope": "https://www.googleapis.com/auth/cloud-platform",
"subjectTokenType": "urn:ietf:params:oauth:token-type:jwt",
"subjectToken": "${CI_JOB_JWT_V2}"
}
EOF
)

FEDERATED_TOKEN="$(curl --fail-with-body "https://sts.googleapis.com/v1/token" \
 --header "Accept: application/json" \
 --header "Content-Type: application/json" \
 --data "${PAYLOAD}" \
 | jq -r '.access_token'
)"

ACCESS_TOKEN="$(curl --fail-with-body "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/$4:generateAccessToken" \
--header "Accept: application/json" \
--header "Content-Type: application/json" \
--header "Authorization: Bearer $FEDERATED_TOKEN" \
--data '{"scope": ["https://www.googleapis.com/auth/cloud-platform"]}' \
| jq -r '.accessToken'
)"

#REMINDER Enable for debugging
#echo "***** ENVIRONMENT VARIABLES *****"
#echo $1
#echo $2
#echo $3
#echo $4
#echo "***** AUDIENCE *****"
#echo "//iam.googleapis.com/projects/$1/locations/global/workloadIdentityPools/$2/providers/$3"
#echo "***** FEDERATED TOKEN *****"
#echo $FEDERATED_TOKEN
#echo "***** ACCESS TOKEN *****"
#echo $ACCESS_TOKEN

echo "ACCESS_TOKEN=${ACCESS_TOKEN}"