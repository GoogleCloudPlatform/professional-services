#!/bin/bash
set -e

die() {
  echo "${0##*/}: error: $*" >&2
  exit 1
}

if [ $# -eq 0 ]; then
    python3 /work/parse_arguments.py --help
    die "missing arguments"
fi

# Running the Python script with "--help" causes it to exit with status 0
# This would cause this bash script to try to take that output and interpret
# it as an associative array, like it would in normal usage. Therefore,
# we must intervene and run the help command ourselves, exiting afterwards.
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    python3 /work/parse_arguments.py --help
    exit 0
fi

# Technique from https://stackoverflow.com/a/11682266
# Use a Python script to parse the arguments to this bash script, then returns them to be parsed as an array
OUTPUT=$(python3 /work/parse_arguments.py $@)
declare -A args="($OUTPUT)"

docker pull "${args[artifact_url]}"
IMAGE_AND_DIGEST="$(docker inspect "${args[artifact_url]}" --format='{{index .RepoDigests 0}}')"
echo "$IMAGE_AND_DIGEST"

if [ -n "${args[pgp_key_fingerprint]}" ]; then
    if [ -z "$PGP_SECRET_KEY" ]; then
        die "PGP_SECRET_KEY environment variable is required if providing the PGP signing key through an environment variable. Please consult the documentation for more information."
    fi

    gcloud container binauthz create-signature-payload \
        --artifact-url="$IMAGE_AND_DIGEST" > binauthz_signature_payload.json

    mkdir -p ~/.gnupg
    echo allow-loopback-pinentry > ~/.gnupg/gpg-agent.conf
    if [ -z "$PGP_SECRET_KEY_PASSPHRASE" ]; then
        COMMON_FLAGS="--no-tty --pinentry-mode loopback"
    else
        COMMON_FLAGS="--no-tty --pinentry-mode loopback --passphrase ${PGP_SECRET_KEY_PASSPHRASE}"
    fi

    echo -n "$PGP_SECRET_KEY" | gpg2 $COMMON_FLAGS --import
    gpg2 $COMMON_FLAGS --output generated_signature.pgp --local-user "${args[pgp_key_fingerprint]}" --armor --sign binauthz_signature_payload.json
    gcloud container binauthz attestations create \
        --artifact-url="$IMAGE_AND_DIGEST" \
        --attestor="${args[attestor]}" \
        --signature-file=./generated_signature.pgp \
        --public-key-id="${args[pgp_key_fingerprint]}"
else
    gcloud beta container binauthz attestations sign-and-create \
        --attestor="${args[attestor]}" \
        --artifact-url="$IMAGE_AND_DIGEST" \
        --keyversion="${args[keyversion]}"
fi
echo "Successfully created attestation"
