#!/bin/bash

# For running in container
if [ "${HOME}" == "/" ] ; then
    export HOME=/home
fi

error() {
    echo "ERROR: $1" >&2
    exit 2
}

if [ -n "${GOOGLE_PROJECT}" ]
then
    export GCS2BQ_PROJECT="${GOOGLE_PROJECT}"
fi

if [ -z "${GCS2BQ_PROJECT}" ]
then
    error "Error: Missing BigQuery project (set environment variable GCS2BQ_PROJECT)." 1
fi
if [ -z "${GCS2BQ_DATASET}" ]
then
    error "Error: Missing BigQuery dataset (set environment variable GCS2BQ_DATASET)." 1
fi
if [ -z "${GCS2BQ_TABLE}" ]
then
    error "Error: Missing BigQuery table (set environment variable GCS2BQ_TABLE)." 1
fi
if [ -z "${GCS2BQ_BUCKET}" ]
then
    error "Error: Missing GCS bucket (set environment variable GCS2BQ_BUCKET)." 1
fi
if [ -z "${GCS2BQ_LOCATION}" ]
then
    error "Error: Missing GCS bucket/BQ dataset location (set environment variable GCS2BQ_LOCATION)." 1
fi

GCS2BQ_FILE=$(mktemp)
GCS2BQ_FILE="${GCS2BQ_FILE}.avro"
GCS2BQ_FILENAME=$(basename "$GCS2BQ_FILE")
GCS2BQ_FLAGS="-logtostderr -file ${GCS2BQ_FILE}"
if [ -n "${GCS2BQ_VERSIONS}" ]
then
    GCS2BQ_FLAGS="${GCS2BQ_FLAGS} -versions"
fi

# Intentionally split args by space.
# TODO: use array expansion, instead.
# shellcheck disable=SC2086
./gcs2bq $GCS2BQ_FLAGS || error "Export failed!" 2

gsutil mb -p "${GCS2BQ_PROJECT}" -c standard -l "${GCS2BQ_LOCATION}" -b on "gs://${GCS2BQ_BUCKET}" || echo "Info: Storage bucket already exists: ${GCS2BQ_BUCKET}"

gsutil cp "${GCS2BQ_FILE}" "gs://${GCS2BQ_BUCKET}/${GCS2BQ_FILENAME}" || error "Failed copying ${GCS2BQ_FILE} to gs://${GCS2BQ_BUCKET}/${GCS2BQ_FILENAME}!" 3

bq mk --project_id="${GCS2BQ_PROJECT}" --location="${GCS2BQ_LOCATION}" "${GCS2BQ_DATASET}" || echo "Info: BigQuery dataset already exists: ${GCS2BQ_DATASET}"

bq load --project_id="${GCS2BQ_PROJECT}" --location="${GCS2BQ_LOCATION}" --schema bigquery.schema --source_format=AVRO --use_avro_logical_types --replace=true "${GCS2BQ_DATASET}.${GCS2BQ_TABLE}" "gs://${GCS2BQ_BUCKET}/${GCS2BQ_FILENAME}" || \
  error "Failed to load gs://${GCS2BQ_BUCKET}/${GCS2BQ_FILENAME} to BigQuery table ${GCS2BQ_DATASET}.${GCS2BQ_TABLE}!" 4

gsutil rm "gs://${GCS2BQ_BUCKET}/${GCS2BQ_FILENAME}" || error "Failed deleting gs://${GCS2BQ_BUCKET}/${GCS2BQ_FILENAME}!" 5

rm -f "${GCS2BQ_FILE}"
