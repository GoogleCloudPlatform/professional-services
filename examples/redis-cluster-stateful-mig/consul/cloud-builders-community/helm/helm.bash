#!/bin/bash -e

# If there is no current context, get one.
if [[ $(kubectl config current-context 2> /dev/null) == "" && "$SKIP_CLUSTER_CONFIG" != true ]]; then
    # This tries to read environment variables. If not set, it grabs from gcloud
    cluster=${CLOUDSDK_CONTAINER_CLUSTER:-$(gcloud config get-value container/cluster 2> /dev/null)}
    region=${CLOUDSDK_COMPUTE_REGION:-$(gcloud config get-value compute/region 2> /dev/null)}
    zone=${CLOUDSDK_COMPUTE_ZONE:-$(gcloud config get-value compute/zone 2> /dev/null)}
    project=${GCLOUD_PROJECT:-$(gcloud config get-value core/project 2> /dev/null)}

    function var_usage() {
        cat <<EOF
No cluster is set. To set the cluster (and the region/zone where it is found), set the environment variables
  CLOUDSDK_COMPUTE_REGION=<cluster region> (regional clusters)
  CLOUDSDK_COMPUTE_ZONE=<cluster zone> (zonal clusters)
  CLOUDSDK_CONTAINER_CLUSTER=<cluster name>
EOF
        exit 1
    }

    [[ -z "$cluster" ]] && var_usage
    [ ! "$zone" -o "$region" ] && var_usage

    if [ -n "$region" ]; then
      echo "Running: gcloud container clusters get-credentials --project=\"$project\" --region=\"$region\" \"$cluster\""
      gcloud container clusters get-credentials --project="$project" --region="$region" "$cluster"
    else
      echo "Running: gcloud container clusters get-credentials --project=\"$project\" --zone=\"$zone\" \"$cluster\""
      gcloud container clusters get-credentials --project="$project" --zone="$zone" "$cluster"
    fi
fi

# if GCS_PLUGIN_VERSION is set, install the plugin
if [[ -n $GCS_PLUGIN_VERSION ]]; then
  echo "Installing helm GCS plugin version $GCS_PLUGIN_VERSION "
  helm plugin install https://github.com/nouney/helm-gcs --version $GCS_PLUGIN_VERSION
fi

# if DIFF_PLUGIN_VERSION is set, install the plugin
if [[ -n $DIFF_PLUGIN_VERSION ]]; then
  echo "Installing helm DIFF plugin version $DIFF_PLUGIN_VERSION "
  helm plugin install https://github.com/databus23/helm-diff --version $DIFF_PLUGIN_VERSION
fi

# if HELMFILE_VERSION is set, install Helmfile
if [[ -n $HELMFILE_VERSION ]]; then
  echo "Installing Helmfile version $HELMFILE_VERSION "
  curl -SsL https://github.com/helmfile/helmfile/releases/download/$HELMFILE_VERSION/helmfile_linux_amd64 > helmfile
  chmod 700 helmfile
fi

# check if repo values provided then add that repo
if [[ -n $HELM_REPO_NAME && -n $HELM_REPO_URL ]]; then
  echo "Adding chart helm repo $HELM_REPO_URL"
  helm repo add $HELM_REPO_NAME $HELM_REPO_URL
fi

echo "Running: helm repo update"
helm repo list && helm repo update || true

if [ "$DEBUG" = true ]; then
  echo "Running: helm $@"
fi
helm "$@"
