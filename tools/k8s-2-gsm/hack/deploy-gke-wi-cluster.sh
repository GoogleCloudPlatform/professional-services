#!/usr/bin/env bash

# Deploy A GKE cluster with Workload Identity enabled:
#  - cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
#
# Variables are set in .env + `source .env`
#
# ./hack/deploy-gke-wi-cluster.sh

if [[ -z ${GKE_NAME} || -z ${GCP_PROJECT} ]]; then
  echo 'one or more variables are undefined'
  exit 1
fi

echo "creating vpc-demo-test with custom subnets"
gcloud compute networks create gke-vpc-demo-test --subnet-mode=custom

echo "creating cluster ${GKE_NAME} in ${GCP_PROJECT}"
gcloud container clusters create "${GKE_NAME}" --network=gke-vpc-demo-test --num-nodes 2 --machine-type e2-standard-4 --enable-ip-alias --create-subnetwork name=gke-subnet-0 --workload-pool="${GCP_PROJECT}".svc.id.goog