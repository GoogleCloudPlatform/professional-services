#!/bin/bash

# Set proxy IP as needed
export PROXY_IP_PORT=""

# COLOR Support;
export RED='\033[0;31m';
export NC='\033[0m' # No Color;

export APIs=(
    'accounts.google.com'
    'anthos-migrate.gcr.io'
    'anthos.googleapis.com'
    'anthosaudit.googleapis.com'
    'anthosgke.googleapis.com'
    'cloudresourcemanager.googleapis.com'
    'container.googleapis.com'
    'dl.google.com' # redirects to www.google.com/chrome
    'www.google.com/chrome'
    'docker.io'
    'gcr.io' # redirects to cloud.google.com/container-registry
    'cloud.google.com/container-registry'
    'gkeconnect.googleapis.com'
    'gkehub.googleapis.com'
    'google.com'
    'hashicorp.com'
    'iam.googleapis.com'
    'iamcredentials.googleapis.com'
    'k8s.io'
    'logging.googleapis.com'
    'monitoring.googleapis.com'
    'oauth2.googleapis.com'
    'opsconfigmonitoring.googleapis.com'
    'quay.io'
    'securetoken.googleapis.com'
    'servicecontrol.googleapis.com'
    'serviceusage.googleapis.com'
    'stackdriver.googleapis.com'
    'storage.googleapis.com'
    'storage-api.googleapis.com'
    'storage-component.googleapis.com'
    'sts.googleapis.com'
    # below for Anthos Service Mesh
    'cloudtrace.googleapis.com'
    'meshconfig.googleapis.com'
    # below for testing the response codes
    'thisshoudnotroutexyz.biz'  
)

# Check connectivity to endpoints
for api in "${APIs[@]}";
do
  printf '%s: %b' "$api" "${RED}";
  if [[ -z "${PROXY_IP_PORT// }" ]]; then
    curl -s https://"${api}" -w"%{http_code}\\n" -o /dev/null -m 5; # Skip Proxy
  else
    curl -sx "$PROXY_IP_PORT" https://"$api" -w"%{http_code}\\n" -o /dev/null -m 5; # Use Proxy
  fi
  printf '%b' "${NC}";
done