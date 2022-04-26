# Testing BQ TIME, DATETIME, TIMESTAMP types at 'bq export' with 'storage_api' flag
clear
export PROJECT_ID=$(gcloud config get-value project)

export LOG_WRAP_SPOOL=false

export COPYBOOK=$PWD/OMS1323_remote_export.cp

export QUERY=$PWD/OMS1323_remote_export.sql
export QUERY_LRECL=5000
export QUERY_BLKSIZE=5000

export OUTFILE=$PWD/OMS1323_remote_export.outfile
export OUTFILE_LRECL=80
export OUTFILE_BLKSIZE=512

export BUCKET=$PROJECT_ID-test-storage

rm $OUTFILE

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
bq export \
  --project_id=$PROJECT_ID \
  --location="US" \
  --remoteHost="127.0.0.1" \
  --remotePort="51771" \
  --run_mode=storage_api \
  --bucket=$BUCKET \
  --outDD=OUTFILE
EOF

gsutil cp gs://$BUCKET/EXPORT/OUTFILE $OUTFILE
