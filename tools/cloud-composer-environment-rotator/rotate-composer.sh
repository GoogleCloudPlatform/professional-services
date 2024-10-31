#!/bin/bash

# Rotate Airflow to a new Composer environment and decommission the old environment.

# The script takes seven arguments:
# 1. (p) project_id where Composer is deployed
# 2. (c) old Composer environment name
# 3. (l) old Composer environment location
# 4. (C) new Composer environment name
# 5. (L) new Composer environment location
# 6. (g) GCS location for snapshot
# 7. (d) old DAG folder

# Sample Usage:

# ./rotate-composer.sh \
#   -p "cy-artifacts" \
#   -c "composer-2-small" \
#   -l "us-central1" \
#   -C "composer-2-small-new" \
#   -L "us-central1" \
#   -g "gs://cy-sandbox/composer-snapshots/" \
#   -d "gs://us-central1-composer-2-smal-56609903-bucket/dags"

set -e

usage() {
    echo "usage: rotate-composer.sh -p <project_id> -c <old_env> -l <old_location> -C <new_env> -L <new_location> -g <snapshot_gcs> -d <old_dag_folder>"
    exit 1
}

PROJECT_ID=""
OLD_COMPOSER_ENV=""
OLD_COMPOSER_LOCATION=""
NEW_COMPOSER_ENV=""
NEW_COMPOSER_LOCATION=""
SNAPSHOT_GCS_FOLDER=""
OLD_DAG_FOLDER=""

while getopts p:c:l:C:L:g:d: flag; do
    case "${flag}" in
        p) PROJECT_ID=${OPTARG} ;;
        c) OLD_COMPOSER_ENV=${OPTARG} ;;
        l) OLD_COMPOSER_LOCATION=${OPTARG} ;;
        C) NEW_COMPOSER_ENV=${OPTARG} ;;
        L) NEW_COMPOSER_LOCATION=${OPTARG} ;;
        g) SNAPSHOT_GCS_FOLDER=${OPTARG} ;;
        d) OLD_DAG_FOLDER=${OPTARG} ;;
        *) usage ;;
    esac
done

if [[ -z "$PROJECT_ID" || -z "$OLD_COMPOSER_ENV" || -z "$OLD_COMPOSER_LOCATION" || -z "$NEW_COMPOSER_ENV" || -z "$NEW_COMPOSER_LOCATION" || -z "$SNAPSHOT_GCS_FOLDER" || -z "$OLD_DAG_FOLDER" ]]; then
    usage
fi

echo "------------------------------------------------------------"
echo "... Beginning Rotation (this can take up to 30 minutes) ..."
echo "------------------------------------------------------------"

echo "Project ID:                       ${PROJECT_ID}"
echo "Old Composer Environment:         ${OLD_COMPOSER_ENV}"
echo "Old Composer Location:            ${OLD_COMPOSER_LOCATION}"
echo "Old Composer DAG Folder:          ${OLD_DAG_FOLDER}"
echo "Composer Snapshot GCS Location:   ${SNAPSHOT_GCS_FOLDER}"
echo "New Composer Environment:         ${NEW_COMPOSER_ENV}"
echo "New Composer Location:            ${NEW_COMPOSER_LOCATION}"

echo "------------------------------------------"
echo "... Saving Airflow DAG inventory state ..."
echo "------------------------------------------"

gcloud composer environments run "${OLD_COMPOSER_ENV}" \
  --location "${OLD_COMPOSER_LOCATION}" dags list > "${OLD_COMPOSER_ENV}_${OLD_COMPOSER_LOCATION}_inventory"

echo "Inventory stored in file: ${OLD_COMPOSER_ENV}_${OLD_COMPOSER_LOCATION}_inventory"

echo "---------------------------------------------------"
echo "... Saving snapshot of old Composer environment ..."
echo "---------------------------------------------------"

SAVED_SNAPSHOT=$(gcloud beta composer environments snapshots save \
  "${OLD_COMPOSER_ENV}" \
  --location "${OLD_COMPOSER_LOCATION}" \
  --snapshot-location "${SNAPSHOT_GCS_FOLDER}")

SAVED_SNAPSHOT_PATH=$(echo "${SAVED_SNAPSHOT}" | awk -F': ' '/Saved snapshot to/ {print $2}')
echo "Saved Snapshot GCS Path: ${SAVED_SNAPSHOT_PATH}"

echo "-------------------------------"
echo "... Uploading pause_all DAG ..."
echo "-------------------------------"

gsutil cp dags/pause_all_dags.py "${OLD_DAG_FOLDER}"

echo "---------------------------------------------------"
echo "... Waiting for DAG to be synced to environment ..."
echo "---------------------------------------------------"

while true; do
    DAG_PAUSED=$(gcloud composer environments run "${OLD_COMPOSER_ENV}" \
      --location "${OLD_COMPOSER_LOCATION}" dags list -- --output=json | jq --raw-output '.[] | select(.dag_id=="pause_all_dags") | .paused')

    if [[ "$DAG_PAUSED" == "False" ]]; then
        echo "DAG FOUND AND READY!"
        break
    else
        echo "Waiting..."
        sleep 15
    fi
done

echo "-------------------------------------------------------------"
echo "... Triggering pause_all_dags in old Composer environment ..."
echo "-------------------------------------------------------------"

gcloud composer environments run "${OLD_COMPOSER_ENV}" \
  --location "${OLD_COMPOSER_LOCATION}" \
  dags trigger -- "pause_all_dags"

echo "-------------------------------"
echo "... Removing pause_all DAG ..."
echo "-------------------------------"

gsutil rm "${OLD_DAG_FOLDER}/pause_all_dags.py"

echo "------------------------------------------------------"
echo "... Loading snapshot into new Composer environment ..."
echo "------------------------------------------------------"

gcloud beta composer environments snapshots load \
  "${NEW_COMPOSER_ENV}" \
  --location "${NEW_COMPOSER_LOCATION}" \
  --snapshot-path "${SAVED_SNAPSHOT_PATH}"

echo "Rotation COMPLETE!"
