clear
export PROJECT_ID=$(gcloud config get-value project)

export LOG_WRAP_SPOOL=false

export QUERY=$PWD/bq_query.sql
export QUERY_LRECL=5000
export QUERY_BLKSIZE=5000

export SBT_OPTS=" -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

cd ..
sbt "runMain com.google.cloud.bqsh.Bqsh" << EOF
bq query \
  --project_id=$PROJECT_ID \
  --location="US" \
  --timeOutMinutes=1
EOF
