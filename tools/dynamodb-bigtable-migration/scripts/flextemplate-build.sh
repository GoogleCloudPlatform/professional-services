#!/bin/bash
set -eE

script_dir=$(dirname "$0")

# shellcheck source=/dev/null
source "${script_dir}/.env"

GCR_IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}"
FLEX_TEMPLATE_BASE_IMAGE="JAVA11"
METADATA_FILE_PATH="${script_dir}/flextemplate-metadata.json"
JAR_FILE_PATH="${script_dir}/../target/dynamodb-migration-1.0.jar"
FLEX_TEMPLATE_JAVA_MAIN_CLASS="com.google.cloud.pso.migration.DataLoadPipeline"
# Removed unused BUCKET_NAME or export it if used externally: export BUCKET_NAME=$(echo "${TEMP_LOCATION}" | cut -d '/' -f 3)

function build_jar() {
 echo "Creating uber jar..."

  mvn clean package -Dspotless.check=true -Dcheckstyle.skip=true -Dmaven.test.skip=true -Denforcer.skip=true \
 -Dtestargs="--testBucket=$(echo "${TEMP_LOCATION}" | cut -d '/' -f 3) \
  --testProjectId=${PROJECT_ID} \
  --testInstanceId=${BIGTABLE_INSTANCE_ID}"
}

function build_flextemplate() {
 echo "Building flex template..."

 gcloud dataflow flex-template build "${FLEX_TEMPLATE_SPEC_FILE_PATH}" \
 --image-gcr-path "${GCR_IMAGE_PATH}" \
 --sdk-language "JAVA" \
 --flex-template-base-image "${FLEX_TEMPLATE_BASE_IMAGE}" \
 --metadata-file "${METADATA_FILE_PATH}" \
 --jar "${JAR_FILE_PATH}" \
 --env FLEX_TEMPLATE_JAVA_MAIN_CLASS=${FLEX_TEMPLATE_JAVA_MAIN_CLASS}
}

build_jar