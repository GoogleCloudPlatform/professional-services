#!/bin/sh

python ml_preproc/main.py --runner=DataflowRunner \
  --project="${GCP_PROJECT}" \
  --region="${REGION}" \
  --setup_file=./ml_preproc/setup.py \
  --input-csv="${INPUT_CSV}"  \
  --results-bq-table="${BQ_RESULTS}" \
  --errors-bq-table="${BQ_ERRORS}" \
  --temp_location="${TEMP_LOCATION}"
