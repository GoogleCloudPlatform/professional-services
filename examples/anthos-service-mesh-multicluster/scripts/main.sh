#!/usr/bin/env bash

# Copyright 2021 Google LLC
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

# Shellcheck Ignore Errors
#
# SC2153: Possible misspelling
# shellcheck disable=SC2153
#
# SC2155: Declare and assign separately to avoid masking return values.
# shellcheck disable=SC2155

# read project ID from google cloud SDK config or environment variable
export TF_VAR_project_id="$(gcloud config get-value project || ${GOOGLE_CLOUD_PROJECT})"

# Exit if any command fails
set -x

# Use script to set up k8s configuration and context for cluster
function set_up_credential {
  CLUSTER_NAME=$1
  CLUSTER_LOCATION=$2
  CLUSTER_CTX_NAME=$3
  PROJECT_ID=$4

  # Retrieve Kubeconfig file
  gcloud container clusters get-credentials "${CLUSTER_NAME}" --region "$CLUSTER_LOCATION" --project "${PROJECT_ID}"

  # running delete-context before rename allows for the function to be idempotent
  # The output is suppressed in the next two commands since the output could be misleading in this context
  kubectl config delete-context "${CLUSTER_CTX_NAME}"     &> /dev/null || true # do not fail if the context does not exist
  kubectl config rename-context "gke_${PROJECT_ID}_${CLUSTER_LOCATION}_${CLUSTER_CTX_NAME} ${CLUSTER_CTX_NAME}"
}

function download_asm_installer {
  ASM_MAJOR_VERSION=$1
  ASM_MINOR_VERION=$2
  
  ASM_INSTALLER="install_asm_${ASM_MAJOR_VERSION}.${ASM_MINOR_VERION}"
  AMS_INSTALLER_SIG="install_asm_${ASM_MAJOR_VERSION}.${ASM_MINOR_VERION}.sha256"

  # Remove existing installer to make sure that we have the right installer
  if [ -f "${ASM_INSTALLER}" ]; then
    rm "${ASM_INSTALLER}"
  fi

  # Remove existing installer to make sure that we have the right installer
  if [ -f "${AMS_INSTALLER_SIG}" ]; then
    rm "${AMS_INSTALLER_SIG}"
  fi

  # Download the Anthos Service Mesh installation file to your current working directory
  curl "https://storage.googleapis.com/csm-artifacts/asm/install_asm_${ASM_MAJOR_VERSION}.${ASM_MINOR_VERION}" > install_asm

  # Download the signature file and use openssl to verify the signature
  curl "https://storage.googleapis.com/csm-artifacts/asm/install_asm_${ASM_MAJOR_VERSION}.${ASM_MINOR_VERION}.sha256" > install_asm.sha256
 
  # Check whether signature matach
  sha256sum -c --ignore-missing install_asm.sha256

  # Make the installer executable
  chmod +x install_asm
}

function install_asm {
  CLUSTER_NAME=$1
  CLUSTER_LOCATION=$2
  PROJECT_ID=$3
   
  ./install_asm --project_id "${PROJECT_ID}" --cluster_name "${CLUSTER_NAME}" \
  --cluster_location "${CLUSTER_LOCATION}" \
  --mode install \
  --enable_apis
}

function download_istio {
    
    if [ -f "${ASM_VERSION}/bin/istioctl" ]; then
        echo "Istioctl has been downloaded"
    else
        # Download Istioctl
        curl -LO "https://storage.googleapis.com/gke-release/asm/istio-${ASM_VERSION}-${ASM_PKG_TYPE}.tar.gz"

        #unzip it to current directory
        tar xzf "istio-${ASM_VERSION}-${ASM_PKG_TYPE}.tar.gz"
    fi
}

# Configure cross-cluster service registry. The following command creates a secret in each cluster with the other clusters
# KUBECONFIG file so it can access (auth) services and endpoints running in that other cluster.
function cross_cluster_service_secret {
  CLUSTER1_NAME=$1
  CLUSTER1_CTX=$1
  CLUSTER2_CTX=$3

  "./${ASM_VERSION}/bin/istioctl" x create-remote-secret \
    --context="${CLUSTER1_CTX}" --name "${CLUSTER1_NAME}" | \
    kubectl --context="${CLUSTER2_CTX}" apply -f -
}

# Gant IAM permission for Connect Agent
function grant_role_to_connect_agent {
    HUB_PROJECT_ID=$1
    gcloud projects add-iam-policy-binding \
        "${HUB_PROJECT_ID}" \
        --member "serviceAccount:${HUB_PROJECT_ID}.hub.id.goog[gke-connect/connect-agent-sa]" \
        --role "roles/gkehub.connect"
}

# eg. register_cluster cluster1
# Requires a service account of the form ${GKE_CLUSTER}-connect@${TF_VAR_project_id}.iam.gserviceaccount.com
# The services accounts are created and managed via /infrastructure/anthos-service-accounts.tf
function register_cluster {
    GKE_CLUSTER=$1
    GKE_CLUSTER_LOCATION=$2

    # check for membership existence
    RESPONSE=$(gcloud container hub memberships --project "${TF_VAR_project_id}" list --filter="Name:${GKE_CLUSTER}")

    # see https://stackoverflow.com/a/229606 for contditional syntax
    if [[ $RESPONSE == *"${GKE_CLUSTER}"* ]] ; then
        echo "${GKE_CLUSTER} membership $1 exists"
    else
        echo "${GKE_CLUSTER} membership does not exist. Creating it now."

    # create membership
    gcloud beta container hub memberships register "${GKE_CLUSTER}" \
        --gke-cluster="${GKE_CLUSTER_LOCATION}"/"${GKE_CLUSTER}" \
        --enable-workload-identity
    fi
}


# Installs the ob application (microservices-demo) to both clusters
function install_helloworld {
  CLUSTER1_CTX=$1
  CLUSTER2_CTX=$2

  for CTX in ${CLUSTER1_CTX} ${CLUSTER2_CTX}
    do
      kubectl create --context="${CTX}" namespace sample
      kubectl label --context="${CTX}" namespace sample \
            istio-injection- istio.io/rev="${ASM_REVISION}" --overwrite   
      kubectl create --context="${CTX}" \
  -f "./${ASM_VERSION}/samples/helloworld/helloworld.yaml" \
        -l app=helloworld -n sample
    done

    kubectl create --context="${CLUSTER1_CLUSTER_CTX}" \
      -f "./${ASM_VERSION}/samples/helloworld/helloworld.yaml" \
      -l app=helloworld -l version=v1 -n sample

    kubectl create --context="${CLUSTER2_CLUSTER_CTX}" \
    -f "./${ASM_VERSION}/samples/helloworld/helloworld.yaml" \
      -l app=helloworld -l version=v2 -n sample

    for CTX in ${CLUSTER1_CLUSTER_CTX} ${CLUSTER2_CLUSTER_CTX}
      do
        kubectl apply --context="${CTX}" \
          -f "./${ASM_VERSION}/samples/sleep/sleep.yaml" -n sample
      done
}

function install_asm_mesh {
    cd "${WORK_DIR}" || exit
    set_up_credential "${CLUSTER1_CLUSTER_NAME} ${CLUSTER1_LOCATION} ${CLUSTER1_CLUSTER_CTX} ${TF_VAR_project_id}"
    set_up_credential "${CLUSTER2_CLUSTER_NAME} ${CLUSTER2_LOCATION} ${CLUSTER2_CLUSTER_CTX} ${TF_VAR_project_id}"  

    # Download ASM Installer
    download_asm_installer "${ASM_MAJOR_VER} ${ASM_MINOR_VER}"

    #Install ASM 
    install_asm "${CLUSTER1_CLUSTER_NAME} ${CLUSTER1_LOCATION} ${TF_VAR_project_id}"
    install_asm "${CLUSTER2_CLUSTER_NAME} ${CLUSTER2_LOCATION} ${TF_VAR_project_id}"

    # Register clusters
    grant_role_to_connect_agent "${TF_VAR_project_id}"
    register_cluster "${CLUSTER1_CLUSTER_CTX} ${CLUSTER1_LOCATION}"
    register_cluster "${CLUSTER2_CLUSTER_CTX} ${CLUSTER2_LOCATION}"

    # Add clusters to mesh
    cross_cluster_service_secret "${CLUSTER1_CLUSTER_NAME} ${CLUSTER1_CLUSTER_CTX} ${CLUSTER2_CLUSTER_CTX}"
    cross_cluster_service_secret "${CLUSTER2_CLUSTER_NAME} ${CLUSTER2_CLUSTER_CTX} ${CLUSTER1_CLUSTER_CTX}"
}

function install_test_app {
  set_up_credentials
  install_helloworld "${CLUSTER1_CLUSTER_CTX} ${CLUSTER2_CLUSTER_CTX}"
}

# Uninstall function added for convenience, not currently called anywhere
function uninstall_test_app {
  CLUSTER1_CTX=$1
  CLUSTER2_CTX=$2
  kubectl delete ns sample --context "${CLUSTER1_CTX}"
  kubectl delete ns sample --context "${CLUSTER2_CTX}"
}
