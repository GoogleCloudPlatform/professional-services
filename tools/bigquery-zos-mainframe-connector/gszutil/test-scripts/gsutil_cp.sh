# Works in pair with bq_export.sh
clear
export PROJECT_ID=$(gcloud config get-value project)

export LOG_WRAP_SPOOL=false

export INFILE=$PWD/bq_export.outfile
export INFILE_LRECL=80
export INFILE_BLKSIZE=512

export INFILE_DSN=$PWD/bq_export.outfile

export COPYBOOK=$PWD/bq_export.cp

export BUCKET=$PROJECT_ID-test-storage


export SBT_OPTS=" -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
gsutil cp \
  --project_id=$PROJECT_ID \
  --location="US" \
  --replace \
  gs://$BUCKET/test.orc
EOF

bq load --autodetect \
--source_format=ORC \
--replace \
test.something \
gs://$BUCKET/test.orc/*