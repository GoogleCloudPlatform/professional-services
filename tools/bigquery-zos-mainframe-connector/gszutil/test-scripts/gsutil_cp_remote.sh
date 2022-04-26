# Works in pair with bq_export.sh
clear
export PROJECT_ID=$(gcloud config get-value project)
#export GOOGLE_APPLICATION_CREDENTIALS="/home/username/.config/gcloud/legacy_credentials/username@googlecloud.corp-partner.google.com/adc.json"

export LOG_WRAP_SPOOL=false


#File with name $INFILE_DSN should present in $GCSDSNURI bucket
#export INFILE=$PWD/bq_export.outfile
export INFILE_DSN=OUTFILE
export INFILE_LRECL=80
export INFILE_BLKSIZE=512

export COPYBOOK=$PWD/bq_export.cp

export BUCKET=$PROJECT_ID-test-storage

export GCSDSNURI=gs://$BUCKET/EXPORT
export SRVHOSTNAME=127.0.0.1
export SRVPORT=51771

export SBT_OPTS=" -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
gsutil cp \
  --project_id=$PROJECT_ID \
  --location="US" \
  --replace \
  --remote \
  --timeOutMinutes=1 \
  gs://$BUCKET/test.orc
EOF

bq load --autodetect \
  --source_format=ORC \
  --replace \
  test.something \
  gs://$BUCKET/test.orc/*