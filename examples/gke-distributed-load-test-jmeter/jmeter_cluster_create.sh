#!/usr/bin/env bash

# Copyright 2023 Google Inc. All Rights Reserved.
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

#######################################
# Deploy Jmeter on GKE
# Globals:
#   None
# Arguments:
#   None
#######################################

echo "checking if kubectl is present"

if ! hash kubectl 2>/dev/null
then
    echo "'kubectl' was not found in PATH"

    echo "Kindly ensure that you can acces an existing kubernetes cluster via kubectl"

    exit
fi

kubectl version --short

echo "Current list of namespaces on the kubernetes cluster:"

echo

kubectl get namespaces | grep -v NAME | awk '{print $1}' || true

echo

tenant="$1"
if [[ -z "${tenant}" ]]
then

  echo "Enter the name of the new tenant unique name, this will be used to create the namespace"

  read -r tenant
fi

echo

#Check If namespace exists

kubectl get namespace "${tenant}" > /dev/null 2>&1

if [[ $? -eq 0 ]]
then

  echo "Namespace ${tenant} already exists, please select a unique name"

  echo "Current list of namespaces on the kubernetes cluster"

  sleep 2

  kubectl get namespaces | grep -v NAME | awk '{print $1}' || true

  exit 1
fi

echo
echo "Creating Namespace: ${tenant}"

kubectl create namespace "${tenant}"

echo "Namspace ${tenant} has been created"

echo

echo "Creating Jmeter worker nodes"

nodes=$(kubectl get no | grep -c -v "controller| NAME" ) || true

echo

echo "Number of worker nodes on this cluster is " "${nodes}"

echo

#echo "Creating $nodes Jmeter slave replicas and service"

echo

kubectl create -n "${tenant}" -f jmeter_workers_deploy.yaml
kubectl create -n "${tenant}" -f jmeter_workers_svc.yaml

echo "Creating Jmeter Controller"

kubectl create -n "${tenant}" -f jmeter_controller_deploy.yaml

echo "Printout Of the ${tenant} Objects"

echo

kubectl get -n "${tenant}" all

echo namespace = "${tenant}" > tenant_export
