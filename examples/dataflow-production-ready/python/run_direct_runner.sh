#!/bin/sh

python ml_preproc/main.py --runner=DirectRunner \
  --input-csv="${INPUT_CSV}"  \
  --results-bq-table="${BQ_RESULTS}" \
  --errors-bq-table="${BQ_ERRORS}" \
  --temp_location="${TEMP_LOCATION}"