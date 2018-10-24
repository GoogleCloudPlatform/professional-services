#!/bin/bash

# TO-DO: check for compatibility of this sed command with linux -- only tested on Mac
function replace_image() {
  local FILE=$1
  local IMAGE=$2
  [ "$(uname -a | cut -d ' ' -f 1)" == "Darwin" ] && BK='.bk' || BK=''  # adjust for OS
  sed -i $BK "s~^\(.* image:\).*$~\1 $IMAGE~g" $FILE
}

IMAGE=gcr.io/$(gcloud config get-value project)/resource-syncer:0.1
docker build -t $IMAGE . && docker push $IMAGE

# update image
replace_image manifests/deployment.yaml $IMAGE

# create ns, if DNE
NS=secrets
kubectl get ns $NS || kubectl create ns $NS

# create resources
kubectl apply -f manifests/rbac  # create service account first
kubectl apply -f manifests
