#!/bin/bash
set -e

export DOCKER_PASSWORD=$(gcloud auth application-default print-access-token)

echo "Running: klar $@"
klar "$@"
