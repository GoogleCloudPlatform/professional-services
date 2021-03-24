
#!/bin/bash

gcloud dataflow flex-template run "ml-preproc-`date +%Y%m%d-%H%M%S`" \
  --project="${GCP_PROJECT}" \
  --region="${REGION}" \
  --template-file-gcs-location "${TEMPLATE_GCS_LOCATION}" \
  --use_public_ips \
  --parameters input-csv="${INPUT_CSV}"  \
  --parameters results-bq-table="${BQ_RESULTS}" \
  --parameters errors-bq-table="${BQ_ERRORS}" \
  --parameters setup_file=$SETUP_FILE