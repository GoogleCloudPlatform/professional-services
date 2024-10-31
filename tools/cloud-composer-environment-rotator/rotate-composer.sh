#!/bin/bash

# Rotate Airflow to a new composer environment and decommission the old environment.

# The script takes three arguments
# 1. (p) project_id where composer is deployed
# 2. (c) old composer environment name
# 3. (l) old composer environment location
# 1. (C) new composer environment name
# 2. (L) new composer environment location 
# 3. (g) gcs location for snapshot

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

usage()
{
    echo "usage: rotate-composer.sh options:<p|c|l|C|L|g|d>"
}
PROJECT_ID=""
OLD_COMPOSER_ENV=""
OLD_COMPOSER_LOCATION=""
NEW_COMPOSER_ENV=""
NEW_COMPOSER_LOCATION=""
SNAPSHOT_GCS_FOLDER=""
OLD_DAG_FOLDER=""

while getopts p:c:l:C:L:g:d: flag
do
    case "${flag}" in
        p) PROJECT_ID=${OPTARG};;
        c) OLD_COMPOSER_ENV=${OPTARG};;
        l) OLD_COMPOSER_LOCATION=${OPTARG};;
        C) NEW_COMPOSER_ENV=${OPTARG};;
        L) NEW_COMPOSER_LOCATION=${OPTARG};;
        g) SNAPSHOT_GCS_FOLDER=${OPTARG};;
        d) OLD_DAG_FOLDER=${OPTARG};;
        *) usage
           exit;;
    esac
done

[[ $PROJECT_ID == "" || $OLD_COMPOSER_ENV == "" || $OLD_COMPOSER_LOCATION == "" || $NEW_COMPOSER_ENV = "" || $NEW_COMPOSER_LOCATION = "" || $SNAPSHOT_GCS_FOLDER = "" || OLD_DAG_FOLDER = "" ]] && { usage; exit 1; }

# PROJECT_ID="cy-artifacts"
# OLD_COMPOSER_ENV="composer-2-small"
# OLD_COMPOSER_LOCATION="us-central1"

# NEW_COMPOSER_ENV="composer-2-small-new"
# NEW_COMPOSER_LOCATION="us-central1"
# SNAPSHOT_GCS_FOLDER="gs://cy-sandbox/composer-snapshots/"
# OLD_DAG_FOLDER="gs://us-central1-composer-2-smal-56609903-bucket/dags"


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

gcloud composer environments run composer-2-small \
  --location us-central1 dags list > ${OLD_COMPOSER_ENV}_${OLD_COMPOSER_LOCATION}_inventory

echo "Inventory stored in file: ${OLD_COMPOSER_ENV}_${OLD_COMPOSER_LOCATION}_inventory"

echo "---------------------------------------------------"
echo "... Saving snapshot of old Composer environment ..."
echo "---------------------------------------------------"

SAVED_SNAPSHOT=$(gcloud beta composer environments snapshots save \
  ${OLD_COMPOSER_ENV} \
  --location ${OLD_COMPOSER_LOCATION} \
  --snapshot-location ${SNAPSHOT_GCS_FOLDER})

SAVED_SNAPSHOT_PATH=$(echo ${SAVED_SNAPSHOT} | awk '{split($0, a, ": "); print a[3]}')
echo "Saved Snapshot GCS Path: ${SAVED_SNAPSHOT_PATH}" 

echo "-------------------------------"
echo "... uploading pause_all DAG ..."
echo "-------------------------------"

gsutil cp dags/pause_all_dags.py $OLD_DAG_FOLDER

echo "---------------------------------------------------"
echo "... waiting for DAG to be synced to environment ..."
echo "---------------------------------------------------"

while true; do
  # we want to see if the dag exists and isn't paused
  DAG_PAUSED=$(gcloud composer environments run $OLD_COMPOSER_ENV \
    --location $OLD_COMPOSER_LOCATION dags list -- --output=json | jq --raw-output '.[] | select(.dag_id == "'pause_all_dags'") | .paused')

  if [[ "$DAG_PAUSED" == "False" ]]; then
    echo "DAG FOUND AND READY!"
    break  # Exit the loop if the DAG exists
  else
    echo "Waiting..."
    sleep 15  # Adjust the polling interval as needed
  fi
done

echo "-------------------------------------------------------------"
echo "... Triggering pause_all_dags in old Composer environment ..."
echo "-------------------------------------------------------------"

gcloud composer environments run ${OLD_COMPOSER_ENV} \
  --location ${OLD_COMPOSER_LOCATION} \
  dags trigger -- "pause_all_dags"

echo "-------------------------------"
echo "... Removing pause_all DAG ..."
echo "-------------------------------"

gsutil rm $OLD_DAG_FOLDER/pause_all_dags.py

echo "------------------------------------------------------"
echo "... Loading snapshot into new Composer environment ..."
echo "------------------------------------------------------"

gcloud beta composer environments snapshots load \
  ${NEW_COMPOSER_ENV} \
  --location ${NEW_COMPOSER_LOCATION} \
  --snapshot-path ${SAVED_SNAPSHOT_PATH}

echo "Rotation COMPLETE!"