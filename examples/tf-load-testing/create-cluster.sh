#!/bin/bash
set -e

# add timestamps

function create_cluster() {
	local COMPONENT_NAME=$1
	local CLUSTER_NAME=$2
	local CLUSTER_ZONE=$3
	local GCP_PROJECT=$4
	local MACHINE_TYPE=$5
	# get master cidr block of existing cluster
	local MASTER_CIDR
	MASTER_CIDR=$(gcloud container clusters describe "${CLUSTER_NAME}" --project="${GCP_PROJECT}" --zone="${CLUSTER_ZONE}" --format="value(privateClusterConfig.masterIpv4CidrBlock)" 2>> /dev/null)
	
	# delete existing cluster with the same name if exists
	gcloud container clusters delete "${CLUSTER_NAME}" --zone="${CLUSTER_ZONE}" --project="${GCP_PROJECT}" --quiet || true

	# calculate cidr block for master network of new cluster
	if [ -z "$MASTER_CIDR" ]; then
		COUNT_CLUSTERS=$(gcloud container clusters list  --project="${GCP_PROJECT}"  --format="value(name)" | wc -l)
		CIDR_BEGIN=$(( COUNT_CLUSTERS*16 ))
		MASTER_CIDR="172.16.0.${CIDR_BEGIN}/28"
	fi

	echo "Kubernetes master address range: ${MASTER_CIDR}"
	# create cluster
	gcloud container clusters create "${CLUSTER_NAME}" --master-ipv4-cidr="${MASTER_CIDR}" --zone="${CLUSTER_ZONE}" --machine-type="${MACHINE_TYPE}" --enable-private-nodes --enable-ip-alias --no-enable-master-authorized-networks  --project="${GCP_PROJECT}"
	# get tensorflow lb ip
	gcloud container clusters get-credentials "${CLUSTER_NAME}" --zone="${CLUSTER_ZONE}"  --project="${GCP_PROJECT}"
}

function deploy_app() {
	local COMPONENT_NAME=$1
	local CLUSTER_NAME=$2
	local CLUSTER_ZONE=$3
	local GCP_PROJECT=$4
	# deploy the app
	(cd "${COMPONENT_NAME}" && gcloud builds submit --project="${GCP_PROJECT}" --substitutions=_CLOUDSDK_COMPUTE_ZONE="${CLUSTER_ZONE}" --substitutions=_CLOUDSDK_CONTAINER_CLUSTER="${CLUSTER_NAME}" --quiet)
	
}


# DEPLOY TF
COMPONENT_NAME="tensorflow"

# generate cluster name
TENSORFLOW_CLUSTER_NAME="loadtest-${COMPONENT_NAME}-${TENSORFLOW_MACHINE_TYPE}"

# deploy tensorflow app
create_cluster "$COMPONENT_NAME" "$TENSORFLOW_CLUSTER_NAME" "$CLUSTER_ZONE" "$GCP_PROJECT" "$TENSORFLOW_MACHINE_TYPE"
deploy_app "$COMPONENT_NAME" "$TENSORFLOW_CLUSTER_NAME" "$CLUSTER_ZONE" "$GCP_PROJECT"
# remove later
gcloud container clusters get-credentials "${TENSORFLOW_CLUSTER_NAME}" --zone="${CLUSTER_ZONE}"  --project="${GCP_PROJECT}"
TF_SVC_IP=$(kubectl get svc tensorflow-app -o custom-columns='ip:.status.loadBalancer.ingress[0].ip' --no-headers)
echo "${COMPONENT_NAME} service ip address: ${TF_SVC_IP}"

# get cpuPlatform
CLUSTER_NODE_POOL=$(gcloud container node-pools list --project="${GCP_PROJECT}" --cluster="${TENSORFLOW_CLUSTER_NAME}" --zone="${CLUSTER_ZONE}" --format="value(name)")
CLUSTER_INSTANCE_GROUP=$(gcloud container node-pools describe "${CLUSTER_NODE_POOL}" --project="${GCP_PROJECT}" --cluster="${TENSORFLOW_CLUSTER_NAME}" --zone="${CLUSTER_ZONE}" --format="value(instanceGroupUrls)")
CLUSTER_NODE_NAMES=$(gcloud compute instance-groups list-instances "${CLUSTER_INSTANCE_GROUP##*/}" --project="${GCP_PROJECT}" --zone="${CLUSTER_ZONE}"  --format="value(NAME)")
while IFS= read -r NODE; do
    CLUSTER_NODE_CPU_PLATFORM=$(gcloud compute instances describe "${NODE}" --project="${GCP_PROJECT}" --format="value(cpuPlatform)" --zone="${CLUSTER_ZONE}")
    echo "NODE: ${NODE} CPU: ${CLUSTER_NODE_CPU_PLATFORM}"
done <<< "${CLUSTER_NODE_NAMES}"


COMPONENT_NAME="locust"
LOCUST_CLUSTER_NAME="loadtest-${COMPONENT_NAME}-${LOCUST_MACHINE_TYPE}"

# deploy locust app
create_cluster "$COMPONENT_NAME" "$LOCUST_CLUSTER_NAME" "$CLUSTER_ZONE" "$GCP_PROJECT" "$LOCUST_MACHINE_TYPE"
deploy_app "$COMPONENT_NAME" "$LOCUST_CLUSTER_NAME" "$CLUSTER_ZONE" "$GCP_PROJECT"
