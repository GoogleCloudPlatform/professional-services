#!/bin/bash

# Authenticate with Kubernetes if cluster is provided.
cluster=${CLOUDSDK_CONTAINER_CLUSTER:-$(gcloud config get-value container/cluster 2> /dev/null)}
if [[ -n "$cluster" ]]; then
  /builder/kubectl.bash
fi

echo "Running: ko" "$@" >&2
exec "/ko" "$@"
