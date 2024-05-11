#! /usr/bin/bash

WORKING_DIR=$(pwd)
CUSTOMIZATION_SCRIPT_LOCATION="${WORKING_DIR}/${CUSTOMIZATION_SCRIPT_PATH}"

# Sets the region for the smoke_test_runner.py command line
REGION=${ZONE::-2}
echo "---- Setting region to ${REGION} ----"
gcloud config set dataproc/region ${REGION}

# Target location of the Cloud Build git clone
cd /dataproc-custom-images

# Adds the parameters required by the Python script
# dataproc-version and base-image-uri being mutually
# exclusive, they are part of the conditions even if
# one of them is required.
params=(--image-name=${CUSTOM_IMAGE_NAME})
params+=(--customization-script=${CUSTOMIZATION_SCRIPT_LOCATION})
params+=(--zone=${ZONE})
params+=(--gcs-bucket=gs://${GCS_LOGS})


# Adds all parameters that are passed by
# SUBSTITUTION ie that are not null/empty.
if [ ! -z "$DATAPROC_VERSION" ]; then
    params+=(--dataproc-version=${DATAPROC_VERSION})
fi
if [ ! -z "$BASE_IMAGE_URI" ]; then
    params+=(--base-image-uri=${BASE_IMAGE_URI})
fi
if [ ! -z "$FAMILY" ]; then
    params+=(--family=${FAMILY})
fi
if [ ! -z "$PROJECT_ID" ]; then
    params+=(--project-id=${PROJECT_ID})
fi
if [ ! -z "$OAUTH" ]; then
    params+=(--oauth=${OAUTH})
fi
if [ ! -z "$MACHINE_TYPE" ]; then
    params+=(--machine-type=${MACHINE_TYPE})
fi
if [ ! -z "$NO_SMOKE_TEST" ]; then
    params+=(--no-smoke-test)
fi
if [ ! -z "$NETWORK" ]; then
    params+=(--network=${NETWORK})
fi
if [ ! -z "$SUBNETWORK" ]; then
    params+=(--subnetwork=${SUBNETWORK})
fi
if [ ! -z "$NO_EXTERNAL_IP" ]; then
    params+=(--no-external-ip)
fi
if [ ! -z "$SERVICE_ACCOUNT" ]; then
    params+=(--service-account=${SERVICE_ACCOUNT})
fi
if [ ! -z "$EXTRA_SOURCES" ]; then
    params+=(--extra-sources=${EXTRA_SOURCES})
fi
if [ ! -z "$DISK_SIZE" ]; then
    params+=(--disk-size=${DISK_SIZE})
fi
if [ ! -z "$ACCELERATOR" ]; then
    params+=(--accelerator=${ACCELERATOR})
fi
if [ ! -z "$BASE_IMAGE_URI" ]; then
    params+=(--base-image-uri=${BASE_IMAGE_URI})
fi
if [ ! -z "$STORAGE_LOCATION" ]; then
    params+=(--storage-location=${STORAGE_LOCATION})
fi
if [ ! -z "$SHUTDOWN_INSTANCE_TIMER_SEC" ]; then
    params+=(--shutdown-instance-timer-sec=${SHUTDOWN_INSTANCE_TIMER_SEC})
fi
if [ ! -z "$DRY_RUN" ]; then
    params+=(--dry-run)
fi

echo "---- Passing these parameters to 'python generate_custom_image.py' ${params[@]} ----"

python generate_custom_image.py ""${params[@]}""
