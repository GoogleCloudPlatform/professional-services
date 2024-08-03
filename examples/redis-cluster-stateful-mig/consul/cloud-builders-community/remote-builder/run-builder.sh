#!/bin/bash -xe

# Configurable parameters
[ -z "$COMMAND" ] && echo "Need to set COMMAND" && exit 1;

USERNAME=${USERNAME:-admin}
REMOTE_WORKSPACE=${REMOTE_WORKSPACE:-/home/${USERNAME}/workspace/}
INSTANCE_NAME=${INSTANCE_NAME:-builder-$(cat /proc/sys/kernel/random/uuid)}
ZONE=${ZONE:-us-central1-f}
INSTANCE_ARGS=${INSTANCE_ARGS:---preemptible}
SSH_ARGS=${SSH_ARGS:-}
GCLOUD=${GCLOUD:-gcloud}
RETRIES=${RETRIES:-10}

# Always delete instance after attempting build
function cleanup {
    ${GCLOUD} compute instances delete ${INSTANCE_NAME} --quiet
}

# Run command on the instance via ssh
function ssh {
    ${GCLOUD} compute ssh ${SSH_ARGS} --ssh-key-file=${KEYNAME} \
         ${USERNAME}@${INSTANCE_NAME} -- $1
}

${GCLOUD} config set compute/zone ${ZONE}

KEYNAME=builder-key
# TODO Need to be able to detect whether a ssh key was already created
ssh-keygen -t rsa -N "" -f ${KEYNAME} -C ${USERNAME} || true
chmod 400 ${KEYNAME}*

cat<< EOF | perl -pe 'chomp if eof'  >ssh-keys
${USERNAME}:$(cat ${KEYNAME}.pub)
EOF

${GCLOUD} compute instances create \
       ${INSTANCE_ARGS} ${INSTANCE_NAME} \
       --metadata block-project-ssh-keys=TRUE \
       --metadata-from-file ssh-keys=ssh-keys

trap cleanup EXIT

RETRY_COUNT=1
while [ "$(ssh 'printf pass')" != "pass" ]; do
  echo "[Try $RETRY_COUNT of $RETRIES] Waiting for instance to start accepting SSH connections..."
  if [ "$RETRY_COUNT" == "$RETRIES" ]; then
    echo "Retry limit reached, giving up!"
    exit 1
  fi
  sleep 10
  RETRY_COUNT=$(($RETRY_COUNT+1))
done

${GCLOUD} compute scp ${SSH_ARGS} --compress --recurse \
       $(pwd) ${USERNAME}@${INSTANCE_NAME}:${REMOTE_WORKSPACE} \
       --ssh-key-file=${KEYNAME}

ssh "${COMMAND}"

${GCLOUD} compute scp ${SSH_ARGS} --compress --recurse \
       ${USERNAME}@${INSTANCE_NAME}:${REMOTE_WORKSPACE}* $(pwd) \
       --ssh-key-file=${KEYNAME}
