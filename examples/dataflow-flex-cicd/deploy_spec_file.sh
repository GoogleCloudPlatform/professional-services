#!/bin/bash

echo "IMAGE_NAME = $IMAGE_NAME"
echo "SPEC_FILE_NAME = $SPEC_FILE_NAME"
echo "SPEC_GCS_LOCATION = $SPEC_GCS_LOCATION"

# Create dataflow template spec file locally
echo "{\"docker_template_spec\": {\"docker_image\": \"$IMAGE_NAME\"}}" > "$SPEC_FILE_NAME"

# Copy spec file to GCS
gsutil cp "$SPEC_FILE_NAME" "$SPEC_GCS_LOCATION"