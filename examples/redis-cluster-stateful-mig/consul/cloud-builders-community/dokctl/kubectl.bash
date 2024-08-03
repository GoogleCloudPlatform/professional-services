#!/bin/bash
# If there is no current context, get one.
if [[ $(kubectl config current-context 2> /dev/null) == "" ]]; then
    cluster=$CLUSTER

    function var_usage() {
      cat <<EOF
No cluster is set. To set the cluster set the environment variables
  CLUSTER=<cluster>
  DIGITALOCEAN_ACCESS_TOKEN=<token>
EOF
        exit 1
    }

    [[ -z "$cluster" ]] && var_usage
    [[ -z "$DIGITALOCEAN_ACCESS_TOKEN" ]] && var_usage

    echo "Running: doctl kubernetes cluster kubeconfig save $cluster"
    doctl kubernetes cluster kubeconfig save $cluster || exit
fi

echo "Running: kubectl $@"
kubectl "$@"
