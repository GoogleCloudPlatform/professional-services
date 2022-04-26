clear
export PROJECT_ID=$(gcloud config get-value project)

export LOG_WRAP_SPOOL=false

export COPYBOOK=$PWD/bq_export_remote.cp

export QUERY=$PWD/bq_export_remote.sql
export QUERY_LRECL=5000
export QUERY_BLKSIZE=5000

export OUTFILE=$PWD/bq_export_remote.outfile
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
  --run_mode=parallel \
  --bucket=$BUCKET \
  --outDD=OUTFILE
EOF

gsutil cp gs://$BUCKET/EXPORT/OUTFILE $OUTFILE
