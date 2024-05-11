#!/bin/bash
AGENT_IMAGE='nested-packer'
USERNAME=${USERNAME:-admin}
REMOTE_WORKSPACE=${REMOTE_WORKSPACE:-/home/${USERNAME}/workspace/}
INSTANCE_NAME=${INSTANCE_NAME:-builder-$(cat /proc/sys/kernel/random/uuid)}
IMAGE_ZONE=${IMAGE_ZONE:-us-central1-f}
INSTANCE_ARGS=${INSTANCE_ARGS:---preemptible}
gcloud config set compute/zone ${IMAGE_ZONE}

function cleanup {
    gcloud compute instances delete ${INSTANCE_NAME} --quiet
}

function wait_for_ssh {
    echo "Attempting to SSH to Builder machine..."
    attempt=1
    while (( $attempt <= 5 )); do
    gcloud compute ssh  --ssh-key-file=${KEYNAME} ${USERNAME}@${INSTANCE_NAME} --ssh-flag="-Nf" && EC=$?|| EC=$? && true
    case ${EC} in
        (0) echo "Success after ${attempt} try"; break ;;
        (*) echo "${attempt} of 5 failed attempts, Builder SSH Machine not ready yet, waiting 2 seconds..." ;;
    esac
    sleep 2s
    ((attempt+=1))
    done
}

mkdir -p ~/.ssh/
touch ~/.ssh/google_compute_known_hosts
chown -v `whoami` ~/.ssh/google_compute_known_hosts

KEYNAME=builder-key
# TODO Need to be able to detect whether a ssh key was already created
ssh-keygen -t rsa -N "" -f ${KEYNAME} -C ${USERNAME} || true
chmod 400 ${KEYNAME}*

cat > ssh-keys <<EOF
${USERNAME}:$(cat ${KEYNAME}.pub)
EOF
gcloud compute instances create \
       ${INSTANCE_ARGS} ${INSTANCE_NAME} \
       --image-family ${AGENT_IMAGE} \
       --zone=${IMAGE_ZONE} \
       --metadata block-project-ssh-keys=TRUE \
       --metadata-from-file ssh-keys=ssh-keys \
       --min-cpu-platform='Intel Haswell' \
       --scopes=storage-rw,compute-rw

tar -czf workspace.tgz *

wait_for_ssh

gcloud compute scp --compress --recurse \
       workspace.tgz ${USERNAME}@${INSTANCE_NAME}:~ \
       --ssh-key-file=${KEYNAME}

gcloud compute ssh --ssh-key-file=${KEYNAME} ${USERNAME}@${INSTANCE_NAME} -- 'tar -xvzf workspace.tgz'

gcloud compute ssh  --ssh-key-file=${KEYNAME} ${USERNAME}@${INSTANCE_NAME} -- 'ls -l'
COMMAND="export BUILD_NUMBER="$(echo ${TAG_NAME} | sed 's/\.//')" &&  packerio build \
-var \"project=${PROJECT_ID}\" \
-var \"image_family=${IMAGE_FAMILY}\" \
-var \"gcs_bucket=${IMAGES_BUCKET}\" \
-var \"zone=${IMAGE_ZONE}\" \
${PACKER_SPEC}"

gcloud compute ssh  --ssh-key-file=${KEYNAME} ${USERNAME}@${INSTANCE_NAME} -- ${COMMAND}

trap cleanup EXIT